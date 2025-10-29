# VelocityDRIVE-SP WebSerial Client - Implementation Details

Based on analysis of [velocitydrivesp-support](https://github.com/microchip-ung/velocitydrivesp-support) repository.

## 📚 Repository Analysis Summary

### Core Components Analyzed

#### 1. **MUP1 Protocol** (`support/libeasy/handler/mup1.rb`)
- Frame format: `>TYPE[ESCAPED_DATA]<[<]CHECKSUM`
- 16-bit one's complement checksum (TCP/IP style)
- Escape sequences: `\>`, `\<`, `\\`, `\0`, `\F`
- EOF: Single `<` for odd-length, double `<<` for even-length
- Type: `0x43` ('C') for CoAP frames

#### 2. **CoAP Handler** (`support/libeasy/handler/coap.rb`)
- BlockWise transfer support (Block1/Block2)
- Retransmission mechanism (3 seconds timeout, 5 retries)
- Methods: GET, POST, PUT, DELETE, FETCH, iPATCH
- Request/Response state machine

#### 3. **CoAP Frame** (`support/libeasy/frame/coap.rb`)
```ruby
# Constants
CODE_GET = 1
CODE_POST = 2
CODE_PUT = 3
CODE_DEL = 4
CODE_FETCH = 5
CODE_IPATCH = 7

# Content Types
CT_APPL_CBOR                  = 60
CT_APPL_YANG_DATA_CBOR        = 140
CT_APPL_YANG_IDENTIFIERS_CBOR = 141
CT_APPL_YANG_INSTANCES_CBOR   = 142

# Options
OPT_URI_PATH = 11
OPT_CONTENT_FORMAT = 12
OPT_URI_QUERY = 15
OPT_ACCEPT = 17
OPT_BLOCK1 = 27
OPT_BLOCK2 = 23
```

#### 4. **YANG Encoding** (`support/yang-enc/yang-enc.rb`)
- Converts between RFC7951 (JSON/YAML) and RFC9254 (CBOR)
- Uses SID (Schema Item Identifier) mapping
- Delta-SID encoding for nested structures
- Content formats: `yang`, `fetch`, `ipatch`, `get`, `put`, `post`

#### 5. **mup1cc Client** (`support/scripts/mup1cc`)
```ruby
# Line 310: FETCH uses CT 141 (identifiers)
res = coap.fetch(url, cbor_req, {:content_type => Et::Frame::Coap::CT_APPL_YANG_IDENTIFIERS_CBOR})

# Line 314: iPATCH uses CT 142 (instances)
res = coap.ipatch(url, cbor_req, {:content_type => Et::Frame::Coap::CT_APPL_YANG_INSTANCES_CBOR})

# Line 324: PUT uses CT 140 (data)
res = coap.put(url, cbor_req, {:content_type => Et::Frame::Coap::CT_APPL_YANG_DATA_CBOR})

# Line 327: POST uses CT 142 (instances)
res = coap.post(url, cbor_req, {:content_type => Et::Frame::Coap::CT_APPL_YANG_INSTANCES_CBOR})
```

## 🎯 Implementation Comparison

### Our Implementation vs Reference

| Feature | Reference (Ruby) | Our Implementation (JS) | Status |
|---------|-----------------|-------------------------|--------|
| MUP1 Framing | ✓ | ✓ | ✅ Complete |
| 16-bit Checksum | ✓ | ✓ | ✅ Complete |
| Escape Sequences | ✓ | ✓ | ✅ Complete |
| CoAP Parsing | ✓ | ✓ | ✅ Complete |
| CoAP Building | ✓ | ✓ | ✅ Complete |
| Content-Type 140/141/142 | ✓ | ✓ | ✅ Fixed |
| Block Transfer | ✓ | ⚠️ | ⚠️ Partial |
| CBOR Encode/Decode | ✓ | ✓ | ✅ Complete |
| YANG→CBOR | ✓ (with schema) | ✓ (basic) | ⚠️ No schema |
| SID Mapping | ✓ | ❌ | ❌ Missing |
| Schema Validation | ✓ | ❌ | ❌ Missing |

## 📋 Example Requests from README.adoc

### 1. Get All Configuration
```bash
dr mup1cc -d /dev/ttyACM0 -q c=c -m get
```

**Protocol Flow:**
```
1. CoAP GET /c?c=c
2. Accept: 142 (instances)
3. Response: CBOR with full config
```

**Expected Response Structure:**
```yaml
ietf-interfaces:interfaces:
  interface:
  - name: "1"
    type: "ethernetCsmacd"
    enabled: true
  - name: "2"
    type: "ethernetCsmacd"
    enabled: true
ietf-system:system:
  hostname: "velocitysp"
  contact: ""
  location: ""
mchp-velocitysp-system:coap-server:
  config:
    security-mode: "psk"
```

### 2. Fetch Specific Interfaces
```bash
cat <<EOF > fetch-req.yaml
- "/ietf-interfaces:interfaces/interface[name='1']"
- "/ietf-interfaces:interfaces/interface[name='2']"
EOF
dr mup1cc -d /dev/ttyACM0 -m fetch -i fetch-req.yaml
```

**Protocol Flow:**
```
1. CoAP FETCH /c
2. Content-Type: 141 (identifiers)
3. Accept: 142 (instances)
4. Body: CBOR array of path strings
```

### 3. Set IP Address (iPATCH)
```bash
cat <<EOF > ipatch-req.yaml
- ? "/ietf-interfaces:interfaces/interface[name='L3V1']"
  : name: "L3V1"
    ietf-ip:ipv4:
      address:
      - ip: "10.0.0.1"
        prefix-length: 24
EOF
dr mup1cc -d /dev/ttyACM0 -m ipatch -i ipatch-req.yaml
```

**Protocol Flow:**
```
1. CoAP iPATCH /c
2. Content-Type: 142 (instances)
3. Accept: 142 (instances)
4. Body: CBOR array of path→value mappings
```

### 4. Save Configuration (POST)
```bash
cat <<EOF > post-req.yaml
- "/mchp-velocitysp-system:save-config":
EOF
dr mup1cc -d /dev/ttyACM0 -m post -i post-req.yaml
```

**Protocol Flow:**
```
1. CoAP POST /c
2. Content-Type: 142 (instances)
3. Accept: 142 (instances)
4. Body: CBOR array with RPC path and null value
```

### 5. Disable DTLS Security
```bash
cat <<EOF > ipatch-nosec.yaml
- "/mchp-velocitysp-system:coap-server/config/security-mode": "no-sec"
EOF
dr mup1cc -d /dev/ttyACM0 -m ipatch -i ipatch-nosec.yaml
```

## 🔍 YANG Modules Found

### Standard IETF Modules (in pyang/modules/ietf/)
- **ietf-interfaces.yang** - Network interface configuration
- **ietf-ip.yang** - IPv4/IPv6 address configuration
- **ietf-system.yang** - System identification, time, user management
- **ietf-netconf-acm.yang** - Access control
- **ietf-yang-library.yang** - YANG library information

### VelocitySP Specific Modules
- **mchp-velocitysp-system** - System-specific configuration
  - `/coap-server/config/security-mode`
  - `/save-config` (RPC)

## 🐛 Known Issues in Current Implementation

### 1. Missing SID Resolution
- **Problem**: YANG paths use string names, but CBOR uses numeric SIDs
- **Impact**: Cannot properly encode/decode without SID file
- **Solution**: Need to download and parse `.sid` files from device

### 2. No Schema Validation
- **Problem**: No validation of request structure
- **Impact**: Can send invalid requests
- **Solution**: Implement JSON Schema validation like Ruby version

### 3. Limited Block Transfer
- **Problem**: No BlockWise transfer implementation
- **Impact**: Large configs (>256 bytes) won't work
- **Solution**: Implement Block1/Block2 options

### 4. Hardcoded Content-Types
- **Problem**: Content-Type selection is per-method
- **Impact**: May not match device expectations
- **Solution**: Already fixed based on mup1cc analysis

## 📦 Next Steps

### Phase 1: Core Fixes (High Priority)
- [ ] Implement SID file download and parsing
- [ ] Add YANG schema integration
- [ ] Implement BlockWise transfer
- [ ] Add comprehensive error handling

### Phase 2: Enhanced Features
- [ ] YANG path validation
- [ ] Schema-aware tree building
- [ ] Auto-complete for paths
- [ ] Type-aware value editing

### Phase 3: Testing
- [ ] Create mock device responses
- [ ] Unit tests for protocol stack
- [ ] Integration tests with examples
- [ ] Browser compatibility testing

## 🔗 References

### Ruby Implementation
- **mup1cc**: Line-by-line CoAP client implementation
- **mup1.rb**: MUP1 protocol with checksum logic
- **coap.rb**: CoAP handler with BlockWise support
- **yang-enc.rb**: RFC7951↔RFC9254 conversion

### RFCs
- **RFC7252**: CoAP Protocol
- **RFC7951**: JSON Encoding of YANG Data
- **RFC9254**: CBOR Encoding of YANG Data
- **RFC8040**: RESTCONF Protocol (similar concepts)

### Standards
- **IEEE 802.1Qbv**: Time-Aware Shaper (TAS)
- **IEEE 802.1Qav**: Credit-Based Shaper (CBS)
- **IEEE 802.1CB**: Frame Replication and Elimination (FRER)

## 💡 Implementation Notes

### Content-Type Selection Logic
```javascript
// Based on mup1cc lines 310-327
switch (method) {
    case 'GET':
        // No content-type (no body)
        accept = 142;  // instances
        break;

    case 'FETCH':
        contentType = 141;  // identifiers (paths are SIDs)
        accept = 142;        // instances (response is data)
        break;

    case 'iPATCH':
    case 'POST':
        contentType = 142;  // instances
        accept = 142;        // instances
        break;

    case 'PUT':
        contentType = 140;  // data
        accept = 140;        // data
        break;
}
```

### YANG Path Format
```
# String format (RFC7951)
/ietf-interfaces:interfaces/interface[name='1']/enabled

# CBOR format (RFC9254 with SIDs)
{
  1234: {  // SID for "ietf-interfaces:interfaces"
    5678: [  // SID for "interface"
      {
        9012: "1",      // SID for "name"
        3456: true      // SID for "enabled"
      }
    ]
  }
}
```

### iPATCH vs PUT Difference
- **iPATCH**: Merge patch - modifies only specified nodes
- **PUT**: Full replacement - replaces entire resource

### Error Responses
```yaml
# From mup1cc line 316-317
# iPATCH may return error in CBOR format
# Content-Type: CT_APPL_YANG_DATA_CBOR (140)
```

## 🎓 Learning Resources

1. **VelocityDRIVE-SP Docs**: http://mscc-ent-open-source.s3-website-eu-west-1.amazonaws.com/
2. **YANG Catalog**: Download by checksum (SHA)
3. **WebSerial API**: https://wicg.github.io/serial/
4. **CBOR**: https://cbor.io/

---

**Last Updated**: 2025-01-29
**Based on**: velocitydrivesp-support commit d7f8b3c
