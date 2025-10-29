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
                "oper-status": "up",
                "phys-address": "00-11-22-33-44-01",
                "ietf-ip:ipv4": {
                    "enabled": true,
                    "forwarding": false,
                    "mtu": 1500
                },
                "ieee802-ethernet-interface:ethernet": {
                    "auto-negotiation": {
                        "enable": true
                    }
                },
                "mchp-velocitysp-port:eth-port": {
                    "config": {
                        "speed": "1000",
                        "duplex": "full",
                        "max-frame-length": 1518,
                        "phy-clock-role": "internal"
                    },
                    "status": {
                        "flow-control": false,
                        "oper-info": {
                            "speed": "1000",
                            "duplex": "full"
                        }
                    }
                },
                "ieee802-dot1q-bridge:bridge-port": {
                    "pvid": 1,
                    "default-priority": 0,
                    "port-type": "ieee802-dot1q-bridge:d-bridge-port",
                    "acceptable-frame": "admit-all-frames",
                    "enable-ingress-filtering": false,
                    "mchp-velocitysp-bridge:inner-tag-discard": "",
                    "statistics": {
                        "discard-inbound": 0
                    },
                    "pcp-decoding-table": {
                        "pcp-decoding-map": {
                            "priority-map": [
                                { "pcp": 0, "priority": 0, "dei": 0 },
                                { "pcp": 1, "priority": 1, "dei": 0 },
                                { "pcp": 2, "priority": 2, "dei": 0 },
                                { "pcp": 3, "priority": 3, "dei": 0 },
                                { "pcp": 4, "priority": 4, "dei": 0 },
                                { "pcp": 5, "priority": 5, "dei": 0 },
                                { "pcp": 6, "priority": 6, "dei": 0 },
                                { "pcp": 7, "priority": 7, "dei": 0 }
                            ]
                        }
                    },
                    "pcp-encoding-table": {
                        "pcp-encoding-map": {
                            "priority-map": [
                                { "priority": 0, "dei": 0, "pcp": 0 },
                                { "priority": 1, "dei": 0, "pcp": 1 },
                                { "priority": 2, "dei": 0, "pcp": 2 },
                                { "priority": 3, "dei": 0, "pcp": 3 },
                                { "priority": 4, "dei": 0, "pcp": 4 },
                                { "priority": 5, "dei": 0, "pcp": 5 },
                                { "priority": 6, "dei": 0, "pcp": 6 },
                                { "priority": 7, "dei": 0, "pcp": 7 }
                            ]
                        }
                    }
                },
                "mchp-velocitysp-port:eth-qos": {
                    "config": {
                        "traffic-class-shapers": [
                            {
                                "traffic-class": 6,
                                "credit-based-shaper": {
                                    "idle-slope": 3500
                                }
                            }
                        ],
                        "traffic-class-schedulers-bandwidth": [
                            { "traffic-class": 0, "percent": 12 },
                            { "traffic-class": 1, "percent": 12 },
                            { "traffic-class": 2, "percent": 12 },
                            { "traffic-class": 3, "percent": 12 },
                            { "traffic-class": 4, "percent": 13 },
                            { "traffic-class": 5, "percent": 13 },
                            { "traffic-class": 6, "percent": 13 },
                            { "traffic-class": 7, "percent": 13 }
                        ],
                        "port-policers": []
                    }
                }
            },
            {
                "name": "2",
                "description": "Port 2 - Front Panel",
                "type": "ethernetCsmacd",
                "enabled": true,
                "oper-status": "up",
                "phys-address": "00-11-22-33-44-02",
                "ietf-ip:ipv4": {
                    "enabled": true,
                    "forwarding": false,
                    "mtu": 1500
                },
                "ieee802-ethernet-interface:ethernet": {
                    "auto-negotiation": {
                        "enable": true
                    }
                },
                "mchp-velocitysp-port:eth-port": {
                    "config": {
                        "speed": "1000",
                        "duplex": "full",
                        "max-frame-length": 1518,
                        "phy-clock-role": "internal"
                    },
                    "status": {
                        "flow-control": false,
                        "oper-info": {
                            "speed": "1000",
                            "duplex": "full"
                        }
                    }
                },
                "ieee802-dot1q-bridge:bridge-port": {
                    "pvid": 1,
                    "default-priority": 0,
                    "port-type": "ieee802-dot1q-bridge:d-bridge-port",
                    "acceptable-frame": "admit-all-frames",
                    "enable-ingress-filtering": false,
                    "mchp-velocitysp-bridge:inner-tag-discard": ""
                }
            },
            {
                "name": "3",
                "description": "Port 3 - Trunk Port",
                "type": "ethernetCsmacd",
                "enabled": true,
                "oper-status": "up",
                "phys-address": "00-11-22-33-44-03",
                "ieee802-ethernet-interface:ethernet": {
                    "auto-negotiation": {
                        "enable": true
                    }
                },
                "mchp-velocitysp-port:eth-port": {
                    "config": {
                        "speed": "1000",
                        "duplex": "full",
                        "max-frame-length": 1518
                    }
                },
                "ieee802-dot1q-bridge:bridge-port": {
                    "pvid": 1,
                    "default-priority": 0,
                    "port-type": "ieee802-dot1q-bridge:c-vlan-bridge-port",
                    "acceptable-frame": "admit-only-VLAN-tagged-frames",
                    "enable-ingress-filtering": true,
                    "mchp-velocitysp-bridge:inner-tag-discard": ""
                }
            },
            {
                "name": "4",
                "description": "Port 4 - Front Panel",
                "type": "ethernetCsmacd",
                "enabled": false,
                "oper-status": "down",
                "phys-address": "00-11-22-33-44-04"
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
                        },
                        {
                            "ip": "10.0.0.1",
                            "prefix-length": 8
                        }
                    ]
                }
            }
        ]
    },
    "ietf-system:system": {
        "hostname": "velocitysp-switch",
        "contact": "admin@example.com",
        "location": "Test Lab - Rack 42",
        "clock": {
            "timezone-name": "Europe/Copenhagen"
        },
        "ntp": {
            "enabled": true,
            "server": [
                {
                    "name": "0.pool.ntp.org",
                    "udp": {
                        "address": "0.pool.ntp.org",
                        "port": 123
                    },
                    "association-type": "server",
                    "iburst": true,
                    "prefer": true
                },
                {
                    "name": "1.pool.ntp.org",
                    "udp": {
                        "address": "1.pool.ntp.org",
                        "port": 123
                    },
                    "association-type": "server",
                    "iburst": true,
                    "prefer": false
                }
            ]
        },
        "authentication": {
            "user": [
                {
                    "name": "admin",
                    "mchp-velocitysp-system:coap-authorized-key": "ADMIN_PSK_KEY_32_BYTES_HEX_00",
                    "mchp-velocitysp-system:access-control": {
                        "cc-rights": "read-write",
                        "startup-config-rights": "read-write",
                        "fw-rights": "read-write",
                        "dbg-rights": "read-write",
                        "well-known-rights": "read"
                    }
                },
                {
                    "name": "operator",
                    "mchp-velocitysp-system:coap-authorized-key": "OPERATOR_PSK_KEY_32_BYTES_HEX",
                    "mchp-velocitysp-system:access-control": {
                        "cc-rights": "read-write",
                        "startup-config-rights": "read",
                        "fw-rights": "none",
                        "dbg-rights": "none",
                        "well-known-rights": "read"
                    }
                }
            ]
        }
    },
    "ietf-system:system-state": {
        "platform": {
            "os-name": "VelocityDRIVE-SP",
            "os-release": "2025.03",
            "os-version": "v1.2.3-beta",
            "machine": "LAN9662 - pcb8291"
        },
        "clock": {
            "current-datetime": "2025-01-29T15:30:00Z",
            "boot-datetime": "2025-01-20T08:00:00Z"
        }
    },
    "ieee802-dot1q-bridge:bridges": {
        "bridge": [
            {
                "name": "b0",
                "component": [
                    {
                        "name": "c0",
                        "mchp-velocitysp-bridge:custom-ethertype": "88-A8",
                        "filtering-database": {
                            "vlan-registration-entry": [
                                {
                                    "database-id": 0,
                                    "vids": "1",
                                    "entry-type": "static",
                                    "port-map": [
                                        {
                                            "port-ref": "1",
                                            "static-vlan-registration-entries": {
                                                "vlan-transmitted": "untagged"
                                            }
                                        },
                                        {
                                            "port-ref": "2",
                                            "static-vlan-registration-entries": {
                                                "vlan-transmitted": "untagged"
                                            }
                                        }
                                    ]
                                },
                                {
                                    "database-id": 0,
                                    "vids": "10",
                                    "entry-type": "static",
                                    "port-map": [
                                        {
                                            "port-ref": "1",
                                            "static-vlan-registration-entries": {
                                                "vlan-transmitted": "untagged"
                                            }
                                        },
                                        {
                                            "port-ref": "3",
                                            "static-vlan-registration-entries": {
                                                "vlan-transmitted": "tagged"
                                            }
                                        }
                                    ]
                                },
                                {
                                    "database-id": 0,
                                    "vids": "20",
                                    "entry-type": "static",
                                    "port-map": [
                                        {
                                            "port-ref": "2",
                                            "static-vlan-registration-entries": {
                                                "vlan-transmitted": "untagged"
                                            }
                                        },
                                        {
                                            "port-ref": "3",
                                            "static-vlan-registration-entries": {
                                                "vlan-transmitted": "tagged"
                                            }
                                        }
                                    ]
                                }
                            ],
                            "filtering-entry": [
                                {
                                    "database-id": 0,
                                    "address": "00-AA-BB-CC-DD-EE",
                                    "vids": "10",
                                    "entry-type": "static",
                                    "port-map": [
                                        {
                                            "port-ref": "1",
                                            "static-filtering-entries": {
                                                "control-element": "forward"
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    },
    "mchp-velocitysp-system:coap-server": {
        "config": {
            "security-mode": "psk",
            "port": 5683,
            "max-payload-size": 1024
        },
        "state": {
            "active-connections": 1,
            "total-requests": 42,
            "uptime-seconds": 864000
        }
    },
    "mchp-velocitysp-system:switch": {
        "port-config": [
            {
                "port-id": 1,
                "admin-state": "enabled",
                "speed": "1000",
                "duplex": "full",
                "auto-negotiation": true,
                "flow-control": false
            },
            {
                "port-id": 2,
                "admin-state": "enabled",
                "speed": "1000",
                "duplex": "full",
                "auto-negotiation": true,
                "flow-control": false
            },
            {
                "port-id": 3,
                "admin-state": "enabled",
                "speed": "1000",
                "duplex": "full",
                "auto-negotiation": true,
                "flow-control": false
            },
            {
                "port-id": 4,
                "admin-state": "disabled",
                "speed": "auto",
                "duplex": "auto",
                "auto-negotiation": true,
                "flow-control": false
            }
        ],
        "vlan-config": {
            "vlan": [
                {
                    "vlan-id": 1,
                    "name": "default",
                    "ports": ["1", "2", "3", "4"]
                },
                {
                    "vlan-id": 10,
                    "name": "management",
                    "ports": ["1", "3"]
                },
                {
                    "vlan-id": 20,
                    "name": "data",
                    "ports": ["2", "3"]
                }
            ]
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
            "cycle-time": 200000,
            "gate-control-list": [
                {
                    "gate-state": "10000000",
                    "time-interval": 50000
                },
                {
                    "gate-state": "01000000",
                    "time-interval": 30000
                },
                {
                    "gate-state": "00100000",
                    "time-interval": 20000
                },
                {
                    "gate-state": "00010000",
                    "time-interval": 20000
                },
                {
                    "gate-state": "00001000",
                    "time-interval": 20000
                },
                {
                    "gate-state": "00000100",
                    "time-interval": 20000
                },
                {
                    "gate-state": "00000010",
                    "time-interval": 20000
                },
                {
                    "gate-state": "00000001",
                    "time-interval": 20000
                }
            ]
        }
    },
    "ieee1588-ptp:ptp": {
        "mchp-velocitysp-ptp:ltcs": {
            "ltc": []
        },
        "instances": {
            "instance": []
        }
    },
    "ieee802-dot1cb-stream-identification:stream-identity": [],
    "ieee802-dot1cb-frer:stream-filters": [],
    "ieee802-dot1cb-frer:stream-gates": [],
    "ieee802-dot1cb-frer:flow-meters": []
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
