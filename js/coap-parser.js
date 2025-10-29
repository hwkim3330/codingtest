/**
 * CoAP Response Parser
 * Parses CoAP responses according to RFC7252
 *
 * Based on: velocitydrivesp-support/support/libeasy/frame/coap.rb
 */

// CoAP Message Types
export const TYPE_CONFIRMABLE = 0;
export const TYPE_NON_CONFIRMABLE = 1;
export const TYPE_ACK = 2;
export const TYPE_RESET = 3;

// CoAP Code Classes
export const CLASS_REQUEST = 0;
export const CLASS_SUCCESS = 2;
export const CLASS_CLIENT_ERROR = 4;
export const CLASS_SERVER_ERROR = 5;

// CoAP Methods
export const CODE_GET = 1;
export const CODE_POST = 2;
export const CODE_PUT = 3;
export const CODE_DELETE = 4;
export const CODE_FETCH = 5;
export const CODE_IPATCH = 7;

// CoAP Option Numbers
export const OPT_URI_PATH = 11;
export const OPT_CONTENT_FORMAT = 12;
export const OPT_URI_QUERY = 15;
export const OPT_ACCEPT = 17;
export const OPT_BLOCK2 = 23;
export const OPT_BLOCK1 = 27;

// Content Formats (RFC9254)
export const CT_TEXT_PLAIN = 0;
export const CT_APPL_JSON = 50;
export const CT_APPL_CBOR = 60;
export const CT_APPL_YANG_DATA_CBOR = 140;              // application/yang-data+cbor (data)
export const CT_APPL_YANG_IDENTIFIERS_CBOR = 141;       // application/yang-data+cbor (SID/identifiers)
export const CT_APPL_YANG_INSTANCES_CBOR = 142;          // application/yang-data+cbor (instances)

export class CoapParser {
    /**
     * Parse CoAP message
     * @param {Uint8Array} data - Raw CoAP message
     * @returns {Object} Parsed message
     */
    static parse(data) {
        if (data.length < 4) {
            return { error: 'Message too short' };
        }

        const result = {
            version: (data[0] >> 6) & 0x03,
            type: (data[0] >> 4) & 0x03,
            tokenLength: data[0] & 0x0F,
            code: data[1],
            codeClass: (data[1] >> 5) & 0x07,
            codeDetail: data[1] & 0x1F,
            messageId: (data[2] << 8) | data[3],
            token: null,
            options: [],
            payload: null,
            uriPaths: [],
            uriQuery: [],
            contentFormat: null,
            accept: null,
            block1: null,
            block2: null
        };

        if (result.version !== 1) {
            return { error: `Unexpected version: ${result.version}` };
        }

        let offset = 4;

        // Extract token
        if (result.tokenLength > 0) {
            if (data.length < offset + result.tokenLength) {
                return { error: 'Token underflow' };
            }
            result.token = data.slice(offset, offset + result.tokenLength);
            offset += result.tokenLength;
        }

        // Parse options
        let optionNumber = 0;
        while (offset < data.length && data[offset] !== 0xFF) {
            const optHeader = data[offset++];
            let optDelta = (optHeader >> 4) & 0x0F;
            let optLength = optHeader & 0x0F;

            // Handle extended delta
            if (optDelta === 13) {
                if (offset >= data.length) return { error: 'Option delta underflow' };
                optDelta = data[offset++] + 13;
            } else if (optDelta === 14) {
                if (offset + 1 >= data.length) return { error: 'Option delta underflow' };
                optDelta = ((data[offset] << 8) | data[offset + 1]) + 269;
                offset += 2;
            } else if (optDelta === 15) {
                return { error: 'Reserved option delta' };
            }

            // Handle extended length
            if (optLength === 13) {
                if (offset >= data.length) return { error: 'Option length underflow' };
                optLength = data[offset++] + 13;
            } else if (optLength === 14) {
                if (offset + 1 >= data.length) return { error: 'Option length underflow' };
                optLength = ((data[offset] << 8) | data[offset + 1]) + 269;
                offset += 2;
            } else if (optLength === 15) {
                return { error: 'Reserved option length' };
            }

            // Extract option value
            if (offset + optLength > data.length) {
                return { error: 'Option value underflow' };
            }

            const optValue = data.slice(offset, offset + optLength);
            offset += optLength;

            optionNumber += optDelta;

            // Process known options
            switch (optionNumber) {
                case OPT_URI_PATH:
                    result.uriPaths.push(new TextDecoder().decode(optValue));
                    break;

                case OPT_URI_QUERY:
                    result.uriQuery.push(new TextDecoder().decode(optValue));
                    break;

                case OPT_CONTENT_FORMAT:
                    result.contentFormat = CoapParser.decodeUint(optValue);
                    break;

                case OPT_ACCEPT:
                    result.accept = CoapParser.decodeUint(optValue);
                    break;

                case OPT_BLOCK1:
                    result.block1 = CoapParser.decodeBlock(optValue);
                    break;

                case OPT_BLOCK2:
                    result.block2 = CoapParser.decodeBlock(optValue);
                    break;
            }

            result.options.push({
                number: optionNumber,
                value: optValue
            });
        }

        // Extract payload
        if (offset < data.length) {
            if (data[offset] !== 0xFF) {
                return { error: `Expected payload marker, got ${data[offset]}` };
            }
            offset++; // Skip 0xFF marker
            result.payload = data.slice(offset);
        }

        return result;
    }

