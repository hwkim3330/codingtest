# VelocityDRIVE-SP WebSerial Client

**Browser-based CoAP/CORECONF client for Microchip VelocityDRIVE-SP using WebSerial API**

[![WebSerial](https://img.shields.io/badge/WebSerial-API-green.svg)](https://wicg.github.io/serial/)
[![CoAP](https://img.shields.io/badge/Protocol-CoAP-orange.svg)](https://datatracker.ietf.org/doc/rfc7252/)

## 🎯 Two Interfaces Available

1. **Simple Client** (`index.html`) - Quick CORECONF requests with examples
2. **Config Editor** (`config-editor.html`) - **Registry-style full configuration editor** ⭐

## 🚀 Overview

Browser-based client for Microchip's VelocityDRIVE-SP platform. Communicates over serial port using:

- **MUP1 Protocol**: Microchip UART Protocol #1 (frame transport)
- **CoAP**: RFC7252 Constrained Application Protocol
- **CORECONF**: YANG-based configuration (RFC9254 CBOR encoding)
- **WebSerial API**: Direct serial port access from browser

Based on: https://github.com/microchip-ung/velocitydrivesp-support

## 🎯 Quick Start

### Requirements

- **Browser**: Chrome/Edge/Opera with WebSerial support
- **Device**: VelocityDRIVE-SP switch connected via USB serial

### Simple Client Usage

1. **Open**: https://hwkim3330.github.io/codingtest/
2. **Connect**: Click "Connect to Device" → Select serial port (e.g., `/dev/ttyACM0`)
3. **Send Command**: Click example button or write YAML, then "Send Command"
4. **View Response**: See output in YAML/JSON/Hex format

### Config Editor Usage (Registry Style)

1. **Open**: https://hwkim3330.github.io/codingtest/config-editor.html
2. **Connect**: Click "Connect" → Select serial port
3. **Auto-Load**: Configuration is automatically loaded with GET
4. **Browse**: Navigate YANG tree in left sidebar (ietf-interfaces, ietf-system, etc.)
5. **Edit**: Click nodes to view/edit values in Form/YAML/JSON view
6. **Apply**: Pending changes tracked → Click "Apply Changes" to send iPATCH
7. **Save**: Click "Save to Flash" to persist configuration

## ✨ Config Editor Features

- **📁 YANG Tree Browser**: Hierarchical view of all configuration modules
- **✏️ Multi-View Editor**: Form view, YAML view, or JSON view
- **📊 Change Tracking**: Visual diff of pending modifications
- **🔄 Auto-Refresh**: GET entire config with one click
- **💾 Save to Flash**: POST save-config action
- **📤 Export**: Download configuration as YAML
- **🖥️ Console**: Real-time protocol logging
- **🎨 Apple Design**: Clean, modern registry-editor style UI
- **🧪 Test Mode**: Full offline testing with realistic mock data

## 📺 Interactive Demos

**NEW!** Interactive configuration demonstrations with real-time code generation:

🌐 **[View All Demos](https://hwkim3330.github.io/codingtest/demos/)** - Demos Index Page

### Available Demos

1. **🔌 [Port Configuration](https://hwkim3330.github.io/codingtest/demos/port-config-demo.html)**
   - Configure speed, duplex, auto-negotiation
   - Maximum frame length and flow control
   - Real-time iPATCH code generation

2. **🌐 [VLAN Configuration](https://hwkim3330.github.io/codingtest/demos/vlan-config-demo.html)**
   - Create VLANs with access/trunk ports
   - Visual network topology diagram
   - Port type and ingress filtering

3. **🎵 [TSN Credit-Based Shaper](https://hwkim3330.github.io/codingtest/demos/tsn-cbs-demo.html)**
   - Reserve bandwidth for Audio/Video traffic
   - Idle/Send slope calculator
   - Real-time bandwidth allocation chart

### Example Configuration Files

Ready-to-use YAML examples in `test-data/`:

```yaml
# Port Configuration
test-data/example-port-config.yaml

# VLAN Configuration with Access and Trunk Ports
test-data/example-vlan-config.yaml

# TSN CBS - Audio/Video Bandwidth Reservation
test-data/example-tsn-cbs.yaml

# TSN TAS - Time-Slotted Gate Control
test-data/example-tsn-tas.yaml

# Complete Mock Configuration
test-data/mock-config.yaml
```

## 📖 Protocol Details

### MUP1 Frame Format (CORRECTED)

Based on `velocitydrivesp-support/support/libeasy/handler/mup1.rb`:

```
Format: >TYPE[ESCAPED_DATA]<[<]CHECKSUM

Example: >C[CoAP bytes]<<a3f1

Components:
- START:    '>' (0x3E)
- TYPE:     'C' (0x43) for CoAP
- DATA:     Escaped payload
- EOF:      '<' (single) or '<<' (double, if data length is even)
- CHECKSUM: 4-byte ASCII hex (16-bit one's complement)

Escape Sequences:
- \> (0x5C 0x3E) → 0x3E
- \< (0x5C 0x3C) → 0x3C
- \\ (0x5C 0x5C) → 0x5C
- \0 (0x5C 0x30) → 0x00
- \F (0x5C 0x46) → 0xFF
```

### Checksum Calculation

16-bit one's complement checksum (similar to TCP/IP):

```javascript
// Sum all 16-bit words
let sum = 0;
for (let i = 0; i < data.length; i += 2) {
    sum += (data[i] << 8) | (data[i+1] || 0);
}

// Add carry twice
sum = (sum >> 16) + (sum & 0xFFFF);
sum = (sum >> 16) + (sum & 0xFFFF);

// One's complement
sum = ~sum & 0xFFFF;

// Convert to 4-character ASCII hex
return sum.toString(16).padStart(4, '0');
```

### CoAP Message

Standard RFC7252 format with CBOR payload (RFC9254).

## 🧪 Examples

### Get All Configuration

```yaml
Method: GET
Query: c=c
```

### Fetch Interfaces

```yaml
Method: FETCH
Request:
- "/ietf-interfaces:interfaces/interface[name='1']"
- "/ietf-interfaces:interfaces/interface[name='2']"
```

### Set IP Address

```yaml
Method: iPATCH
Request:
- ? "/ietf-interfaces:interfaces/interface[name='L3V1']"
  : name: "L3V1"
    ietf-ip:ipv4:
      address:
      - ip: "10.0.0.1"
        prefix-length: 24
```

### Save Configuration

```yaml
Method: POST
Request:
- "/mchp-velocitysp-system:save-config":
```

### Disable DTLS

```yaml
Method: iPATCH
Request:
- "/mchp-velocitysp-system:coap-server/config/security-mode": "no-sec"
```

## 🛠️ Project Structure

```
codingtest/
├── index.html           # Main application
├── css/style.css        # Styling
├── js/
│   ├── webserial-core.js   # WebSerial wrapper
│   ├── mup1-protocol.js    # MUP1 implementation (CORRECTED)
│   ├── coap-builder.js     # CoAP message builder
│   └── app.js              # Main logic
└── README.md
```

## 📚 Implementation Notes

### Key Corrections from Initial Version

1. **MUP1 Checksum**: Changed from XOR to 16-bit one's complement
2. **MUP1 EOF**: Single `<` for odd-length data, double `<<` for even-length
3. **MUP1 Escaping**: Proper handling of special characters
4. **Based on Ruby Reference**: Directly translated from `mup1.rb`

### Dependencies

Loaded from CDN:
- **cbor-web** (9.0.1): CBOR encoding/decoding
- **js-yaml** (4.1.0): YAML parsing

## 🔗 References

### Official Resources

- **VelocityDRIVE-SP Support**: https://github.com/microchip-ung/velocitydrivesp-support
- **Original CLI Tools**: `mup1cc` and `mup1ct` (Ruby scripts)
- **MUP1 Implementation**: `support/libeasy/handler/mup1.rb`

### Standards

- **RFC7252**: CoAP Protocol
- **RFC7951**: JSON Encoding of YANG
- **RFC9254**: CBOR Encoding of YANG
- **WebSerial API**: https://wicg.github.io/serial/

## 📝 License

MIT License

## 🤝 Contributing

Issues and pull requests welcome!

---

**Live Demo**: https://hwkim3330.github.io/codingtest/

**Built from**: https://github.com/microchip-ung/velocitydrivesp-support
