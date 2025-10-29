/**
 * MUP1 Protocol Module (CORRECTED)
 * Implements Microchip UART Protocol #1 for CoAP frame transport
 *
 * Based on: velocitydrivesp-support/support/libeasy/handler/mup1.rb
 *
 * Frame Format: >TYPE[ESCAPED_DATA]<[<]CHECKSUM
 * - START: '>' (0x3E)
 * - TYPE: 1 byte (0x43='C' for CoAP)
 * - DATA: Variable length payload (ESCAPED)
 * - EOF: '<' (0x3C) - single if data odd length, double if even length
 * - CHECKSUM: 4-byte ASCII hex (16-bit one's complement checksum)
 *
 * Escape sequences:
 * - \> (0x5C 0x3E) → > (0x3E)
 * - \< (0x5C 0x3C) → < (0x3C)
 * - \\ (0x5C 0x5C) → \ (0x5C)
 * - \0 (0x5C 0x30) → 0x00
 * - \F (0x5C 0x46) → 0xFF
 */

// MUP1 Constants
const MUP1_SOF = 0x3E;  // '>'
const MUP1_EOF = 0x3C;  // '<'
const MUP1_ESC = 0x5C;  // '\'
const MUP1_00  = 0x30;  // '0'
const MUP1_FF  = 0x46;  // 'F'

// MUP1 Message Types
export const MUP1_CB_ANNOUNCE = 0x41;  // 'A'
export const MUP1_CB_COAP = 0x43;      // 'C'
export const MUP1_CB_PING = 0x50;      // 'P'
export const MUP1_CB_TRACE = 0x54;     // 'T'
export const MUP1_CB_NON_MUP1 = 0;

export class MUP1Protocol {
    constructor() {
        this.state = 'init';
        this.rxBuffer = new Uint8Array(0);
        this.rawBuf = '';

        // Frame assembly buffers
        this.mup1Data = [];
        this.mup1DataChk = [];
        this.mup1Chk = [];
        this.mup1Type = 0;

        // Callbacks
        this.onFrame = null;       // CoAP frames
        this.onTrace = null;       // Trace messages
        this.onAnnounce = null;    // Announce messages
        this.onNonMUP1 = null;     // Non-MUP1 data
        this.debug = false;
    }

    /**
     * Calculate 16-bit one's complement checksum (like TCP/IP)
     * Returns 4-character ASCII hex string
     */
    static calculateChecksum(data) {
        // Convert to Uint8Array if needed
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

        // Sum 16-bit words
        let sum = 0;
        for (let i = 0; i < bytes.length; i += 2) {
            const word = (bytes[i] << 8) | (bytes[i + 1] || 0);
            sum += word;
        }

        // Add carry twice
        sum = (sum >> 16) + (sum & 0xFFFF);
        sum = (sum >> 16) + (sum & 0xFFFF);

        // One's complement
        sum = ~sum & 0xFFFF;

        // Convert to 4-character ASCII hex
        return sum.toString(16).padStart(4, '0');
    }

    /**
     * Escape special characters in data
     */
    static escapeData(data) {
        const escaped = [];

        for (let i = 0; i < data.length; i++) {
            const byte = data[i];

            // Check if byte needs escaping
            if (byte === MUP1_SOF || byte === MUP1_EOF || byte === MUP1_ESC ||
                byte === 0x00 || byte === 0xFF) {
                escaped.push(MUP1_ESC);  // Add escape character

                if (byte === 0x00) {
                    escaped.push(MUP1_00);  // \0
                } else if (byte === 0xFF) {
                    escaped.push(MUP1_FF);  // \F
                } else {
                    escaped.push(byte);  // \>, \<, \\
                }
            } else {
                escaped.push(byte);
            }
        }

        return new Uint8Array(escaped);
    }