    /**
     * Decode unsigned integer from option value
     */
    static decodeUint(bytes) {
        if (bytes.length === 0) return 0;
        let value = 0;
        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8) | bytes[i];
        }
        return value;
    }

    /**
     * Decode Block option (Block1 or Block2)
     */
    static decodeBlock(bytes) {
        if (bytes.length === 0) return null;

        const lastByte = bytes[bytes.length - 1];
        const more = (lastByte & 0x08) >> 3;
        const szx = lastByte & 0x07;
        const blockSize = Math.pow(2, szx + 4);

        let num = 0;
        for (let i = 0; i < bytes.length - 1; i++) {
            num = (num << 8) | bytes[i];
        }
        num = (num << 4) | ((lastByte & 0xF0) >> 4);

        return {
            num: num,
            more: more,
            size: blockSize
        };
    }

    /**
     * Get code as string (e.g., "2.05")
     */
    static codeToString(codeClass, codeDetail) {
        return `${codeClass}.${codeDetail.toString().padStart(2, '0')}`;
    }

    /**
     * Check if response is success (2.xx)
     */
    static isSuccess(codeClass) {
        return codeClass === CLASS_SUCCESS;
    }

    /**
     * Get content format name
     */
    static getContentFormatName(format) {
        const formats = {
            [CT_TEXT_PLAIN]: 'text/plain',
            [CT_APPL_JSON]: 'application/json',
            [CT_APPL_CBOR]: 'application/cbor',
            [CT_APPL_YANG_DATA_CBOR]: 'application/yang-data+cbor (data)',
            [CT_APPL_YANG_IDENTIFIERS_CBOR]: 'application/yang-data+cbor (identifiers)',
            [CT_APPL_YANG_INSTANCES_CBOR]: 'application/yang-data+cbor (instances)'
        };
        return formats[format] || `Unknown (${format})`;
    }
}

/**
 * Pretty print CoAP message
 */
export function prettyPrintCoap(parsed) {
    if (parsed.error) {
        return `ERROR: ${parsed.error}`;
    }

    const typeNames = ['CON', 'NON', 'ACK', 'RST'];
    let str = `${typeNames[parsed.type]} [MID=0x${parsed.messageId.toString(16).padStart(4, '0')}]`;
    str += ` ${parsed.codeClass}.${parsed.codeDetail.toString().padStart(2, '0')}`;

    if (parsed.token) {
        str += ` Token=${Array.from(parsed.token).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    }

    if (parsed.uriPaths.length > 0) {
        str += ` URI=/${parsed.uriPaths.join('/')}`;
    }

    if (parsed.uriQuery.length > 0) {
        str += `?${parsed.uriQuery.join('&')}`;
    }

    if (parsed.contentFormat !== null) {
        str += ` CT=${parsed.contentFormat}`;
    }

    if (parsed.accept !== null) {
        str += ` Accept=${parsed.accept}`;
    }

    if (parsed.block1) {
        str += ` Block1=${parsed.block1.num}/${parsed.block1.more}/${parsed.block1.size}`;
    }

    if (parsed.block2) {
        str += ` Block2=${parsed.block2.num}/${parsed.block2.more}/${parsed.block2.size}`;
    }

    if (parsed.payload) {
        str += ` Payload=${parsed.payload.length} bytes`;
    }

    return str;
}
