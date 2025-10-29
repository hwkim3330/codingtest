/**
 * WebSerial Core Module
 * Provides WebSerial API wrapper for serial communication
 *
 * References:
 * - https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
 * - https://wicg.github.io/serial/
 */

export class WebSerialConnection {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.inputStream = null;
        this.outputStream = null;
        this.readableStreamClosed = null;
        this.writableStreamClosed = null;
        this.connected = false;

        // Callbacks
        this.onData = null;
        this.onConnect = null;
        this.onDisconnect = null;
        this.onError = null;
    }

    /**
     * Check if WebSerial API is supported
     */
    static isSupported() {
        return 'serial' in navigator;
    }

    /**
     * Request serial port from user
     * @param {Object} options - Serial port request options
     */
    async requestPort(options = {}) {
        if (!WebSerialConnection.isSupported()) {
            throw new Error('WebSerial API is not supported in this browser');
        }

        try {
            // Request port from user
            this.port = await navigator.serial.requestPort(options);
            return this.port;
        } catch (error) {
            throw new Error(`Failed to request serial port: ${error.message}`);
        }
    }

    /**
     * Connect to serial port
     * @param {Object} options - Serial port options (baudRate, dataBits, stopBits, parity)
     */
    async connect(options = {}) {
        if (!this.port) {
            throw new Error('No serial port selected. Call requestPort() first.');
        }

        // Default options
        const serialOptions = {
            baudRate: options.baudRate || 115200,
            dataBits: options.dataBits || 8,
            stopBits: options.stopBits || 1,
            parity: options.parity || 'none',
            flowControl: options.flowControl || 'none'
        };

        try {
            // Open port
            await this.port.open(serialOptions);

            // Set up readable stream
            this.inputStream = this.port.readable;
            this.reader = this.inputStream.getReader();

            // Set up writable stream
            this.outputStream = this.port.writable;
            this.writer = this.outputStream.getWriter();

            this.connected = true;

            // Start reading data
            this._startReading();

            // Call connection callback
            if (this.onConnect) {
                this.onConnect(this.port.getInfo());
            }

            return true;
        } catch (error) {
            this.connected = false;
            throw new Error(`Failed to connect to serial port: ${error.message}`);
        }
    }

    /**
     * Disconnect from serial port
     */
    async disconnect() {
        if (!this.connected) {
            return;
        }

        try {
            // Cancel reader
            if (this.reader) {
                await this.reader.cancel();
                this.reader.releaseLock();
                this.reader = null;
            }

            // Release writer
            if (this.writer) {
                await this.writer.close();
                this.writer = null;
            }

            // Close port
            if (this.port) {
                await this.port.close();
            }

            this.connected = false;

            // Call disconnection callback
            if (this.onDisconnect) {
                this.onDisconnect();
            }
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw new Error(`Failed to disconnect: ${error.message}`);
        }
    }

    /**
     * Write data to serial port
     * @param {Uint8Array|string} data - Data to write
     */
    async write(data) {
        if (!this.connected || !this.writer) {
            throw new Error('Serial port is not connected');
        }

        try {
            // Convert string to Uint8Array if necessary
            const bytes = typeof data === 'string' ?
                new TextEncoder().encode(data) :
                data;

            await this.writer.write(bytes);
            return true;
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw new Error(`Failed to write data: ${error.message}`);
        }
    }

    /**
     * Start reading data from serial port
     * @private
     */
    async _startReading() {
        try {
            while (this.connected && this.reader) {
                const { value, done } = await this.reader.read();

                if (done) {
                    // Reader has been canceled
                    break;
                }

                if (value && this.onData) {
                    // Call data callback
                    this.onData(value);
                }
            }
        } catch (error) {
            if (this.connected && this.onError) {
                this.onError(error);
            }
        }
    }

    /**
     * Get port information
     */
    getInfo() {
        return this.port ? this.port.getInfo() : null;
    }

    /**
     * Check if port is connected
     */
    isConnected() {
        return this.connected;
    }
}

/**
 * Utility function to convert Uint8Array to hex string
 */
export function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
}

/**
 * Utility function to convert hex string to Uint8Array
 */
export function hexToBytes(hex) {
    const cleaned = hex.replace(/[^0-9A-Fa-f]/g, '');
    const bytes = new Uint8Array(cleaned.length / 2);

    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
    }

    return bytes;
}

/**
 * Utility function to convert bytes to string
 */
export function bytesToString(bytes) {
    return new TextDecoder().decode(bytes);
}

/**
 * Utility function to convert string to bytes
 */
export function stringToBytes(str) {
    return new TextEncoder().encode(str);
}
