/**
 * CoAP Message Builder Module
 * Implements CoAP message construction for CORECONF requests
 *
 * CoAP Message Format (RFC7252):
 * 0                   1                   2                   3
 * 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |Ver| T |  TKL  |      Code     |          Message ID           |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |   Token (if any, TKL bytes) ...
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |   Options (if any) ...
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |1 1 1 1 1 1 1 1|    Payload (if any) ...
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *
 * References:
 * - RFC7252: CoAP
 * - RFC9254: CBOR Encoding of YANG (CORECONF)
 */

// CoAP Version
const COAP_VERSION = 1;

// CoAP Message Types
export const COAP_TYPE_CON = 0;  // Confirmable
export const COAP_TYPE_NON = 1;  // Non-confirmable
export const COAP_TYPE_ACK = 2;  // Acknowledgement
export const COAP_TYPE_RST = 3;  // Reset

// CoAP Method Codes
export const COAP_CODE_EMPTY = 0x00;
export const COAP_CODE_GET = 0x01;
export const COAP_CODE_POST = 0x02;
export const COAP_CODE_PUT = 0x03;
export const COAP_CODE_DELETE = 0x04;
export const COAP_CODE_FETCH = 0x05;
export const COAP_CODE_PATCH = 0x06;
export const COAP_CODE_iPATCH = 0x07;

// CoAP Option Numbers
export const COAP_OPTION_URI_PATH = 11;
export const COAP_OPTION_CONTENT_FORMAT = 12;
export const COAP_OPTION_ACCEPT = 17;

// CORECONF Content Formats (RFC9254)
export const CONTENT_FORMAT_CBOR = 60;                          // application/cbor
export const CONTENT_FORMAT_YANG_DATA_CBOR = 140;               // application/yang-data+cbor (data)
export const CONTENT_FORMAT_YANG_IDENTIFIERS_CBOR = 141;        // application/yang-data+cbor (SID/identifiers)
export const CONTENT_FORMAT_YANG_INSTANCES_CBOR = 142;          // application/yang-data+cbor (instances)

// Payload Marker
const PAYLOAD_MARKER = 0xFF;

export class CoapMessageBuilder {
    constructor() {
        this.version = COAP_VERSION;
        this.type = COAP_TYPE_CON;
        this.tokenLength = 0;
        this.code = COAP_CODE_GET;
        this.messageId = 0;
        this.token = new Uint8Array(0);
        this.options = [];
        this.payload = new Uint8Array(0);
    }

    /**
     * Set message type
     * @param {number} type - Message type (CON, NON, ACK, RST)
     */
    setType(type) {
        this.type = type;
        return this;
    }

    /**
     * Set method code
     * @param {number} code - Method code
     */
    setCode(code) {
        this.code = code;
        return this;
    }

    /**
     * Set message ID
     * @param {number} id - Message ID (0-65535)
     */
    setMessageId(id) {
        this.messageId = id & 0xFFFF;
        return this;
    }

    /**
     * Set token
     * @param {Uint8Array} token - Token (0-8 bytes)
     */
    setToken(token) {
        if (token.length > 8) {
            throw new Error('Token length cannot exceed 8 bytes');
        }
        this.token = token;
        this.tokenLength = token.length;
        return this;
    }

    /**
     * Add an option
     * @param {number} number - Option number
     * @param {Uint8Array|string|number} value - Option value
     */
    addOption(number, value) {
        let optionValue;

        if (typeof value === 'string') {
            optionValue = new TextEncoder().encode(value);
        } else if (typeof value === 'number') {
            // Encode number as minimal bytes
            if (value === 0) {
                optionValue = new Uint8Array(0);
            } else {
                const bytes = [];
                let v = value;
                while (v > 0) {
                    bytes.unshift(v & 0xFF);
                    v = v >> 8;
                }
                optionValue = new Uint8Array(bytes);
            }
        } else {
            optionValue = value;
        }

        this.options.push({
            number: number,
            value: optionValue
        });

        return this;
    }

    /**
     * Add URI-Path option
     * @param {string} path - URI path (e.g., "c" for config)
     */
    addUriPath(path) {
        return this.addOption(COAP_OPTION_URI_PATH, path);
    }

    /**
     * Add Content-Format option
     * @param {number} format - Content format code
     */
    addContentFormat(format) {
        return this.addOption(COAP_OPTION_CONTENT_FORMAT, format);
    }