    /**
     * Unescape data
     */
    static unescapeData(escapedData) {
        const data = [];
        let i = 0;

        while (i < escapedData.length) {
            if (escapedData[i] === MUP1_ESC && i + 1 < escapedData.length) {
                const next = escapedData[i + 1];
                if (next === MUP1_00) {
                    data.push(0x00);
                } else if (next === MUP1_FF) {
                    data.push(0xFF);
                } else if (next === MUP1_SOF || next === MUP1_EOF || next === MUP1_ESC) {
                    data.push(next);
                } else {
                    // Invalid escape sequence
                    data.push(next);
                }
                i += 2;
            } else {
                data.push(escapedData[i]);
                i++;
            }
        }

        return new Uint8Array(data);
    }

    /**
     * Encode MUP1 frame
     * @param {number} type - Message type
     * @param {Uint8Array} data - Payload data (unescaped)
     * @returns {Uint8Array} Encoded frame
     */
    static encodeFrame(type, data = new Uint8Array(0)) {
        // Build un-escaped frame for checksum calculation
        const frameForChecksum = new Uint8Array(2 + data.length + 1 + (data.length % 2 === 0 ? 1 : 0));
        frameForChecksum[0] = MUP1_SOF;
        frameForChecksum[1] = type;
        frameForChecksum.set(data, 2);
        frameForChecksum[2 + data.length] = MUP1_EOF;
        if (data.length % 2 === 0) {
            frameForChecksum[2 + data.length + 1] = MUP1_EOF;
        }

        // Calculate checksum
        const checksumStr = MUP1Protocol.calculateChecksum(frameForChecksum);
        const checksumBytes = new TextEncoder().encode(checksumStr);

        // Build escaped frame
        const escapedData = MUP1Protocol.escapeData(data);
        const eofCount = (data.length % 2 === 0) ? 2 : 1;

        const frame = new Uint8Array(2 + escapedData.length + eofCount + 4);
        let offset = 0;

        frame[offset++] = MUP1_SOF;                    // >
        frame[offset++] = type;                         // TYPE
        frame.set(escapedData, offset);                // ESCAPED_DATA
        offset += escapedData.length;
        frame[offset++] = MUP1_EOF;                    // <
        if (eofCount === 2) {
            frame[offset++] = MUP1_EOF;                // << (if data even length)
        }
        frame.set(checksumBytes, offset);              // CHECKSUM (4 ASCII hex)

        return frame;
    }

    /**
     * Encode CoAP frame in MUP1
     */
    static encodeCoapFrame(coapMessage) {
        return MUP1Protocol.encodeFrame(MUP1_CB_COAP, coapMessage);
    }

    /**
     * Process received data (state machine)
     */
    processData(data) {
        // Append to raw buffer
        this.rawBuf += new TextDecoder().decode(data);

        // Append to receive buffer
        const newBuffer = new Uint8Array(this.rxBuffer.length + data.length);
        newBuffer.set(this.rxBuffer);
        newBuffer.set(data, this.rxBuffer.length);
        this.rxBuffer = newBuffer;

        // Process state machine
        for (let i = 0; i < data.length; i++) {
            this._rxSM(data[i]);
        }
    }

