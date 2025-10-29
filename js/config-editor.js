/**
 * VelocityDRIVE-SP Config Editor - Registry-style configuration tool
 * Implements full YANG tree browser, value editor, and change tracking
 */

import { WebSerialConnection, bytesToHex } from './webserial-core.js';
import { MUP1Protocol } from './mup1-protocol.js';
import { createGetRequest, createIPatchRequest, createPostRequest } from './coap-builder.js';
import { CoapParser } from './coap-parser.js';
import { CborHelper } from './cbor-helper.js';

class ConfigEditor {
    constructor() {
        // Serial and protocol layers
        this.serial = new WebSerialConnection();
        this.mup1 = new MUP1Protocol();
        this.connected = false;

        // Data storage
        this.configData = null;         // Full config from GET
        this.selectedNode = null;       // Currently selected tree node
        this.pendingChanges = new Map(); // Path -> new value
        this.yangTree = null;           // Tree structure

        // UI elements
        this.initUIElements();
        this.setupEventListeners();
        this.setupSerialHandlers();
        this.setupMUP1Handlers();

        // Initialize console
        this.consoleVisible = true;

        this.log('Config Editor initialized', 'info');
    }

    initUIElements() {
        // Header
        this.connectionBadge = document.getElementById('connectionBadge');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');

        // Toolbar
        this.refreshBtn = document.getElementById('refreshBtn');
        this.applyBtn = document.getElementById('applyBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.saveConfigBtn = document.getElementById('saveConfigBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.changeCount = document.getElementById('changeCount');

        // Sidebar
        this.treeSearch = document.getElementById('treeSearch');
        this.yangTree = document.getElementById('yangTree');

        // Editor
        this.breadcrumb = document.getElementById('breadcrumb');
        this.viewMode = document.getElementById('viewMode');
        this.editorContent = document.getElementById('editorContent');

        // Changes panel
        this.changesPanel = document.getElementById('changesPanel');
        this.changesPanelClose = document.getElementById('changesPanelClose');
        this.changesList = document.getElementById('changesList');

        // Status bar
        this.statusText = document.getElementById('statusText');
        this.dataStoreInfo = document.getElementById('dataStoreInfo');
        this.yangChecksum = document.getElementById('yangChecksum');

        // Console
        this.consoleDrawer = document.getElementById('consoleDrawer');
        this.consoleLog = document.getElementById('consoleLog');
        this.consoleToggle = document.getElementById('consoleToggle');
        this.toggleConsoleBtn = document.getElementById('toggleConsoleBtn');
        this.clearConsoleBtn = document.getElementById('clearConsoleBtn');
        this.autoScrollConsole = document.getElementById('autoScrollConsole');
    }

    setupEventListeners() {
        // Connection
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());

        // Toolbar
        this.refreshBtn.addEventListener('click', () => this.refreshConfig());
        this.applyBtn.addEventListener('click', () => this.applyChanges());
        this.resetBtn.addEventListener('click', () => this.resetChanges());
        this.saveConfigBtn.addEventListener('click', () => this.saveConfig());
        this.exportBtn.addEventListener('click', () => this.exportConfig());

        // Tree search
        this.treeSearch.addEventListener('input', (e) => this.filterTree(e.target.value));

        // View mode
        this.viewMode.addEventListener('change', (e) => this.switchViewMode(e.target.value));

        // Changes panel
        this.changesPanelClose.addEventListener('click', () => {
            this.changesPanel.style.display = 'none';
        });

        // Console
        this.consoleToggle.addEventListener('click', () => this.toggleConsole());
        this.toggleConsoleBtn.addEventListener('click', () => this.toggleConsole());
        this.clearConsoleBtn.addEventListener('click', () => this.clearConsole());
    }

