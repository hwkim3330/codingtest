/**
 * VelocityDRIVE-SP WebSerial Client - Main Application
 */

import { WebSerialConnection, bytesToHex } from './webserial-core.js';
import { MUP1Protocol } from './mup1-protocol.js';
import {
    CoapMessageBuilder,
    createGetRequest,
    createFetchRequest,
    createIPatchRequest,
    createPostRequest,
    COAP_CODE_GET,
    COAP_CODE_FETCH,
    COAP_CODE_iPATCH,
    COAP_CODE_POST,
    COAP_CODE_PUT,
    COAP_CODE_DELETE
} from './coap-builder.js';

class VelocityDriveClient {
    constructor() {
        this.serial = new WebSerialConnection();
        this.mup1 = new MUP1Protocol();
        this.connected = false;
        this.pendingResponse = null;

        this.initUI();
        this.setupSerialHandlers();
        this.setupMUP1Handlers();
        this.loadExamples();
    }

    initUI() {
        // Connection buttons
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.deviceInfo = document.getElementById('deviceInfo');

        // Command controls
        this.methodSelect = document.getElementById('methodSelect');
        this.requestInput = document.getElementById('requestInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.clearBtn = document.getElementById('clearBtn');

        // Response controls
        this.responseFormat = document.getElementById('responseFormat');
        this.responseOutput = document.getElementById('responseOutput');
        this.copyResponseBtn = document.getElementById('copyResponseBtn');
        this.clearResponseBtn = document.getElementById('clearResponseBtn');

        // Console
        this.consoleLog = document.getElementById('consoleLog');
        this.autoScrollConsole = document.getElementById('autoScrollConsole');
        this.clearConsoleBtn = document.getElementById('clearConsoleBtn');

        // Event listeners
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.sendBtn.addEventListener('click', () => this.sendCommand());
        this.clearBtn.addEventListener('click', () => this.clearRequest());
        this.copyResponseBtn.addEventListener('click', () => this.copyResponse());
        this.clearResponseBtn.addEventListener('click', () => this.clearResponse());
        this.clearConsoleBtn.addEventListener('click', () => this.clearConsole());

        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const example = e.target.getAttribute('data-example');
                this.loadExample(example);
            });
        });
    }

    setupSerialHandlers() {
        this.serial.onData = (data) => {
            this.mup1.processData(data);
        };

        this.serial.onConnect = (info) => {
            this.connected = true;
            this.updateConnectionStatus('connected', 'Connected');
            this.log('Connected to serial device', 'success');
            this.deviceInfo.style.display = 'block';
            this.connectBtn.disabled = true;
            this.disconnectBtn.disabled = false;
            this.sendBtn.disabled = false;
        };

        this.serial.onDisconnect = () => {
            this.connected = false;
            this.updateConnectionStatus('disconnected', 'Disconnected');
            this.log('Disconnected from serial device', 'info');
            this.deviceInfo.style.display = 'none';
            this.connectBtn.disabled = false;
            this.disconnectBtn.disabled = true;
            this.sendBtn.disabled = true;
        };

        this.serial.onError = (error) => {
            this.log(`Serial error: ${error.message}`, 'error');
        };
    }

    setupMUP1Handlers() {
        this.mup1.onFrame = (payload) => {
            this.log(`Received CoAP frame (${payload.length} bytes)`, 'info');
            this.handleCoapResponse(payload);
        };

        this.mup1.onTrace = (message) => {
            this.log(`TRACE: ${message}`, 'info');
        };

        this.mup1.onAnnounce = (message) => {
            this.log(`ANNOUNCE: ${message}`, 'info');
        };

        this.mup1.onNonMUP1 = (data) => {
            const text = new TextDecoder().decode(data);
            if (text.trim().length > 0) {
                this.log(`Console: ${text}`, 'info');
            }
        };
    }

    async connect() {
        try {
            this.log('Requesting serial port...', 'info');
            await this.serial.requestPort();

            this.log('Connecting to serial port...', 'info');
            this.updateConnectionStatus('connecting', 'Connecting...');

            await this.serial.connect({ baudRate: 115200 });

            // Update device info
            const info = this.serial.getInfo();
            document.getElementById('portName').textContent = info ?
                `USB VID:${info.usbVendorId} PID:${info.usbProductId}` :
                'Connected';
        } catch (error) {
            this.log(`Connection failed: ${error.message}`, 'error');
            this.updateConnectionStatus('disconnected', 'Connection Failed');
        }
    }

    async disconnect() {
        try {
            await this.serial.disconnect();
        } catch (error) {
            this.log(`Disconnect error: ${error.message}`, 'error');
        }
    }

    async sendCommand() {
        if (!this.connected) {
            this.log('Not connected to device', 'error');
            return;
        }

        const method = this.methodSelect.value;
        const requestText = this.requestInput.value.trim();

        this.log(`Sending ${method.toUpperCase()} request...`, 'info');

        try {
            let coapMessage;

            if (method === 'get') {
                // Parse query parameter if provided
                let query = 'c=c'; // default
                if (requestText) {
                    const parsed = this.parseYAML(requestText);
                    if (parsed && typeof parsed === 'string') {
                        query = parsed;
                    }
                }
                coapMessage = createGetRequest('c', query);
            } else if (method === 'fetch') {
                const paths = this.parseYAML(requestText);
                if (!Array.isArray(paths)) {
                    throw new Error('FETCH requires an array of paths');
                }
                const cborPayload = CBOR.encode(paths);
                coapMessage = createFetchRequest('c', cborPayload);
            } else if (method === 'ipatch') {
                const patchData = this.parseYAML(requestText);
                if (!Array.isArray(patchData)) {
                    throw new Error('iPATCH requires an array of operations');
                }
                const cborPayload = CBOR.encode(patchData);
                coapMessage = createIPatchRequest('c', cborPayload);
            } else if (method === 'post') {
                const postData = this.parseYAML(requestText);
                const cborPayload = CBOR.encode(postData);
                coapMessage = createPostRequest('c', cborPayload);
            } else {
                this.log(`Method ${method} not yet implemented`, 'warning');
                return;
            }

            // Encode in MUP1
            const mup1Frame = MUP1Protocol.encodeCoapFrame(coapMessage);

            this.log(`Sending MUP1 frame (${mup1Frame.length} bytes)`, 'info');
            this.log(`Frame: ${bytesToHex(mup1Frame.slice(0, Math.min(mup1Frame.length, 50)))}...`, 'info');

            // Send frame
            await this.serial.write(mup1Frame);

            this.log('Request sent successfully', 'success');
        } catch (error) {
            this.log(`Send error: ${error.message}`, 'error');
        }
    }

    handleCoapResponse(payload) {
        try {
            this.log('Parsing CoAP response...', 'info');

            // Parse CoAP header
            const version = (payload[0] >> 6) & 0x03;
            const type = (payload[0] >> 4) & 0x03;
            const tokenLength = payload[0] & 0x0F;
            const code = payload[1];
            const messageId = (payload[2] << 8) | payload[3];

            const codeClass = (code >> 5) & 0x07;
            const codeDetail = code & 0x1F;

            this.log(`CoAP: Ver=${version} Type=${type} Code=${codeClass}.${codeDetail.toString().padStart(2, '0')} MID=${messageId}`, 'info');

            // Extract payload
            let payloadStart = 4 + tokenLength;

            // Skip options to find payload marker (0xFF)
            while (payloadStart < payload.length && payload[payloadStart] !== 0xFF) {
                const optDelta = (payload[payloadStart] >> 4) & 0x0F;
                const optLength = payload[payloadStart] & 0x0F;
                payloadStart++;

                // Handle extended delta
                if (optDelta === 13) payloadStart++;
                else if (optDelta === 14) payloadStart += 2;

                // Handle extended length
                if (optLength === 13) payloadStart++;
                else if (optLength === 14) payloadStart += 2;

                // Skip option value
                let length = optLength;
                if (optLength === 13) length = payload[payloadStart - 1] + 13;
                else if (optLength === 14) length = ((payload[payloadStart - 2] << 8) | payload[payloadStart - 1]) + 269;

                payloadStart += length;
            }

            // Extract CBOR payload
            if (payloadStart < payload.length && payload[payloadStart] === 0xFF) {
                payloadStart++; // Skip payload marker
                const cborPayload = payload.slice(payloadStart);

                this.log(`CBOR payload (${cborPayload.length} bytes)`, 'info');

                // Decode CBOR
                const decoded = CBOR.decode(cborPayload.buffer);

                // Display response
                this.displayResponse(decoded);
            } else {
                this.log('No payload in response', 'warning');
                this.responseOutput.textContent = 'No payload';
            }
        } catch (error) {
            this.log(`Response parse error: ${error.message}`, 'error');
            this.responseOutput.textContent = `Parse Error: ${error.message}`;
        }
    }

    displayResponse(data) {
        const format = this.responseFormat.value;

        try {
            if (format === 'yaml') {
                this.responseOutput.textContent = jsyaml.dump(data, { indent: 2 });
            } else if (format === 'json') {
                this.responseOutput.textContent = JSON.stringify(data, null, 2);
            } else if (format === 'cbor-hex') {
                const encoded = CBOR.encode(data);
                this.responseOutput.textContent = bytesToHex(new Uint8Array(encoded));
            }
        } catch (error) {
            this.responseOutput.textContent = `Display error: ${error.message}`;
        }
    }

    parseYAML(text) {
        try {
            return jsyaml.load(text);
        } catch (error) {
            throw new Error(`YAML parse error: ${error.message}`);
        }
    }

    updateConnectionStatus(state, text) {
        const indicator = this.connectionStatus.querySelector('.status-indicator');
        const statusText = this.connectionStatus.querySelector('.status-text');

        indicator.className = `status-indicator ${state}`;
        statusText.textContent = text;
    }

    log(message, level = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-level ${level}">${level.toUpperCase()}</span>
            <span class="log-message">${message}</span>
        `;

        this.consoleLog.appendChild(entry);

        if (this.autoScrollConsole.checked) {
            this.consoleLog.scrollTop = this.consoleLog.scrollHeight;
        }
    }

    clearConsole() {
        this.consoleLog.innerHTML = '';
    }

    clearRequest() {
        this.requestInput.value = '';
    }

    clearResponse() {
        this.responseOutput.textContent = 'Waiting for response...';
    }

    copyResponse() {
        const text = this.responseOutput.textContent;
        navigator.clipboard.writeText(text).then(() => {
            this.log('Response copied to clipboard', 'success');
        });
    }

    loadExamples() {
        this.examples = {
            'get-all': {
                method: 'get',
                request: 'c=c  # Get all config data'
            },
            'get-status': {
                method: 'get',
                request: 'd=t  # Get system state'
            },
            'fetch-ports': {
                method: 'fetch',
                request: `- "/ietf-interfaces:interfaces/interface[name='1']"
- "/ietf-interfaces:interfaces/interface[name='2']"`
            },
            'set-ip': {
                method: 'ipatch',
                request: `- ? "/ietf-interfaces:interfaces/interface[name='L3V1']"
  : name: "L3V1"
    ietf-ip:ipv4:
      address:
      - ip: "10.0.0.1"
        prefix-length: 24`
            },
            'save-config': {
                method: 'post',
                request: `- "/mchp-velocitysp-system:save-config":`
            },
            'no-sec': {
                method: 'ipatch',
                request: `- "/mchp-velocitysp-system:coap-server/config/security-mode": "no-sec"`
            }
        };
    }

    loadExample(name) {
        const example = this.examples[name];
        if (example) {
            this.methodSelect.value = example.method;
            this.requestInput.value = example.request;
            this.log(`Loaded example: ${name}`, 'info');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check WebSerial support
    if (!WebSerialConnection.isSupported()) {
        alert('WebSerial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
    }

    // Create application instance
    window.app = new VelocityDriveClient();

    console.log('VelocityDRIVE-SP WebSerial Client initialized');
});