    /**
     * Add Accept option
     * @param {number} format - Accepted content format code
     */
    addAccept(format) {
        return this.addOption(COAP_OPTION_ACCEPT, format);
    }

    /**
     * Set payload
     * @param {Uint8Array} payload - Message payload
     */
    setPayload(payload) {
        this.payload = payload;
        return this;
    }

    /**
     * Build CoAP message
     * @returns {Uint8Array} Encoded CoAP message
     */
    build() {
        const parts = [];

        // Header (4 bytes)
        const header = new Uint8Array(4);

        // Byte 0: Version (2 bits) + Type (2 bits) + Token Length (4 bits)
        header[0] = ((this.version & 0x03) << 6) |
                    ((this.type & 0x03) << 4) |
                    (this.tokenLength & 0x0F);

        // Byte 1: Code
        header[1] = this.code;

        // Bytes 2-3: Message ID
        header[2] = (this.messageId >> 8) & 0xFF;
        header[3] = this.messageId & 0xFF;

        parts.push(header);

        // Token
        if (this.tokenLength > 0) {
            parts.push(this.token);
        }

        // Options (sorted by option number)
        const sortedOptions = this.options.slice().sort((a, b) => a.number - b.number);
        if (sortedOptions.length > 0) {
            parts.push(this._encodeOptions(sortedOptions));
        }

        // Payload
        if (this.payload.length > 0) {
            parts.push(new Uint8Array([PAYLOAD_MARKER]));
            parts.push(this.payload);
        }

        // Concatenate all parts
        const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
        const message = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of parts) {
            message.set(part, offset);
            offset += part.length;
        }

        return message;
    }

    /**
     * Encode options with delta encoding
     * @private
     * @param {Array} options - Sorted options
     * @returns {Uint8Array} Encoded options
     */
    _encodeOptions(options) {
        const encoded = [];
        let previousNumber = 0;

        for (const option of options) {
            const delta = option.number - previousNumber;
            const length = option.value.length;

            // Encode option delta and length
            const { header, extDelta, extLength } = this._encodeOptionDeltaLength(delta, length);
            encoded.push(header);

            if (extDelta) encoded.push(...extDelta);
            if (extLength) encoded.push(...extLength);

            // Option value
            encoded.push(...Array.from(option.value));

            previousNumber = option.number;
        }

        return new Uint8Array(encoded);
    }

    /**
     * Encode option delta and length
     * @private
     * @param {number} delta - Option delta
     * @param {number} length - Option length
     * @returns {Object} {header, extDelta, extLength}
     */
    _encodeOptionDeltaLength(delta, length) {
        let deltaNibble, extDelta = null;
        let lengthNibble, extLength = null;

        // Encode delta
        if (delta < 13) {
            deltaNibble = delta;
        } else if (delta < 269) {
            deltaNibble = 13;
            extDelta = [delta - 13];
        } else {
            deltaNibble = 14;
            const extended = delta - 269;
            extDelta = [(extended >> 8) & 0xFF, extended & 0xFF];
        }

        // Encode length
        if (length < 13) {
            lengthNibble = length;
        } else if (length < 269) {
            lengthNibble = 13;
            extLength = [length - 13];
        } else {
            lengthNibble = 14;
            const extended = length - 269;
            extLength = [(extended >> 8) & 0xFF, extended & 0xFF];
        }

        const header = (deltaNibble << 4) | lengthNibble;

        return { header, extDelta, extLength };
    }

    /**
     * Generate random token
     * @param {number} length - Token length (default: 4)
     * @returns {Uint8Array} Random token
     */
    static generateToken(length = 4) {
        const token = new Uint8Array(length);
        crypto.getRandomValues(token);
        return token;
    }

    /**
     * Generate random message ID
     * @returns {number} Random message ID
     */
    static generateMessageId() {
        return Math.floor(Math.random() * 65536);
    }
}

/**
 * Helper: Create CORECONF GET request
 * @param {string} path - URI path (e.g., "c" for config)
 * @param {string} query - Query string (e.g., "c=c")
 * @returns {Uint8Array} CoAP message
 */
