# VelocityDRIVE-SP WebSerial Client

**Browser-based client for Microchip VelocityDRIVE-SP using WebSerial API**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WebSerial](https://img.shields.io/badge/WebSerial-API-green.svg)](https://wicg.github.io/serial/)
[![CoAP](https://img.shields.io/badge/Protocol-CoAP-orange.svg)](https://datatracker.ietf.org/doc/rfc7252/)

## 🚀 Overview

This project provides a complete browser-based client for interacting with Microchip's VelocityDRIVE-SP Ethernet switch platform. It implements:

- **MUP1 Protocol**: Microchip UART Protocol #1 for serial communication
- **CoAP/CORECONF**: RFC7252 CoAP with YANG-based configuration (RFC9254)
- **WebSerial API**: Direct serial port access from the browser
- **CBOR Encoding**: Compact binary encoding for YANG data

### Key Features

✅ **No Installation Required**: Pure HTML/CSS/JavaScript - runs directly in the browser
✅ **WebSerial Integration**: Connect to `/dev/ttyACM0` or any serial device
✅ **Full CORECONF Support**: GET, FETCH, iPATCH, POST, PUT, DELETE methods
✅ **YAML/JSON Input**: Human-readable configuration format
✅ **Real-time Console**: Debug log with MUP1 frame inspection
✅ **Multiple Examples**: Pre-configured commands for common operations

## 🎯 Quick Start

### Prerequisites

- **Browser**: Chrome 89+, Edge 89+, or Opera 76+ (WebSerial support required)
- **Device**: VelocityDRIVE-SP compatible switch connected via USB serial

### Usage

1. **Access the Application**:
   - **Live Demo**: https://hwkim3330.github.io/codingtest/
   - **Local**: Open `index.html` in a supported browser

2. **Connect to Device**:
   - Click "Connect to Device"
   - Select your serial port (e.g., `/dev/ttyACM0`)
   - Connection established at 115200 baud

3. **Send Commands**:
   - Select method (GET, FETCH, iPATCH, POST)
   - Click example buttons or write YAML/JSON manually
   - Press "Send Command"
   - View response in YAML/JSON/Hex format

## 📖 Documentation

### Architecture

```
┌─────────────────────────────────────────────┐
│           Browser Application               │
├─────────────────────────────────────────────┤
│  app.js - Main application logic            │
│    ↓                                         │
│  coap-builder.js - CoAP message construction│
│    ↓                                         │
│  mup1-protocol.js - MUP1 frame encoding     │
│    ↓                                         │
│  webserial-core.js - WebSerial API wrapper  │
└─────────────────────────────────────────────┘
          ↓
    WebSerial API
          ↓
   /dev/ttyACM0 (Serial Port)
          ↓
  VelocityDRIVE-SP Device
```

### Protocol Stack

```
Application:    CORECONF (YANG-based configuration)
Encoding:       CBOR (RFC9254) / JSON (RFC7951)
Protocol:       CoAP (RFC7252)
Transport:      MUP1 (Microchip UART Protocol #1)
Physical:       Serial UART (115200 baud)
```

### MUP1 Frame Format

```
Structure: >TYPE[DATA]<CHECKSUM

Example:
  >C[CoAP message bytes]<[XOR checksum]

Fields:
  - START (1 byte):    '>' (0x3E)
  - TYPE (1 byte):     'C' (0x43) for CoAP
  - DATA (variable):   CoAP message payload
  - END (1 byte):      '<' (0x3C)
  - CHECKSUM (1 byte): XOR of TYPE + DATA + END
```

### CoAP Message Format

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Ver| T |  TKL  |      Code     |          Message ID           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|   Token (if any, TKL bytes) ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|   Options (if any) ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|1 1 1 1 1 1 1 1|    Payload (if any) ...
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

## 🧪 Examples

### Example 1: Get All Configuration

```yaml
# Method: GET
# Query: c=c (config datastore, config data)

c=c
```

### Example 2: Fetch Specific Interfaces

```yaml
# Method: FETCH
# Request body:

- "/ietf-interfaces:interfaces/interface[name='1']"
- "/ietf-interfaces:interfaces/interface[name='2']"
```

### Example 3: Set IP Address

```yaml
# Method: iPATCH
# Request body:

- ? "/ietf-interfaces:interfaces/interface[name='L3V1']"
  : name: "L3V1"
    ietf-ip:ipv4:
      address:
      - ip: "10.0.0.1"
        prefix-length: 24
```

### Example 4: Save Configuration

```yaml
# Method: POST
# RPC call:

- "/mchp-velocitysp-system:save-config":
```

### Example 5: Disable DTLS Security

```yaml
# Method: iPATCH
# Change security mode:

- "/mchp-velocitysp-system:coap-server/config/security-mode": "no-sec"
```

## 🛠️ Project Structure

```
codingtest/
├── index.html              # Main application page
├── css/
│   └── style.css          # Modern responsive styling
├── js/
│   ├── webserial-core.js  # WebSerial API wrapper
│   ├── mup1-protocol.js   # MUP1 protocol implementation
│   ├── coap-builder.js    # CoAP message builder
│   └── app.js             # Main application logic
├── docs/
│   └── CODING_TEST.html   # Coding test problem description
└── README.md              # This file
```

## 📚 Technical Details

### JavaScript Modules

#### `webserial-core.js`
- Wraps WebSerial API for easy serial communication
- Handles port selection, connection, read/write operations
- Provides callbacks for data, connection, and error events

#### `mup1-protocol.js`
- Implements MUP1 frame encoding/decoding
- Calculates XOR checksum for frame validation
- Handles multiple frame types (CoAP, TRACE, ANNOUNCE)
- Provides frame buffering and extraction

#### `coap-builder.js`
- Constructs CoAP messages according to RFC7252
- Supports all CORECONF methods (GET, FETCH, iPATCH, POST, PUT, DELETE)
- Implements option encoding with delta compression
- Handles CBOR payload integration

#### `app.js`
- Main application logic and UI event handling
- Integrates WebSerial, MUP1, and CoAP modules
- Parses YAML/JSON input using js-yaml library
- Displays responses in multiple formats

### Dependencies

External libraries loaded from CDN:

- **cbor-web** (9.0.1): CBOR encoding/decoding
- **js-yaml** (4.1.0): YAML parsing

## 🎓 Coding Test

This repository includes a comprehensive coding test problem for developers interested in learning about:

- Binary protocol implementation
- WebSerial API usage
- CoAP message construction
- CBOR encoding

**👉 [View Coding Test Problem](docs/CODING_TEST.html)**

The test includes:
- Detailed protocol specifications
- Implementation challenges (Easy → Hard)
- Test cases with expected outputs
- Evaluation criteria
- Bonus point opportunities

## 🔗 Related Projects

- **VelocityDRIVE-SP Support**: https://github.com/microchip-ung/velocitydrivesp-support
- **Original Ruby Client**: `mup1cc` and `mup1ct` scripts in support repository

## 📖 References

### Standards & RFCs

- **RFC7252**: [The Constrained Application Protocol (CoAP)](https://datatracker.ietf.org/doc/rfc7252/)
- **RFC7951**: [JSON Encoding of Data Modeled with YANG](https://datatracker.ietf.org/doc/rfc7951/)
- **RFC9254**: [CBOR Encoding of Data Modeled with YANG](https://datatracker.ietf.org/doc/rfc9254/)
- **RFC9595**: [YANG Schema Item iDentifier (YANG SID)](https://datatracker.ietf.org/doc/rfc9595/)

### Web APIs

- **WebSerial API**: [WICG Specification](https://wicg.github.io/serial/)
- **WebSerial MDN**: [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)

### Microchip Resources

- **VelocityDRIVE Press Release**: [Microchip Announcement](https://www.microchip.com/en-us/about/news-releases/products/new-velocitydrive-software-platform-and-automotive-qualified)
- **VelocityDRIVE-SP**: [Product Page](https://www.microchip.com/en-us/software-library/velocitydrive-sp)

## 🤝 Contributing

Contributions welcome! This project serves as:

1. **Educational Tool**: Learn about binary protocols and embedded communication
2. **Development Reference**: Example of WebSerial API usage
3. **Coding Test Platform**: Practice problems for protocol implementation

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions

- Add unit tests (Jest, Mocha, etc.)
- Implement CoAP observe (0.05) for notifications
- Add SID (Schema Item iDentifier) support
- Create Wireshark-style packet visualization
- Support IP-based CoAP in addition to MUP1
- Add more CORECONF examples
- Improve error handling and validation

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## ✨ Acknowledgments

- **Microchip Technology Inc.** for VelocityDRIVE-SP platform and documentation
- **IETF** for CoAP, CBOR, and CORECONF standards
- **WICG** for WebSerial API specification

## 📧 Contact

- **GitHub**: https://github.com/hwkim3330/codingtest
- **Issues**: https://github.com/hwkim3330/codingtest/issues

---

**Built with ❤️ using WebSerial API, CoAP, MUP1, and CBOR**

**Live Demo**: https://hwkim3330.github.io/codingtest/