    /**
     * State machine for frame reception
     * @private
     */
    _rxSM(c) {
        switch (this.state) {
            case 'init':
                if (c === MUP1_SOF) {
                    this.state = 'sof';
                    this.mup1Data = [];
                    this.mup1DataChk = [MUP1_SOF];
                    this.mup1Chk = [];
                    this.mup1Type = 0;
                }
                break;

            case 'sof':
                this.mup1Type = c;
                this.state = 'data';
                this.mup1DataChk.push(c);
                break;

            case 'data':
                if (this.mup1Data.length > 1024) {
                    if (this.debug) console.error('MUP1: Frame too big');
                    this.state = 'init';
                } else if (c === MUP1_ESC) {
                    this.state = 'esc';
                } else if (c === MUP1_EOF) {
                    this.mup1DataChk.push(...this.mup1Data);
                    this.mup1DataChk.push(MUP1_EOF);

                    // Determine if we need 1 or 2 EOFs
                    if (this.mup1Data.length % 2 !== 0) {
                        this.state = 'chk0';  // Odd data length → single EOF
                    } else {
                        this.state = 'eof2';  // Even data length → double EOF
                        this.mup1DataChk.push(MUP1_EOF);
                    }
                } else if (c === MUP1_SOF || c === 0 || c === 0xFF) {
                    if (this.debug) console.error(`MUP1: Invalid data element: ${c}`);
                    this.state = 'init';
                } else {
                    this.mup1Data.push(c);
                }
                break;

            case 'esc':
                this.state = 'data';
                if (c === MUP1_SOF || c === MUP1_ESC || c === MUP1_EOF) {
                    this.mup1Data.push(c);
                } else if (c === MUP1_00) {
                    this.mup1Data.push(0x00);
                } else if (c === MUP1_FF) {
                    this.mup1Data.push(0xFF);
                } else {
                    if (this.debug) console.error(`MUP1: Invalid escape sequence: ${c}`);
                    this.state = 'init';
                }
                break;

            case 'eof2':
                if (c === MUP1_EOF) {
                    this.state = 'chk0';
                } else {
                    if (this.debug) console.error(`MUP1: Expected second EOF, got ${c}`);
                    this.state = 'init';
                }
                break;

            case 'chk0':
                this.mup1Chk.push(c);
                this.state = 'chk1';
                break;

            case 'chk1':
                this.mup1Chk.push(c);
                this.state = 'chk2';
                break;

            case 'chk2':
                this.mup1Chk.push(c);
                this.state = 'chk3';
                break;

            case 'chk3':
                this.mup1Chk.push(c);
                this.state = 'init';

                // Verify checksum
                const receivedChk = String.fromCharCode(...this.mup1Chk);
                const calculatedChk = MUP1Protocol.calculateChecksum(this.mup1DataChk);

                if (receivedChk !== calculatedChk) {
                    if (this.debug) {
                        console.error(`MUP1: Checksum error! Received: ${receivedChk}, Calculated: ${calculatedChk}`);
                    }
                } else {
                    // Frame is valid
                    this.rawBuf = '';
                    const payload = new Uint8Array(this.mup1Data);
                    this._dispatchFrame(this.mup1Type, payload);
                }
                break;
        }
    }

    /**
     * Dispatch frame to appropriate handler
     * @private
     */
    _dispatchFrame(type, payload) {
        switch (type) {
            case MUP1_CB_COAP:
                if (this.onFrame) {
                    this.onFrame(payload);
                }
                break;

            case MUP1_CB_TRACE:
                if (this.onTrace) {
                    const message = new TextDecoder().decode(payload);
                    this.onTrace(message);
                }
                break;

            case MUP1_CB_ANNOUNCE:
                if (this.onAnnounce) {
                    const message = new TextDecoder().decode(payload);
                    this.onAnnounce(message);
                }
                break;

            default:
                if (this.debug) {
                    console.warn(`MUP1: Unknown frame type: 0x${type.toString(16)}`);
                }
                break;
        }
    }

    /**
     * Clear receive buffer
     */
    clearBuffer() {
        this.rxBuffer = new Uint8Array(0);
        this.rawBuf = '';
        this.state = 'init';
    }

    /**
     * Enable/disable debug logging
     */
    setDebug(enable) {
        this.debug = enable;
    }
}

/**
 * Utility: Convert frame to hex string for debugging
 */
export function frameToHex(frame) {
    return Array.from(frame)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
}

/**
 * Utility: Convert frame to readable string
 */
export function frameToString(frame) {
    let result = '';
    for (let i = 0; i < frame.length; i++) {
        const b = frame[i];
        if (b >= 32 && b < 127) {
            result += String.fromCharCode(b);
        } else {
            result += `\\x${b.toString(16).padStart(2, '0')}`;
        }
    }
    return result;
}