    setupSerialHandlers() {
        this.serial.onConnect = () => {
            this.connected = true;
            this.updateConnectionState(true);
            this.log('✓ Connected to device', 'success');
            this.enableButtons(true);

            // Auto-refresh config after connection
            setTimeout(() => this.refreshConfig(), 500);
        };

        this.serial.onDisconnect = () => {
            this.connected = false;
            this.updateConnectionState(false);
            this.log('Disconnected from device', 'info');
            this.enableButtons(false);
        };

        this.serial.onError = (error) => {
            this.log(`Serial error: ${error.message}`, 'error');
        };

        this.serial.onData = (data) => {
            this.mup1.processData(data);
        };
    }

    setupMUP1Handlers() {
        this.mup1.onFrame = (payload) => {
            this.handleCoapResponse(payload);
        };

        this.mup1.onTrace = (message) => {
            this.log(`TRACE: ${message}`, 'info');
        };

        this.mup1.onAnnounce = (message) => {
            this.log(`ANNOUNCE: ${message}`, 'info');
        };
    }

    // Connection methods
    async connect() {
        try {
            this.log('Requesting serial port...', 'info');
            await this.serial.requestPort();
            await this.serial.connect({ baudRate: 115200 });
        } catch (error) {
            this.log(`Connection failed: ${error.message}`, 'error');
        }
    }

    async disconnect() {
        try {
            await this.serial.disconnect();
        } catch (error) {
            this.log(`Disconnect error: ${error.message}`, 'error');
        }
    }

    updateConnectionState(connected) {
        if (connected) {
            this.connectionBadge.classList.add('connected');
            this.connectionBadge.querySelector('.badge-text').textContent = 'Connected';
            this.connectBtn.disabled = true;
            this.disconnectBtn.disabled = false;
        } else {
            this.connectionBadge.classList.remove('connected');
            this.connectionBadge.querySelector('.badge-text').textContent = 'Not Connected';
            this.connectBtn.disabled = false;
            this.disconnectBtn.disabled = true;
        }
    }

    enableButtons(enabled) {
        this.refreshBtn.disabled = !enabled;
        this.saveConfigBtn.disabled = !enabled;
        this.exportBtn.disabled = !enabled;
        this.updateApplyButton();
    }

    // Configuration loading
    async refreshConfig() {
        if (!this.connected) {
            this.log('Not connected to device', 'error');
            return;
        }

        try {
            this.log('📥 Loading configuration...', 'info');
            this.statusText.textContent = 'Loading configuration...';

            // Send GET request with query c=c (config data)
            const coapMessage = createGetRequest('c', 'c=c');
            const mup1Frame = MUP1Protocol.encodeCoapFrame(coapMessage);

            await this.serial.write(mup1Frame);
            this.log('GET request sent (c=c)', 'info');

            // Response will be handled by handleCoapResponse()
        } catch (error) {
            this.log(`Failed to load config: ${error.message}`, 'error');
            this.statusText.textContent = 'Failed to load configuration';
        }
    }

    handleCoapResponse(payload) {
        try {
            const parsed = CoapParser.parse(payload);

            if (parsed.error) {
                this.log(`CoAP parse error: ${parsed.error}`, 'error');
                return;
            }

            const codeStr = CoapParser.codeToString(parsed.codeClass, parsed.codeDetail);
            const isSuccess = CoapParser.isSuccess(parsed.codeClass);

            this.log(`◀ Response: ${codeStr}`, isSuccess ? 'success' : 'error');

            if (parsed.payload && parsed.payload.length > 0) {
                // Decode CBOR payload
                const decoded = CborHelper.decode(parsed.payload);

                if (decoded.error) {
                    this.log(`CBOR decode error: ${decoded.error}`, 'error');
                    return;
                }

                // Store config data
                this.configData = decoded;
                this.buildYangTree(decoded);
                this.statusText.textContent = 'Configuration loaded';
                this.dataStoreInfo.textContent = `Datastore: config (${Object.keys(decoded).length} modules)`;

                this.log(`✓ Configuration loaded (${JSON.stringify(decoded).length} bytes)`, 'success');
            }
        } catch (error) {
            this.log(`Response processing error: ${error.message}`, 'error');
        }
    }

