/**
 * MUP1 Protocol Module
 * Implements Microchip UART Protocol #1 for CoAP frame transport
 *
 * Frame Format: >TYPE[DATA]<CHECKSUM
 * - START: '>' (0x3E)
 * - TYPE: 1 byte command type
 * - DATA: Variable length payload
 * - END: '<' (0x3C)
 * - CHECKSUM: XOR of all bytes between > and <
 *
 * References:
 * - velocitydrivesp-support/support/libeasy/handler.rb
 */

// MUP1 Frame Delimiters
const MUP1_START = 0x3E;  // '>'
const MUP1_END = 0x3C;    // '<'

// MUP1 Message Types
export const MUP1_TYPE_COAP = 0x43;         // 'C' - CoAP frame
export const MUP1_TYPE_TRACE = 0x54;        // 'T' - Trace message
export const MUP1_TYPE_ANNOUNCE = 0x41;     // 'A' - Announce message
export const MUP1_TYPE_NON_MUP1 = 0x00;     // Non-MUP1 data

export class MUP1Protocol {
    constructor() {
        this.rxBuffer = new Uint8Array(0);
        this.onFrame = null;
        this.onTrace = null;
        this.onAnnounce = null;
        this.onNonMUP1 = null;
        this.debug = false;
    }

    /**
     * Calculate XOR checksum
     * @param {Uint8Array} data - Data to checksum
     * @returns {number} Checksum value
     */
    static calculateChecksum(data) {
        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum ^= data[i];
        }
        return checksum;
    }

    /**
     * Encode MUP1 frame
     * @param {number} type - Message type
     * @param {Uint8Array} payload - Payload data
     * @returns {Uint8Array} Encoded frame
     */
    static encodeFrame(type, payload) {
        // Frame structure: >TYPE[PAYLOAD]<CHECKSUM
        const frameWithoutChecksum = new Uint8Array(2 + payload.length + 1);
        frameWithoutChecksum[0] = MUP1_START;
        frameWithoutChecksum[1] = type;
        frameWithoutChecksum.set(payload, 2);
        frameWithoutChecksum[frameWithoutChecksum.length - 1] = MUP1_END;

        // Calculate checksum (XOR of everything except START)
        const checksumData = frameWithoutChecksum.slice(1);
        const checksum = MUP1Protocol.calculateChecksum(checksumData);

        // Complete frame
        const frame = new Uint8Array(frameWithoutChecksum.length + 1);
        frame.set(frameWithoutChecksum);
        frame[frame.length - 1] = checksum;

        return frame;
    }

    /**
     * Encode CoAP frame in MUP1
     * @param {Uint8Array} coapMessage - CoAP message
     * @returns {Uint8Array} MUP1 frame
     */
    static encodeCoapFrame(coapMessage) {
        return MUP1Protocol.encodeFrame(MUP1_TYPE_COAP, coapMessage);
    }

    /**
     * Process received data
     * @param {Uint8Array} data - Received data
     */
    processData(data) {
        // Append to receive buffer
        const newBuffer = new Uint8Array(this.rxBuffer.length + data.length);
        newBuffer.set(this.rxBuffer);
        newBuffer.set(data, this.rxBuffer.length);
        this.rxBuffer = newBuffer;

        // Try to extract frames
        while (this.rxBuffer.length > 0) {
            const extracted = this._extractFrame();
            if (!extracted) {
                break;
            }
        }
    }

    /**
     * Extract and process one frame from buffer
     * @private
     * @returns {boolean} True if frame was extracted
     */
    _extractFrame() {
        // Find start marker
        let startIdx = -1;
        for (let i = 0; i < this.rxBuffer.length; i++) {
            if (this.rxBuffer[i] === MUP1_START) {
                startIdx = i;
                break;
            }
        }

        // No start marker found
        if (startIdx === -1) {
            // Check for non-MUP1 data
            if (this.rxBuffer.length > 0 && this.onNonMUP1) {
                this.onNonMUP1(this.rxBuffer);
            }
            this.rxBuffer = new Uint8Array(0);
            return false;
        }

        // Discard any non-MUP1 data before start marker
        if (startIdx > 0) {
            if (this.onNonMUP1) {
                this.onNonMUP1(this.rxBuffer.slice(0, startIdx));
            }
            this.rxBuffer = this.rxBuffer.slice(startIdx);
        }

        // Need at least: START + TYPE + END + CHECKSUM = 4 bytes
        if (this.rxBuffer.length < 4) {
            return false;
        }

        // Find end marker
        let endIdx = -1;
        for (let i = 1; i < this.rxBuffer.length; i++) {
            if (this.rxBuffer[i] === MUP1_END) {
                endIdx = i;
                break;
            }
        }

        // No end marker found yet
        if (endIdx === -1) {
            // Buffer too large without end marker - discard
            if (this.rxBuffer.length > 4096) {
                this.rxBuffer = new Uint8Array(0);
            }
            return false;
        }

        // Check if we have the checksum byte
        if (this.rxBuffer.length < endIdx + 2) {
            return false;
        }

        // Extract frame
        const frameLength = endIdx + 2; // Including checksum
        const frame = this.rxBuffer.slice(0, frameLength);
        this.rxBuffer = this.rxBuffer.slice(frameLength);

        // Verify checksum
        const receivedChecksum = frame[frame.length - 1];
        const checksumData = frame.slice(1, frame.length - 1);
        const calculatedChecksum = MUP1Protocol.calculateChecksum(checksumData);

        if (receivedChecksum !== calculatedChecksum) {
            if (this.debug) {
                console.error('MUP1: Checksum mismatch',
                    `received: 0x${receivedChecksum.toString(16)}`,
                    `calculated: 0x${calculatedChecksum.toString(16)}`);
            }
            return true; // Continue processing buffer
        }

        // Extract type and payload
        const type = frame[1];
        const payload = frame.slice(2, endIdx);

        // Dispatch based on type
        this._dispatchFrame(type, payload);

        return true;
    }

    /**
     * Dispatch frame to appropriate handler
     * @private
     * @param {number} type - Frame type
     * @param {Uint8Array} payload - Frame payload
     */
    _dispatchFrame(type, payload) {
        switch (type) {
            case MUP1_TYPE_COAP:
                if (this.onFrame) {
                    this.onFrame(payload);
                }
                break;

            case MUP1_TYPE_TRACE:
                if (this.onTrace) {
                    const message = new TextDecoder().decode(payload);
                    this.onTrace(message);
                }
                break;

            case MUP1_TYPE_ANNOUNCE:
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
    }

    /**
     * Enable/disable debug logging
     * @param {boolean} enable - Enable debug
     */
    setDebug(enable) {
        this.debug = enable;
    }
}

