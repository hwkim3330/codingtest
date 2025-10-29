/**
 * CBOR Helper for CORECONF
 * Handles encoding/decoding of YANG data in CBOR format
 *
 * Based on: RFC9254 CBOR Encoding of YANG Data
 * Content-Types:
 * - 141: application/yang-data+cbor (SID-based identifiers)
 * - 142: application/yang-data+cbor (instances)
 */

export class CborHelper {
    /**
     * Encode FETCH request (array of paths)
     * @param {Array<string>} paths - Array of YANG paths
     * @returns {Uint8Array} CBOR-encoded data
     */
    static encodeFetchRequest(paths) {
        // FETCH body is array of strings
        // Example: ["/path1", "/path2"]
        return CBOR.encode(paths);
    }

    /**
     * Encode iPATCH request (array of operations)
     * @param {Array<Object>} operations - Array of patch operations
     * @returns {Uint8Array} CBOR-encoded data
     *
     * Example input:
     * [
     *   {"/path": "value"},
     *   {"/path": {obj: "value"}}
     * ]
     */
    static encodeIPatchRequest(operations) {
        // iPATCH body is array of objects
        // Each object is a map with one entry: path → value
        return CBOR.encode(operations);
    }

    /**
     * Encode PUT/POST request
     * @param {Object|Array} data - Request data
     * @returns {Uint8Array} CBOR-encoded data
     */
    static encodeRequest(data) {
        return CBOR.encode(data);
    }

    /**
     * Decode CBOR response to JavaScript object
     * @param {Uint8Array} cborData - CBOR-encoded response
     * @returns {Object} Decoded data
     */
    static decode(cborData) {
        try {
            return CBOR.decode(cborData.buffer);
        } catch (error) {
            console.error('CBOR decode error:', error);
            return { error: `CBOR decode failed: ${error.message}` };
        }
    }

    /**
     * Convert JavaScript object to YAML string
     * @param {Object} obj - JavaScript object
     * @returns {string} YAML string
     */
    static toYAML(obj) {
        try {
            return jsyaml.dump(obj, {
                indent: 2,
                lineWidth: -1,
                noRefs: true,
                sortKeys: false
            });
        } catch (error) {
            console.error('YAML conversion error:', error);
            return `# YAML conversion error: ${error.message}`;
        }
    }

    /**
     * Convert JavaScript object to JSON string
     * @param {Object} obj - JavaScript object
     * @returns {string} JSON string
     */
    static toJSON(obj) {
        try {
            return JSON.stringify(obj, null, 2);
        } catch (error) {
            console.error('JSON conversion error:', error);
            return `{"error": "JSON conversion failed: ${error.message}"}`;
        }
    }

    /**
     * Parse YAML/JSON input to JavaScript object
     * @param {string} input - YAML or JSON string
     * @returns {Object} Parsed object
     */
    static parseInput(input) {
        const trimmed = input.trim();

        // Try YAML first (also handles JSON since JSON is valid YAML)
        try {
            return jsyaml.load(trimmed);
        } catch (yamlError) {
            // Try JSON as fallback
            try {
                return JSON.parse(trimmed);
            } catch (jsonError) {
                throw new Error(`Failed to parse input as YAML or JSON:\nYAML: ${yamlError.message}\nJSON: ${jsonError.message}`);
            }
        }
    }

    /**
     * Convert CBOR bytes to hex string for display
     * @param {Uint8Array} cborData - CBOR data
     * @returns {string} Hex string with spaces
     */
    static toHexString(cborData) {
        return Array.from(cborData)
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
    }

    /**
     * Convert CBOR bytes to diagnostic notation (if possible)
     * @param {Uint8Array} cborData - CBOR data
     * @returns {string} Diagnostic notation or hex
     */
    static toDiagnostic(cborData) {
        try {
            const decoded = CBOR.decode(cborData.buffer);
            return JSON.stringify(decoded, null, 2);
        } catch (error) {
            return CborHelper.toHexString(cborData);
        }
    }