    // YANG Tree building
    buildYangTree(data) {
        this.log('Building YANG tree...', 'info');

        this.yangTree.innerHTML = '';

        // Root nodes are top-level YANG modules
        for (const [moduleName, moduleData] of Object.entries(data)) {
            const node = this.createTreeNode(moduleName, moduleData, [moduleName]);
            this.yangTree.appendChild(node);
        }

        this.log(`✓ Tree built with ${Object.keys(data).length} modules`, 'success');
    }

    createTreeNode(name, value, path) {
        const nodeDiv = document.createElement('div');
        nodeDiv.className = 'tree-node';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'tree-node-header';
        headerDiv.dataset.path = JSON.stringify(path);

        // Determine if node has children
        const hasChildren = value && typeof value === 'object' && !Array.isArray(value);
        const isArray = Array.isArray(value);

        // Toggle arrow
        const toggle = document.createElement('span');
        toggle.className = 'tree-toggle';
        toggle.textContent = hasChildren || isArray ? '▶' : ' ';
        headerDiv.appendChild(toggle);

        // Icon
        const icon = document.createElement('span');
        icon.className = 'tree-icon';
        icon.textContent = this.getNodeIcon(value);
        headerDiv.appendChild(icon);

        // Label
        const label = document.createElement('span');
        label.className = 'tree-label';
        label.textContent = name;
        headerDiv.appendChild(label);

        // Type hint
        const type = document.createElement('span');
        type.className = 'tree-type';
        type.textContent = this.getNodeType(value);
        headerDiv.appendChild(type);

        // Click handler
        headerDiv.addEventListener('click', (e) => {
            e.stopPropagation();

            if (e.target === toggle && (hasChildren || isArray)) {
                // Toggle expand/collapse
                const childrenDiv = nodeDiv.querySelector('.tree-children');
                if (childrenDiv) {
                    childrenDiv.classList.toggle('collapsed');
                    toggle.textContent = childrenDiv.classList.contains('collapsed') ? '▶' : '▼';
                }
            } else {
                // Select node
                this.selectNode(path, value, headerDiv);
            }
        });

        nodeDiv.appendChild(headerDiv);

        // Create children
        if (hasChildren || isArray) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'tree-children collapsed';

            if (isArray) {
                value.forEach((item, index) => {
                    const childPath = [...path, index];
                    const childNode = this.createTreeNode(`[${index}]`, item, childPath);
                    childrenDiv.appendChild(childNode);
                });
            } else {
                for (const [key, val] of Object.entries(value)) {
                    const childPath = [...path, key];
                    const childNode = this.createTreeNode(key, val, childPath);
                    childrenDiv.appendChild(childNode);
                }
            }

            nodeDiv.appendChild(childrenDiv);
        }

