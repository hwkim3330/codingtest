/**
 * VelocityDRIVE-SP WebSerial Client - Main Application
 */

import { WebSerialConnection, bytesToHex } from './webserial-core.js';
import { MUP1Protocol, frameToHex, frameToString } from './mup1-protocol.js';
import {
    CoapMessageBuilder,
    createGetRequest,
    createFetchRequest,
    createIPatchRequest,
    createPostRequest,
    createPutRequest,
    createDeleteRequest,
    COAP_CODE_GET,
    COAP_CODE_FETCH,
    COAP_CODE_iPATCH,
    COAP_CODE_POST,
    COAP_CODE_PUT,
    COAP_CODE_DELETE
} from './coap-builder.js';
import { CoapParser, prettyPrintCoap } from './coap-parser.js';
import { CborHelper, EXAMPLE_REQUESTS } from './cbor-helper.js';

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

        const method = this.methodSelect.value.toUpperCase();
        const requestText = this.requestInput.value.trim();

        this.log(`▶ Preparing ${method} request`, 'info');

        try {
            let coapMessage;
            let cborPayload = null;

            // Prepare request using CborHelper
            if (method === 'GET' || method === 'DELETE') {
                // GET and DELETE don't need body, use query parameter
                let query = 'c=c'; // default
                if (requestText) {
                    // Check if it's a simple query string or needs parsing
                    if (/^[a-z]=[a-z]$/.test(requestText.replace(/\s+#.*/, '').trim())) {
                        query = requestText.replace(/\s+#.*/, '').trim();
                    }
                }
                this.log(`  Query: ${query}`, 'info');

                if (method === 'GET') {
                    coapMessage = createGetRequest('c', query);
                } else {
                    coapMessage = createDeleteRequest('c', query);
                }
            } else {
                // FETCH, iPATCH, POST, PUT - use CBOR helper
                const prepared = CborHelper.prepareRequest(method, requestText);

                if (!prepared.valid) {
                    throw new Error(prepared.error);
                }

                cborPayload = prepared.data;

                if (cborPayload) {
                    this.log(`  CBOR payload: ${cborPayload.length} bytes`, 'info');
                    this.log(`  CBOR hex: ${CborHelper.toHexString(cborPayload).slice(0, 50)}...`, 'info');
                }

                // Create CoAP message based on method
                if (method === 'FETCH') {
                    coapMessage = createFetchRequest('c', cborPayload);
                } else if (method === 'IPATCH') {
                    coapMessage = createIPatchRequest('c', cborPayload);
                } else if (method === 'POST') {
                    coapMessage = createPostRequest('c', cborPayload);
                } else if (method === 'PUT') {
                    coapMessage = createPutRequest('c', cborPayload);
                } else {
                    throw new Error(`Unknown method: ${method}`);
                }
            }

            this.log(`  CoAP message: ${coapMessage.length} bytes`, 'info');
            this.log(`  CoAP hex: ${bytesToHex(coapMessage.slice(0, Math.min(20, coapMessage.length)))}...`, 'info');

            // Encode in MUP1
            const mup1Frame = MUP1Protocol.encodeCoapFrame(coapMessage);

            this.log(`  MUP1 frame: ${mup1Frame.length} bytes`, 'info');
            this.log(`  Frame (ASCII): ${frameToString(mup1Frame.slice(0, Math.min(60, mup1Frame.length)))}...`, 'info');
            this.log(`  Frame (hex): ${frameToHex(mup1Frame.slice(0, Math.min(30, mup1Frame.length)))}...`, 'info');

            // Send frame
            await this.serial.write(mup1Frame);

            this.log(`✓ ${method} request sent successfully`, 'success');
        } catch (error) {
            this.log(`✗ Send error: ${error.message}`, 'error');
            console.error('Send error details:', error);
        }
    }

    handleCoapResponse(payload) {
        try {
            this.log('◀ Parsing CoAP response...', 'info');

            // Parse CoAP message using CoapParser
            const parsed = CoapParser.parse(payload);

            if (parsed.error) {
                this.log(`✗ CoAP parse error: ${parsed.error}`, 'error');
                this.responseOutput.textContent = `Parse Error: ${parsed.error}`;
                return;
            }

            // Log parsed header info
            const codeStr = CoapParser.codeToString(parsed.codeClass, parsed.codeDetail);
            const isSuccess = CoapParser.isSuccess(parsed.codeClass);

            this.log(`  ${prettyPrintCoap(parsed)}`, 'info');
            this.log(`  Code: ${codeStr} (${isSuccess ? 'Success' : 'Error'})`, isSuccess ? 'success' : 'error');

            if (parsed.contentFormat !== null) {
                const formatName = CoapParser.getContentFormatName(parsed.contentFormat);
                this.log(`  Content-Format: ${parsed.contentFormat} (${formatName})`, 'info');
            }

            // Handle payload
            if (parsed.payload && parsed.payload.length > 0) {
                this.log(`  Payload: ${parsed.payload.length} bytes`, 'info');
                this.log(`  Payload hex: ${bytesToHex(parsed.payload.slice(0, Math.min(20, parsed.payload.length)))}...`, 'info');

                // Format and display response
                const formatted = CborHelper.formatResponse(
                    parsed.payload,
                    parsed.contentFormat,
                    this.responseFormat.value
                );

                this.responseOutput.textContent = formatted;
                this.log(`✓ Response displayed successfully`, 'success');
            } else {
                this.log('  No payload in response', 'warning');
                this.responseOutput.textContent = `# No payload\n\nCode: ${codeStr}`;
            }
        } catch (error) {
            this.log(`✗ Response parse error: ${error.message}`, 'error');
            this.responseOutput.textContent = `Parse Error: ${error.message}\n\nRaw hex:\n${bytesToHex(payload)}`;
            console.error('Response parse error details:', error);
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
        // Use examples from cbor-helper.js
        this.examples = EXAMPLE_REQUESTS;
    }

    loadExample(name) {
        const example = this.examples[name];
        if (example) {
            this.methodSelect.value = example.method.toLowerCase();
            this.requestInput.value = example.body;
            this.log(`📋 Loaded example: ${name}`, 'info');
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