/**
 * Utility: Convert frame to hex string for debugging
 * @param {Uint8Array} frame - Frame data
 * @returns {string} Hex representation
 */
export function frameToHex(frame) {
    return Array.from(frame)
        .map(b => {
            if (b === MUP1_START) return '>';
            if (b === MUP1_END) return '<';
            if (b >= 32 && b < 127) return String.fromCharCode(b);
            return b.toString(16).padStart(2, '0');
        })
        .join(' ');
}

/**
 * Utility: Validate MUP1 frame structure
 * @param {Uint8Array} frame - Frame to validate
 * @returns {Object} Validation result {valid, error, type, payload}
 */
export function validateFrame(frame) {
    if (frame.length < 4) {
        return { valid: false, error: 'Frame too short' };
    }

    if (frame[0] !== MUP1_START) {
        return { valid: false, error: 'Missing start marker' };
    }

    // Find end marker
    let endIdx = -1;
    for (let i = 1; i < frame.length - 1; i++) {
        if (frame[i] === MUP1_END) {
            endIdx = i;
            break;
        }
    }

    if (endIdx === -1) {
        return { valid: false, error: 'Missing end marker' };
    }

    if (frame.length !== endIdx + 2) {
        return { valid: false, error: 'Incorrect frame length' };
    }

    // Verify checksum
    const receivedChecksum = frame[frame.length - 1];
    const checksumData = frame.slice(1, frame.length - 1);
    const calculatedChecksum = MUP1Protocol.calculateChecksum(checksumData);

    if (receivedChecksum !== calculatedChecksum) {
        return {
            valid: false,
            error: `Checksum mismatch (expected: 0x${calculatedChecksum.toString(16)}, got: 0x${receivedChecksum.toString(16)})`
        };
    }

    const type = frame[1];
    const payload = frame.slice(2, endIdx);

    return {
        valid: true,
        type: type,
        payload: payload
    };
}