        return nodeDiv;
    }

    getNodeIcon(value) {
        if (Array.isArray(value)) return '📋';
        if (value === null) return '⊘';
        if (typeof value === 'boolean') return value ? '☑' : '☐';
        if (typeof value === 'number') return '#️⃣';
        if (typeof value === 'string') return '📝';
        if (typeof value === 'object') return '📁';
        return '•';
    }

    getNodeType(value) {
        if (Array.isArray(value)) return `array[${value.length}]`;
        if (value === null) return 'null';
        if (typeof value === 'boolean') return 'bool';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') return 'string';
        if (typeof value === 'object') return 'object';
        return typeof value;
    }

    selectNode(path, value, headerElement) {
        // Clear previous selection
        document.querySelectorAll('.tree-node-header.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select new node
        headerElement.classList.add('selected');
        this.selectedNode = { path, value };

        // Update breadcrumb
        this.updateBreadcrumb(path);

        // Display node value
        this.displayNodeValue(path, value);

        this.log(`Selected: ${path.join('/')}`, 'info');
    }

    updateBreadcrumb(path) {
        this.breadcrumb.innerHTML = '';
        path.forEach((segment, index) => {
            const item = document.createElement('span');
            item.className = 'breadcrumb-item';
            item.textContent = segment;
            this.breadcrumb.appendChild(item);
        });
    }

    displayNodeValue(path, value) {
        const viewMode = this.viewMode.value;

        this.editorContent.innerHTML = '';

        if (viewMode === 'form') {
            this.renderFormView(path, value);
        } else if (viewMode === 'yaml') {
            this.renderCodeView(path, value, 'yaml');
        } else if (viewMode === 'json') {
            this.renderCodeView(path, value, 'json');
        }
    }

    renderFormView(path, value) {
        const form = document.createElement('div');
        form.className = 'form-view';

        // Simple value (string, number, boolean)
        if (typeof value !== 'object' || value === null) {
            const group = this.createFormGroup(path[path.length - 1], value, path);
            form.appendChild(group);
        } else if (Array.isArray(value)) {
            const info = document.createElement('div');
            info.className = 'form-info';
            info.innerHTML = `<p><strong>Array</strong> with ${value.length} items</p>`;
            form.appendChild(info);
        } else {
            // Object - show each field
            for (const [key, val] of Object.entries(value)) {
                if (typeof val !== 'object') {
                    const fieldPath = [...path, key];
                    const group = this.createFormGroup(key, val, fieldPath);
                    form.appendChild(group);
                }
            }
        }

        this.editorContent.appendChild(form);
    }

    createFormGroup(label, value, path) {
        const group = document.createElement('div');
        group.className = 'form-group';

        const labelEl = document.createElement('label');
        labelEl.className = 'form-label';
        labelEl.textContent = label;
        group.appendChild(labelEl);

        const input = document.createElement('input');
        input.className = 'form-input';
        input.value = value !== null ? value : '';
        input.dataset.path = JSON.stringify(path);

        // Check if modified
        const pathKey = path.join('/');
        if (this.pendingChanges.has(pathKey)) {
            input.classList.add('modified');
        }

        // Track changes
        input.addEventListener('change', () => {
            this.trackChange(path, input.value);
        });

        group.appendChild(input);

        return group;
    }

    renderCodeView(path, value, format) {
        const textarea = document.createElement('textarea');
        textarea.className = 'code-editor';

        if (format === 'yaml') {
            textarea.value = CborHelper.toYAML(value);
        } else {
            textarea.value = CborHelper.toJSON(value);
        }

        this.editorContent.appendChild(textarea);
    }

    switchViewMode(mode) {
        if (this.selectedNode) {
            this.displayNodeValue(this.selectedNode.path, this.selectedNode.value);
        }
    }

    // Change tracking
    trackChange(path, newValue) {
        const pathKey = path.join('/');
        this.pendingChanges.set(pathKey, { path, oldValue: this.getValueAtPath(path), newValue });

        this.updateChangeCount();
        this.updateApplyButton();
        this.markNodeAsModified(path);

        this.log(`Modified: ${pathKey}`, 'warning');
    }

    getValueAtPath(path) {
        let current = this.configData;
        for (const segment of path) {
            if (current === null || current === undefined) return null;
            current = current[segment];
        }
        return current;
    }

    markNodeAsModified(path) {
        const pathStr = JSON.stringify(path);
        const header = document.querySelector(`[data-path='${CSS.escape(pathStr)}']`);
        if (header) {
            header.classList.add('modified');
        }
    }

    updateChangeCount() {
        const count = this.pendingChanges.size;
        this.changeCount.textContent = count;

        if (count > 0) {
            this.changesPanel.style.display = 'block';
            this.renderChangesList();
        }
    }

    updateApplyButton() {
        const hasChanges = this.pendingChanges.size > 0;
        this.applyBtn.disabled = !hasChanges || !this.connected;
        this.resetBtn.disabled = !hasChanges;
    }

    renderChangesList() {
        this.changesList.innerHTML = '';

        for (const [pathKey, change] of this.pendingChanges) {
            const item = document.createElement('div');
            item.className = 'change-item';

            const pathDiv = document.createElement('div');
            pathDiv.className = 'change-path';
            pathDiv.textContent = pathKey;
            item.appendChild(pathDiv);

            const valueDiv = document.createElement('div');
            valueDiv.className = 'change-value';
            valueDiv.innerHTML = `
                <span class="change-old">${change.oldValue}</span> →
                <span class="change-new">${change.newValue}</span>
            `;
            item.appendChild(valueDiv);

            this.changesList.appendChild(item);
        }
    }

    resetChanges() {
        this.pendingChanges.clear();
        this.updateChangeCount();
        this.updateApplyButton();

        // Remove modified markers
        document.querySelectorAll('.tree-node-header.modified').forEach(el => {
            el.classList.remove('modified');
        });

        this.log('Changes discarded', 'info');
        this.changesPanel.style.display = 'none';

        // Refresh current view
        if (this.selectedNode) {
            this.displayNodeValue(this.selectedNode.path, this.selectedNode.value);
        }
    }

    async applyChanges() {
        if (!this.connected || this.pendingChanges.size === 0) {
            return;
        }

        try {
            this.log(`Applying ${this.pendingChanges.size} changes...`, 'info');

            // Build iPATCH request
            const patchData = [];
            for (const [pathKey, change] of this.pendingChanges) {
                // Convert path to YANG path format
                const yangPath = '/' + change.path.join('/');
                patchData.push({ [yangPath]: change.newValue });
            }

            // Encode and send
            const cbor = CborHelper.encodeIPatchRequest(patchData);
            const coapMessage = createIPatchRequest('c', cbor);
            const mup1Frame = MUP1Protocol.encodeCoapFrame(coapMessage);

            await this.serial.write(mup1Frame);

            this.log('✓ iPATCH request sent', 'success');

            // Clear changes after successful send
            setTimeout(() => {
                this.resetChanges();
                this.refreshConfig();
            }, 500);

        } catch (error) {
            this.log(`Failed to apply changes: ${error.message}`, 'error');
        }
    }

    async saveConfig() {
        if (!this.connected) {
            return;
        }

        try {
            this.log('💾 Saving configuration to flash...', 'info');

            const postData = [{ "/mchp-velocitysp-system:save-config": null }];
            const cbor = CborHelper.encodeRequest(postData);
            const coapMessage = createPostRequest('c', cbor);
            const mup1Frame = MUP1Protocol.encodeCoapFrame(coapMessage);

            await this.serial.write(mup1Frame);

            this.log('✓ Save config request sent', 'success');
        } catch (error) {
            this.log(`Failed to save config: ${error.message}`, 'error');
        }
    }

    exportConfig() {
        if (!this.configData) {
            this.log('No configuration to export', 'warning');
            return;
        }

        const yaml = CborHelper.toYAML(this.configData);
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `velocitysp-config-${new Date().toISOString().slice(0, 10)}.yaml`;
        a.click();
        URL.revokeObjectURL(url);

        this.log('✓ Configuration exported', 'success');
    }

    filterTree(query) {
        // TODO: Implement tree filtering
        this.log(`Search: ${query}`, 'info');
    }

    // Console methods
    toggleConsole() {
        this.consoleVisible = !this.consoleVisible;
        if (this.consoleVisible) {
            this.consoleDrawer.classList.remove('minimized');
            this.consoleToggle.classList.add('active');
            this.toggleConsoleBtn.textContent = '▼ Minimize';
        } else {
            this.consoleDrawer.classList.add('minimized');
            this.consoleToggle.classList.remove('active');
            this.toggleConsoleBtn.textContent = '▲ Maximize';
        }
    }

    clearConsole() {
        this.consoleLog.innerHTML = '';
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!WebSerialConnection.isSupported()) {
        alert('WebSerial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
    }

    window.configEditor = new ConfigEditor();
    console.log('Config Editor ready');
});