    /**
     * Validate and prepare request data based on method
     * @param {string} method - CoAP method (GET, FETCH, iPATCH, POST, PUT, DELETE)
     * @param {string} input - User input (YAML/JSON)
     * @returns {Object} {valid: boolean, data: Uint8Array|null, error: string|null}
     */
    static prepareRequest(method, input) {
        try {
            const methodUpper = method.toUpperCase();

            // GET and DELETE don't need body
            if (methodUpper === 'GET' || methodUpper === 'DELETE') {
                if (input.trim().length > 0) {
                    return {
                        valid: false,
                        data: null,
                        error: `${methodUpper} should not have a request body`
                    };
                }
                return { valid: true, data: null, error: null };
            }

            // Other methods need body
            if (input.trim().length === 0) {
                return {
                    valid: false,
                    data: null,
                    error: `${methodUpper} requires a request body`
                };
            }

            // Parse input
            const parsed = CborHelper.parseInput(input);

            // Validate structure based on method
            if (methodUpper === 'FETCH') {
                if (!Array.isArray(parsed)) {
                    return {
                        valid: false,
                        data: null,
                        error: 'FETCH request must be an array of paths'
                    };
                }
                const cbor = CborHelper.encodeFetchRequest(parsed);
                return { valid: true, data: cbor, error: null };
            }

            if (methodUpper === 'IPATCH') {
                if (!Array.isArray(parsed)) {
                    return {
                        valid: false,
                        data: null,
                        error: 'iPATCH request must be an array of operations'
                    };
                }
                const cbor = CborHelper.encodeIPatchRequest(parsed);
                return { valid: true, data: cbor, error: null };
            }

            // POST, PUT - generic encoding
            const cbor = CborHelper.encodeRequest(parsed);
            return { valid: true, data: cbor, error: null };

        } catch (error) {
            return {
                valid: false,
                data: null,
                error: `Request preparation failed: ${error.message}`
            };
        }
    }

    /**
     * Format response based on content format
     * @param {Uint8Array} payload - Response payload
     * @param {number|null} contentFormat - CoAP content format
     * @param {string} outputFormat - Desired output format (yaml/json/cbor-hex)
     * @returns {string} Formatted response
     */
    static formatResponse(payload, contentFormat, outputFormat = 'yaml') {
        if (!payload || payload.length === 0) {
            return '# Empty response';
        }

        // Check if it's CBOR content
        const isCbor = contentFormat === 60 || contentFormat === 140 ||
                       contentFormat === 141 || contentFormat === 142;

        if (!isCbor) {
            // Plain text or other format
            try {
                return new TextDecoder().decode(payload);
            } catch (error) {
                return CborHelper.toHexString(payload);
            }
        }

        // CBOR content - decode it
        const decoded = CborHelper.decode(payload);

        if (decoded.error) {
            return `# ${decoded.error}\n\nRaw hex:\n${CborHelper.toHexString(payload)}`;
        }

        // Format based on requested output
        switch (outputFormat) {
            case 'json':
                return CborHelper.toJSON(decoded);

            case 'cbor-hex':
                return `# CBOR Hex:\n${CborHelper.toHexString(payload)}\n\n# Decoded:\n${CborHelper.toYAML(decoded)}`;

            case 'yaml':
            default:
                return CborHelper.toYAML(decoded);
        }
    }
}

/**
 * Example request structures for documentation
 */
export const EXAMPLE_REQUESTS = {
    'get-all': {
        method: 'GET',
        query: 'c=c',
        body: ''
    },

    'get-status': {
        method: 'GET',
        query: 'c=n',
        body: ''
    },

    'fetch-ports': {
        method: 'FETCH',
        query: '',
        body: `- "/ietf-interfaces:interfaces/interface[name='1']"\n- "/ietf-interfaces:interfaces/interface[name='2']"`
    },

    'set-ip': {
        method: 'iPATCH',
        query: '',
        body: `- ? "/ietf-interfaces:interfaces/interface[name='L3V1']"\n  : name: "L3V1"\n    ietf-ip:ipv4:\n      address:\n      - ip: "10.0.0.1"\n        prefix-length: 24`
    },

    'save-config': {
        method: 'POST',
        query: '',
        body: `- "/mchp-velocitysp-system:save-config":`
    },

    'no-sec': {
        method: 'iPATCH',
        query: '',
        body: `- "/mchp-velocitysp-system:coap-server/config/security-mode": "no-sec"`
    }
};
