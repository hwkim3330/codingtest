/**
 * Test Mode for Config Editor
 * Simulates device responses without real hardware
 */

export const MOCK_CONFIG_DATA = {
    "ietf-interfaces:interfaces": {
        "interface": [
            {
                "name": "1",
                "description": "Port 1 - Front Panel",
                "type": "ethernetCsmacd",
                "enabled": true,
                "ietf-ip:ipv4": {
                    "enabled": true,
                    "forwarding": false,
                    "mtu": 1500
                }
            },
            {
                "name": "2",
                "description": "Port 2 - Front Panel",
                "type": "ethernetCsmacd",
                "enabled": true,
                "ietf-ip:ipv4": {
                    "enabled": true,
                    "forwarding": false,
                    "mtu": 1500
                }
            },
            {
                "name": "L3V1",
                "description": "Layer 3 VLAN Interface",
                "type": "l3ipvlan",
                "enabled": true,
                "ietf-ip:ipv4": {
                    "enabled": true,
                    "forwarding": true,
                    "mtu": 1500,
                    "address": [
                        {
                            "ip": "192.168.1.1",
                            "prefix-length": 24
                        }
                    ]
                }
            }
        ]
    },
    "ietf-system:system": {
        "hostname": "velocitysp-switch",
        "contact": "admin@example.com",
        "location": "Test Lab",
        "clock": {
            "timezone-name": "Europe/Copenhagen"
        }
    },
    "mchp-velocitysp-system:coap-server": {
        "config": {
            "security-mode": "psk",
            "port": 5683,
            "max-payload-size": 1024
        },
        "state": {
            "active-connections": 1,
            "total-requests": 42
        }
    },
    "mchp-velocitysp-system:tsn": {
        "qos": {
            "priority-map": [
                { "pcp": 0, "priority": 0 },
                { "pcp": 1, "priority": 1 },
                { "pcp": 2, "priority": 2 },
                { "pcp": 3, "priority": 3 },
                { "pcp": 4, "priority": 4 },
                { "pcp": 5, "priority": 5 },
                { "pcp": 6, "priority": 6 },
                { "pcp": 7, "priority": 7 }
            ]
        },
        "cbs": {
            "enabled": false,
            "port-config": [
                {
                    "port-id": 1,
                    "tc": 6,
                    "idle-slope": 3500,
                    "send-slope": -6500
                },
                {
                    "port-id": 1,
                    "tc": 2,
                    "idle-slope": 1500,
                    "send-slope": -8500
                }
            ]
        },
        "tas": {
            "enabled": false,
            "cycle-time": 200000
        }
    }
};

export class TestMode {
    constructor(enabled = false) {
        this.enabled = enabled;
        this.mockData = MOCK_CONFIG_DATA;
        this.delay = 200; // Simulate network delay
    }

    async simulateGetConfig() {
        await this.sleep(this.delay);
        return JSON.parse(JSON.stringify(this.mockData)); // Deep copy
    }

    async simulateIPatch(changes) {
        await this.sleep(this.delay);

        // Apply changes to mock data
        for (const [path, change] of changes) {
            this.applyChange(path, change.newValue);
        }

        return { success: true, message: 'Changes applied (test mode)' };
    }

    async simulateSaveConfig() {
        await this.sleep(this.delay);
        console.log('[Test Mode] Config saved to mock flash');
        return { success: true, message: 'Configuration saved (test mode)' };
    }

    applyChange(pathArray, newValue) {
        let current = this.mockData;

        for (let i = 0; i < pathArray.length - 1; i++) {
            if (!current[pathArray[i]]) {
                current[pathArray[i]] = {};
            }
            current = current[pathArray[i]];
        }

        current[pathArray[pathArray.length - 1]] = newValue;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    getConfigData() {
        return this.mockData;
    }
}