export function createGetRequest(path = "c", query = null) {
    const builder = new CoapMessageBuilder()
        .setType(COAP_TYPE_CON)
        .setCode(COAP_CODE_GET)
        .setMessageId(CoapMessageBuilder.generateMessageId())
        .setToken(CoapMessageBuilder.generateToken())
        .addUriPath(path)
        .addAccept(CONTENT_FORMAT_YANG_INSTANCES_CBOR);  // Accept instances (142)

    if (query) {
        builder.addUriQuery(query);  // FIX: Use addUriQuery, not addUriPath
    }

    return builder.build();
}

/**
 * Helper: Create CORECONF FETCH request
 * @param {string} path - URI path
 * @param {Uint8Array} cborPayload - CBOR-encoded paths
 * @returns {Uint8Array} CoAP message
 */
export function createFetchRequest(path, cborPayload) {
    return new CoapMessageBuilder()
        .setType(COAP_TYPE_CON)
        .setCode(COAP_CODE_FETCH)
        .setMessageId(CoapMessageBuilder.generateMessageId())
        .setToken(CoapMessageBuilder.generateToken())
        .addUriPath(path)
        .addContentFormat(CONTENT_FORMAT_YANG_IDENTIFIERS_CBOR)   // Request: identifiers (141)
        .addAccept(CONTENT_FORMAT_YANG_INSTANCES_CBOR)             // Response: instances (142)
        .setPayload(cborPayload)
        .build();
}

/**
 * Helper: Create CORECONF iPATCH request
 * @param {string} path - URI path
 * @param {Uint8Array} cborPayload - CBOR-encoded patch data
 * @returns {Uint8Array} CoAP message
 */
export function createIPatchRequest(path, cborPayload) {
    return new CoapMessageBuilder()
        .setType(COAP_TYPE_CON)
        .setCode(COAP_CODE_iPATCH)
        .setMessageId(CoapMessageBuilder.generateMessageId())
        .setToken(CoapMessageBuilder.generateToken())
        .addUriPath(path)
        .addContentFormat(CONTENT_FORMAT_YANG_INSTANCES_CBOR)    // Request: instances (142)
        .addAccept(CONTENT_FORMAT_YANG_INSTANCES_CBOR)            // Response: instances (142)
        .setPayload(cborPayload)
        .build();
}

/**
 * Helper: Create CORECONF POST request
 * @param {string} path - URI path
 * @param {Uint8Array} cborPayload - CBOR-encoded data
 * @returns {Uint8Array} CoAP message
 */
export function createPostRequest(path, cborPayload) {
    return new CoapMessageBuilder()
        .setType(COAP_TYPE_CON)
        .setCode(COAP_CODE_POST)
        .setMessageId(CoapMessageBuilder.generateMessageId())
        .setToken(CoapMessageBuilder.generateToken())
        .addUriPath(path)
        .addContentFormat(CONTENT_FORMAT_YANG_INSTANCES_CBOR)    // Request: instances (142)
        .addAccept(CONTENT_FORMAT_YANG_INSTANCES_CBOR)            // Response: instances (142)
        .setPayload(cborPayload)
        .build();
}

/**
 * Create a PUT request
 * @param {string} path - URI path
 * @param {Uint8Array} cborPayload - CBOR-encoded data
 * @returns {Uint8Array} CoAP message
 */
export function createPutRequest(path, cborPayload) {
    return new CoapMessageBuilder()
        .setType(COAP_TYPE_CON)
        .setCode(COAP_CODE_PUT)
        .setMessageId(CoapMessageBuilder.generateMessageId())
        .setToken(CoapMessageBuilder.generateToken())
        .addUriPath(path)
        .addContentFormat(CONTENT_FORMAT_YANG_DATA_CBOR)      // Request: data (140)
        .addAccept(CONTENT_FORMAT_YANG_DATA_CBOR)              // Response: data (140)
        .setPayload(cborPayload)
        .build();
}

/**
 * Create a DELETE request
 * @param {string} path - URI path
 * @param {string} query - Query parameters (optional)
 * @returns {Uint8Array} CoAP message
 */
export function createDeleteRequest(path, query = null) {
    const builder = new CoapMessageBuilder()
        .setType(COAP_TYPE_CON)
        .setCode(COAP_CODE_DELETE)
        .setMessageId(CoapMessageBuilder.generateMessageId())
        .setToken(CoapMessageBuilder.generateToken())
        .addUriPath(path);

    if (query) {
        builder.addUriQuery(query);
    }

    return builder.build();
}
