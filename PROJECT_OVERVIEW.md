# VelocityDRIVE-SP WebSerial Configuration System - Project Overview

## 📋 Table of Contents

1. [Project Introduction](#project-introduction)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Completed Features](#completed-features)
4. [Data Structure Details](#data-structure-details)
5. [Usage Guide](#usage-guide)
6. [Interactive Demos](#interactive-demos)
7. [API Reference](#api-reference)
8. [Development Process](#development-process)

---

## 🎯 Project Introduction

### Overview

VelocityDRIVE-SP WebSerial Configuration System은 Microchip의 산업용 이더넷 스위치 플랫폼인 **VelocityDRIVE-SP**를 브라우저에서 직접 제어할 수 있는 웹 기반 설정 도구입니다.

### Key Features

- 🌐 **Browser-Based Serial Communication**: WebSerial API를 사용한 직접적인 시리얼 포트 통신
- 📋 **Registry-Style Configuration Editor**: Apple 스타일의 YANG 트리 브라우저
- 🧪 **Test Mode**: 하드웨어 없이 완전한 오프라인 테스트 가능
- 📺 **Interactive Demos**: 실시간 코드 생성이 포함된 인터랙티브 데모
- 📁 **Complete Mock Data**: 687줄의 현실적인 모든 기능 모의 데이터
- 📖 **Example Configurations**: 즉시 사용 가능한 YAML 예제 파일

### Project Goals

1. ✅ **완벽한 데이터 구조**: 공식 문서 기반의 정확한 YANG 데이터 모델 구현
2. ✅ **사용자 친화적 인터페이스**: 복잡한 네트워크 설정을 직관적으로 수행
3. ✅ **교육 및 데모**: TSN 기능을 쉽게 이해할 수 있는 인터랙티브 데모
4. ✅ **개발 및 테스트**: 하드웨어 없이 개발과 테스트 가능

---

## 🏗️ Architecture & Technology Stack

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Chrome/Edge)                 │
├─────────────────────────────────────────────────────────┤
│  WebSerial API │ JavaScript ES6 Modules │ Chart.js      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐    │
│  │ Config      │  │ Simple       │  │ Interactive │    │
│  │ Editor      │  │ Client       │  │ Demos       │    │
│  │ (Registry)  │  │ (GET/iPATCH) │  │ (3 demos)   │    │
│  └─────────────┘  └──────────────┘  └─────────────┘    │
│         │                 │                  │           │
│         └─────────────────┴──────────────────┘           │
│                           │                               │
│              ┌────────────▼────────────┐                 │
│              │  Protocol Stack         │                 │
│              │  ┌──────────────────┐  │                 │
│              │  │ YANG/CORECONF    │  │                 │
│              │  │ CoAP (RFC7252)   │  │                 │
│              │  │ CBOR Encoding    │  │                 │
│              │  │ MUP1 Protocol    │  │                 │
│              │  └──────────────────┘  │                 │
│              └─────────────────────────┘                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ USB Serial (WebSerial API)
                       │
┌──────────────────────▼──────────────────────────────────┐
│              VelocityDRIVE-SP Device                     │
│              (LAN9662 / LAN9668)                         │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **HTML5** | - | Structure and layout |
| **CSS3** | - | Apple-style design system |
| **JavaScript** | ES6+ | Logic and interactivity |
| **WebSerial API** | - | Direct serial port access |
| **Chart.js** | 4.4.0 | Data visualization |
| **js-yaml** | 4.1.0 | YAML parsing/generation |
| **cbor-web** | 9.0.1 | CBOR encoding/decoding |

#### Protocol Stack

| Protocol | Standard | Implementation |
|----------|----------|----------------|
| **MUP1** | Microchip Proprietary | `js/mup1-protocol.js` |
| **CoAP** | RFC 7252 | `js/coap-builder.js` |
| **CORECONF** | RFC 9254 | `js/yang-browser.js` |
| **YANG** | RFC 7950 | YANG data models |
| **CBOR** | RFC 8949 | Message encoding |

#### Design System

- **Color Palette**:
  - Primary Blue: `#007AFF` (Apple system blue)
  - Success Green: `#34C759`
  - Warning Orange: `#FF9500`
  - Danger Red: `#FF3B30`
- **Typography**: `-apple-system, BlinkMacSystemFont, "SF Pro Text"`
- **Layout**: Grid-based responsive design
- **Components**: Apple-style buttons, inputs, cards

---

## ✅ Completed Features

### 1. Core Configuration Tools

#### A. Simple CORECONF Client (`index.html`)

**기능:**
- GET: 전체 설정 가져오기 (`c=c` 쿼리)
- FETCH: 특정 경로 배치 조회
- iPATCH: 부분 설정 업데이트
- POST: 액션 실행 (save-config 등)

**특징:**
- YAML/JSON/Hex 다중 출력 포맷
- 예제 버튼으로 빠른 테스트
- 실시간 프로토콜 로깅
- Content-Type 자동 처리 (140/141/142)

#### B. Registry-Style Config Editor (`config-editor.html`)

**기능:**
- 📁 YANG 트리 브라우저 (계층적 뷰)
- ✏️ 멀티뷰 에디터 (Form/YAML/JSON)
- 📊 변경 사항 추적 (Pending changes)
- 🔄 자동 GET 전체 설정
- 💾 플래시 저장 (POST save-config)
- 📤 YAML 내보내기
- 🧪 테스트 모드 (오프라인)

**YANG 모듈:**
```
├── ietf-interfaces
├── ietf-system
├── ietf-yang-library
├── ieee802-dot1q-bridge
├── ieee802-ethernet-interface
├── ieee1588-ptp
├── mchp-velocitysp-system
├── mchp-velocitysp-port
└── mchp-velocitysp-ptp
```

### 2. Interactive Demos (3개 완성)

#### Demo 1: Port Configuration
**파일**: `demos/port-config-demo.html`

**설정 항목:**
- Administrative state (enabled/disabled)
- Description (포트 설명)
- Auto-negotiation (on/off)
- Speed (10/100/1000/2500/10000 Mbps)
- Duplex (auto/half/full)
- Max frame length (64-9600 bytes)
- Flow control

**출력**: 실시간 iPATCH YAML 코드 생성

#### Demo 2: VLAN Configuration
**파일**: `demos/vlan-config-demo.html`

**설정 항목:**
- VLAN ID (1-4094)
- VLAN Name
- Access Ports (untagged) - 체크박스 선택
- Trunk Ports (tagged) - 체크박스 선택
- Acceptable frame type
- Ingress filtering

**출력**:
- 시각적 네트워크 토폴로지 다이어그램
- 3단계 iPATCH YAML (포트 설정 → 트렁크 설정 → VLAN 생성)

#### Demo 3: TSN Credit-Based Shaper (CBS)
**파일**: `demos/tsn-cbs-demo.html`

**설정 항목:**
- TC6 (Audio - Class A): Idle/Send slope
- TC5 (Video - Class B): Idle/Send slope
- TC2 (Control): Idle/Send slope
- 자동 대역폭 계산

**출력**:
- 실시간 대역폭 할당 차트
- 공식 설명 (IdleSlope, SendSlope 계산)
- iPATCH YAML 코드

### 3. Mock Data Structure (687 Lines)

**파일**: `js/test-mode.js`

**완성된 데이터 모듈:**

| 모듈 | 항목 수 | 주요 내용 |
|------|--------|-----------|
| **Port Configuration** | 4 ports | speed, duplex, auto-neg, status, MAC, counters |
| **QoS Configuration** | 8 TCs | PCP encoding/decoding, shapers, schedulers |
| **VLAN/Bridge** | 3 VLANs | filtering-database, port-map, tagged/untagged |
| **System Config** | - | NTP servers, user auth, CoAP PSK keys |
| **System State** | - | platform info, clock, uptime |
| **CoAP Server** | - | security-mode, DTLS ciphers, connection state |
| **Switch Config** | - | port array, VLAN array, bridge info |
| **TSN QoS** | - | priority map, CBS slopes, TAS gate control |
| **PTP/IEEE1588** | 1 instance | LTC with 1PPS, default-ds, parent-ds, servos |
| **PSFP** | 3 streams | null/SMAC/IP identification, gates, meters |

**PTP 상세 구조:**
```javascript
"ieee1588-ptp:ptp": {
    "mchp-velocitysp-ptp:ltcs": {
        "ltc": [{
            "ltc-index": 1,
            "ptp-pins": { "ptp-pin": [{ "index": 4, "function": "1pps-out" }] }
        }]
    },
    "instances": {
        "instance": [{
            "instance-index": 0,
            "default-ds": { /* clock-identity, priorities, domain */ },
            "parent-ds": { /* grandmaster info */ },
            "ports": { "port": [{ /* port-state, sync intervals */ }] },
            "mchp-velocitysp-ptp:servos": {
                "servo": [{ "servo-type": "pi", "ltc-index": 0 }]
            }
        }]
    }
}
```

**PSFP 상세 구조:**
```javascript
"ieee802-dot1cb-stream-identification:stream-identity": [
    { "index": 1, "null-stream-identification": { /* DMAC+VLAN */ } },
    { "index": 2, "smac-vlan-stream-identification": { /* SMAC+VLAN */ } },
    { "index": 3, "ip-stream-identification": { /* 5-tuple */ } }
],
"ieee802-dot1cb-frer:stream-filters": [{ /* gate/meter mapping */ }],
"ieee802-dot1cb-frer:stream-gates": [{ /* gate control list */ }],
"ieee802-dot1cb-frer:flow-meters": [{ /* CIR/CBS/EIR/EBS */ }]
```

### 4. Example YAML Files (4개)

| 파일 | 용도 | 주요 설정 |
|------|------|-----------|
| `example-port-config.yaml` | 포트 설정 | speed=1000, duplex=full, max-frame=9600 |
| `example-vlan-config.yaml` | VLAN 설정 | VLAN 100, Port 1 access, Port 3 trunk |
| `example-tsn-cbs.yaml` | CBS 대역폭 예약 | TC6=3.5Mbps, TC5=2.0Mbps, TC2=1.5Mbps |
| `example-tsn-tas.yaml` | TAS 타임슬롯 | 8 TCs, 200ms cycle, variable gate times |

---

## 📊 Data Structure Details

### YANG Data Model Hierarchy

#### 1. ietf-interfaces Module

**Path Structure:**
```
/ietf-interfaces:interfaces
└── interface[name='X']
    ├── name (string)
    ├── description (string)
    ├── type (identityref)
    ├── enabled (boolean)
    ├── ieee802-ethernet-interface:ethernet
    │   ├── auto-negotiation
    │   │   └── enable (boolean)
    │   └── duplex (enumeration: half/full)
    ├── ieee802-dot1q-bridge:bridge-port
    │   ├── pvid (vlan-id)
    │   ├── port-type (identityref)
    │   ├── acceptable-frame (enumeration)
    │   └── enable-ingress-filtering (boolean)
    └── mchp-velocitysp-port:eth-port
        └── config
            ├── speed (string)
            ├── duplex (string)
            ├── max-frame-length (uint16)
            └── flow-control (boolean)
```

**Example iPATCH:**
```yaml
- ? "/ietf-interfaces:interfaces/interface[name='1']/enabled"
  : true

- ? "/ietf-interfaces:interfaces/interface[name='1']/mchp-velocitysp-port:eth-port/config/speed"
  : "1000"
```

#### 2. ieee802-dot1q-bridge Module

**Path Structure:**
```
/ieee802-dot1q-bridge:bridges
└── bridge[name='b0']
    └── component[name='c0']
        ├── filtering-database
        │   └── vlan-registration-entry[]
        │       ├── database-id (uint32)
        │       ├── vids (vlan-id)
        │       ├── entry-type (static/dynamic)
        │       └── port-map[]
        │           ├── port-ref (port-number)
        │           └── static-vlan-registration-entries
        │               └── vlan-transmitted (tagged/untagged)
        └── bridge-vlan
            ├── vlan[]
            │   ├── vid (vlan-id)
            │   └── name (string)
            └── mchp-velocitysp-bridge:custom-ether-type (uint16)
```

**Example iPATCH (Create VLAN 100):**
```yaml
- ? "/ieee802-dot1q-bridge:bridges/bridge[name='b0']/component[name='c0']/filtering-database/vlan-registration-entry"
  : database-id: 0
    vids: '100'
    entry-type: static
    port-map:
    - port-ref: 1
      static-vlan-registration-entries:
        vlan-transmitted: untagged
    - port-ref: 3
      static-vlan-registration-entries:
        vlan-transmitted: tagged
```

#### 3. mchp-velocitysp-system Module

**TSN CBS Path Structure:**
```
/mchp-velocitysp-system:tsn
├── cbs
│   ├── enabled (boolean)
│   └── port-config[]
│       ├── port-id (uint8)
│       ├── tc (uint8)
│       ├── idle-slope (int32)
│       └── send-slope (int32)
└── tas
    ├── enabled (boolean)
    └── port-config[]
        ├── port-id (uint8)
        ├── admin-cycle-time (uint32)
        └── admin-control-list[]
            ├── index (uint32)
            ├── operation (enumeration)
            ├── gate-state-value (bits)
            └── time-interval-value (uint32)
```

**Example CBS Configuration:**
```yaml
# Enable CBS globally
- ? "/mchp-velocitysp-system:tsn/cbs/enabled"
  : true

# Configure TC6 (Audio) on Port 1
- ? "/mchp-velocitysp-system:tsn/cbs/port-config"
  : port-id: 1
    tc: 6
    idle-slope: 3500    # 3.5 Mbps reserved
    send-slope: -6500   # -(10000 - 3500)
```

**CBS Calculation Formulas:**
```
IdleSlope = Bandwidth to reserve (Kbps)
SendSlope = -(PortSpeed - IdleSlope)
Bandwidth % = (IdleSlope / PortSpeed) × 100

Example for 10 Mbps port:
  TC6 Audio: IdleSlope = 3500 Kbps (3.5 Mbps)
             SendSlope = -(10000 - 3500) = -6500 Kbps
             Bandwidth = 35%
```

#### 4. ieee1588-ptp Module

**Path Structure:**
```
/ieee1588-ptp:ptp
├── mchp-velocitysp-ptp:ltcs
│   └── ltc[ltc-index]
│       ├── ltc-index (uint8)
│       └── ptp-pins
│           └── ptp-pin[index]
│               ├── index (uint8)
│               └── function (enumeration: 1pps-out/1pps-in/clock-out)
└── instances
    └── instance[instance-index]
        ├── instance-index (uint8)
        ├── default-ds
        │   ├── clock-identity (string)
        │   ├── priority1 (uint8)
        │   ├── priority2 (uint8)
        │   ├── domain-number (uint8)
        │   └── instance-enable (boolean)
        ├── parent-ds
        │   ├── parent-port-identity { clock-identity, port-number }
        │   ├── grandmaster-identity (string)
        │   └── grandmaster-clock-quality { clock-class, clock-accuracy }
        ├── ports
        │   └── port[port-index]
        │       └── port-ds
        │           ├── port-state (enumeration)
        │           ├── log-sync-interval (int8)
        │           └── log-min-pdelay-req-interval (int8)
        └── mchp-velocitysp-ptp:servos
            └── servo[servo-index]
                ├── servo-type (enumeration: pi/p/i)
                ├── ltc-index (uint8)
                └── state (uint8)
```

#### 5. PSFP Module

**Stream Identification Types:**

**Type 1: Null (DMAC + VLAN)**
```yaml
- index: 1
  handle: 2
  out-facing:
    input-port: ["1"]
  null-stream-identification:
    destination-mac: "01-02-03-04-05-06"
    tagged: all
    vlan: 0
```

**Type 2: SMAC + VLAN**
```yaml
- index: 2
  handle: 3
  smac-vlan-stream-identification:
    source-mac: "00-01-02-03-04-05"
    tagged: all
    vlan: 10
```

**Type 3: IP 5-Tuple**
```yaml
- index: 3
  handle: 4
  ip-stream-identification:
    destination-mac: "01-02-03-04-05-06"
    vlan: 10
    ipv4:
      source-address: "192.168.1.10"
      destination-address: "192.168.1.20"
      dscp: 46
      protocol: 17
      source-port: 5000
      destination-port: 6000
```

**Stream Filter Configuration:**
```yaml
stream-filters:
  - filter-id: 1
    stream-handle-spec: 2
    stream-gate-instance-id: 1
    flow-meter-instance-id: 0
    maximum-sdu-size: 1522
    filter-enable: true
```

**Stream Gate Configuration:**
```yaml
stream-gates:
  - gate-id: 1
    gate-enable: true
    admin-control-list:
      admin-cycle-time:
        numerator: 1000000    # 1ms cycle
        denominator: 1
      admin-control-list-entry:
        - index: 0
          operation-name: set-gate-states
          time-interval-value: 500000  # 500μs open
          gate-states-value: 1         # Open
        - index: 1
          operation-name: set-gate-states
          time-interval-value: 500000  # 500μs closed
          gate-states-value: 0         # Closed
```

**Flow Meter Configuration:**
```yaml
flow-meters:
  - meter-id: 1
    committed-information-rate: 10000000   # 10 Mbps
    committed-burst-size: 12000            # 12 KB
    excess-information-rate: 0
    excess-burst-size: 0
    coupling-flag: false
```

---

## 📖 Usage Guide

### Getting Started

#### 1. Simple CORECONF Client

**Access**: https://hwkim3330.github.io/codingtest/

**Steps:**
1. Click "Connect to Device"
2. Select serial port (e.g., `/dev/ttyACM0`, `COM3`)
3. Use example buttons or write custom YAML
4. Click "Send Command"
5. View response in YAML/JSON/Hex format

**Example Commands:**

```yaml
# Get entire configuration
Method: GET
Query: c=c

# Fetch specific interfaces
Method: FETCH
Request:
- "/ietf-interfaces:interfaces/interface[name='1']"
- "/ietf-interfaces:interfaces/interface[name='2']"

# Set IP address
Method: iPATCH
Request:
- ? "/ietf-interfaces:interfaces/interface[name='L3V1']"
  : name: "L3V1"
    ietf-ip:ipv4:
      address:
      - ip: "10.0.0.1"
        prefix-length: 24

# Save configuration to flash
Method: POST
Request:
- "/mchp-velocitysp-system:save-config":

# Disable DTLS security
Method: iPATCH
Request:
- "/mchp-velocitysp-system:coap-server/config/security-mode": "no-sec"
```

#### 2. Registry-Style Config Editor

**Access**: https://hwkim3330.github.io/codingtest/config-editor.html

**Workflow:**

1. **Connect to Device**
   - Click "Connect" button
   - Select serial port
   - Configuration auto-loads with GET

2. **Browse YANG Tree**
   - Expand modules in left sidebar
   - Click nodes to view/edit

3. **Edit Configuration**
   - Use Form view for structured editing
   - Or use YAML/JSON view for direct editing
   - Changes tracked in "Pending Changes"

4. **Apply Changes**
   - Review pending changes
   - Click "Apply Changes" to send iPATCH
   - Configuration updates on device

5. **Save to Flash**
   - Click "Save to Flash" button
   - Sends POST save-config action
   - Configuration persists across reboots

#### 3. Test Mode (Offline Development)

**Enable Test Mode:**
- Click "🧪 Test Mode" button in config-editor.html
- All operations use mock data (no device required)
- Perfect for development and demonstrations

**Mock Data Coverage:**
- ✅ Port configuration (4 ports)
- ✅ QoS configuration (8 TCs)
- ✅ VLAN/Bridge (3 VLANs)
- ✅ System config (NTP, users, auth)
- ✅ TSN (CBS, TAS)
- ✅ PTP/IEEE1588 (complete instance)
- ✅ PSFP (3 stream types)

#### 4. Interactive Demos

**Access**: https://hwkim3330.github.io/codingtest/demos/

**Demo 1: Port Configuration**
- Set speed, duplex, auto-negotiation
- Configure max frame length
- See real-time YANG code generation

**Demo 2: VLAN Configuration**
- Create VLAN with ID and name
- Select access/trunk ports visually
- View network topology diagram

**Demo 3: TSN CBS**
- Configure Audio/Video bandwidth
- Auto-calculate send slopes
- See bandwidth allocation chart

---

## 🔧 API Reference

### CoAP Methods

| Method | Code | Content-Type | Usage |
|--------|------|--------------|-------|
| **GET** | 1 | 140 (CBOR) | Retrieve entire configuration |
| **POST** | 2 | 142 (CBOR) | Execute actions (save-config) |
| **PUT** | 3 | 140 (CBOR) | Replace entire resource |
| **FETCH** | 5 | 141 (CBOR) | Batch retrieve specific paths |
| **iPATCH** | 6 | 142 (CBOR) | Partial update (merge) |

### YANG Modules Reference

#### ietf-interfaces

**Port Configuration:**
```yaml
# Enable port
/ietf-interfaces:interfaces/interface[name='X']/enabled
Type: boolean
Default: true

# Set description
/ietf-interfaces:interfaces/interface[name='X']/description
Type: string
Example: "Port 1 - Front Panel"

# Auto-negotiation
/ietf-interfaces:interfaces/interface[name='X']/ieee802-ethernet-interface:ethernet/auto-negotiation/enable
Type: boolean
Default: true

# Speed
/ietf-interfaces:interfaces/interface[name='X']/mchp-velocitysp-port:eth-port/config/speed
Type: string
Values: "10" | "100" | "1000" | "2500" | "10000" | "auto"

# Duplex
/ietf-interfaces:interfaces/interface[name='X']/mchp-velocitysp-port:eth-port/config/duplex
Type: string
Values: "half" | "full" | "auto"

# Max frame length
/ietf-interfaces:interfaces/interface[name='X']/mchp-velocitysp-port:eth-port/config/max-frame-length
Type: uint16
Range: 64-9600
Default: 1518
```

#### ieee802-dot1q-bridge

**VLAN Configuration:**
```yaml
# Set PVID (Port VLAN ID)
/ietf-interfaces:interfaces/interface[name='X']/ieee802-dot1q-bridge:bridge-port/pvid
Type: vlan-id (1-4094)
Example: 100

# Set port type
/ietf-interfaces:interfaces/interface[name='X']/ieee802-dot1q-bridge:bridge-port/port-type
Type: identityref
Values:
  - ieee802-dot1q-bridge:d-bridge-port (Access port, TAG un-aware)
  - ieee802-dot1q-bridge:c-vlan-bridge-port (Trunk port, C-TAG aware)

# Acceptable frame type (trunk ports)
/ietf-interfaces:interfaces/interface[name='X']/ieee802-dot1q-bridge:bridge-port/acceptable-frame
Type: enumeration
Values:
  - admit-all-frames
  - admit-only-VLAN-tagged-frames
  - admit-only-untagged-and-priority-tagged

# Ingress filtering
/ietf-interfaces:interfaces/interface[name='X']/ieee802-dot1q-bridge:bridge-port/enable-ingress-filtering
Type: boolean
Default: false

# Create VLAN entry
/ieee802-dot1q-bridge:bridges/bridge[name='b0']/component[name='c0']/filtering-database/vlan-registration-entry
Type: list
Key: database-id, vids
Fields:
  - database-id: uint32 (usually 0)
  - vids: vlan-id (e.g., '100')
  - entry-type: static | dynamic
  - port-map: array of { port-ref, static-vlan-registration-entries }
    - vlan-transmitted: tagged | untagged
```

#### mchp-velocitysp-system

**TSN CBS Configuration:**
```yaml
# Enable CBS globally
/mchp-velocitysp-system:tsn/cbs/enabled
Type: boolean
Default: false

# Configure CBS per port/TC
/mchp-velocitysp-system:tsn/cbs/port-config
Type: list
Key: port-id, tc
Fields:
  - port-id: uint8 (1-based)
  - tc: uint8 (0-7, Traffic Class)
  - idle-slope: int32 (Kbps, bandwidth when queue active)
  - send-slope: int32 (Kbps, negative value = -(PortSpeed - IdleSlope))

Example:
  port-id: 1
  tc: 6
  idle-slope: 3500      # 3.5 Mbps reserved
  send-slope: -6500     # -(10000 - 3500) for 10Mbps port
```

**TSN TAS Configuration:**
```yaml
# Enable TAS globally
/mchp-velocitysp-system:tsn/tas/enabled
Type: boolean
Default: false

# Configure TAS per port
/mchp-velocitysp-system:tsn/tas/port-config
Type: list
Key: port-id
Fields:
  - port-id: uint8
  - admin-cycle-time: uint32 (nanoseconds)
  - admin-control-list: array
    - index: uint32
    - operation: set-gate-states | set-and-hold-mac | set-and-release-mac
    - gate-state-value: bits (8 bits, one per TC)
    - time-interval-value: uint32 (nanoseconds)

Example (200ms cycle, TC0 gets 50ms):
  port-id: 1
  admin-cycle-time: 200000000
  admin-control-list:
    - index: 0
      operation: set-gate-states
      gate-state-value: 0b00000001  # TC0 open
      time-interval-value: 50000000
    - index: 1
      operation: set-gate-states
      gate-state-value: 0b00000010  # TC1 open
      time-interval-value: 30000000
```

**QoS Priority Mapping:**
```yaml
# PCP to Priority mapping (ingress)
/mchp-velocitysp-system:qos/pcp-encoding-table/pcp-encoding-map
Type: list
Key: pcp
Fields:
  - pcp: uint8 (0-7, Priority Code Point from VLAN tag)
  - priority: uint8 (0-7, internal priority/TC)

Example (map PCP 0-3 → Priority 6, PCP 4-7 → Priority 2):
  - pcp: 0, priority: 6
  - pcp: 1, priority: 6
  - pcp: 2, priority: 6
  - pcp: 3, priority: 6
  - pcp: 4, priority: 2
  - pcp: 5, priority: 2
  - pcp: 6, priority: 2
  - pcp: 7, priority: 2
```

**System Actions:**
```yaml
# Save configuration to flash
/mchp-velocitysp-system:save-config
Type: action (POST)
No parameters

# Reboot device
/mchp-velocitysp-system:reboot
Type: action (POST)
No parameters
```

#### ieee1588-ptp

**PTP Instance Configuration:**
```yaml
# Configure LTC (Local Time Clock)
/ieee1588-ptp:ptp/mchp-velocitysp-ptp:ltcs/ltc[ltc-index]
Fields:
  - ltc-index: uint8
  - ptp-pins/ptp-pin[index]:
    - index: uint8 (pin number)
    - function: 1pps-out | 1pps-in | clock-out

# Configure PTP instance
/ieee1588-ptp:ptp/instances/instance[instance-index]
Fields:
  - instance-index: uint8
  - default-ds:
    - clock-identity: string (format: XX-XX-XX-FF-FE-XX-XX-XX)
    - priority1: uint8 (0-255, lower = better)
    - priority2: uint8 (0-255, lower = better)
    - domain-number: uint8 (0-255)
    - instance-enable: boolean
  - parent-ds:
    - parent-port-identity: { clock-identity, port-number }
    - grandmaster-identity: string
    - grandmaster-clock-quality: { clock-class, clock-accuracy }
  - ports/port[port-index]:
    - port-index: uint8
    - port-ds:
      - port-state: initializing | listening | passive | uncalibrated | slave | master | disabled
      - log-sync-interval: int8 (2^n seconds, e.g., -3 = 125ms)
      - log-min-pdelay-req-interval: int8
  - servos/servo[servo-index]:
    - servo-index: uint8
    - servo-type: pi | p | i
    - ltc-index: uint8
```

#### PSFP (Per-Stream Filtering and Policing)

**Stream Identification:**
```yaml
# Null stream identification (DMAC + VLAN)
/ieee802-dot1cb-stream-identification:stream-identity[index]
Type: list
Key: index
Fields:
  - index: uint32
  - handle: uint32 (stream handle ID)
  - out-facing:
    - input-port: array of port numbers
  - null-stream-identification:
    - destination-mac: mac-address
    - tagged: all | tagged | untagged
    - vlan: vlan-id

# SMAC stream identification
  - smac-vlan-stream-identification:
    - source-mac: mac-address
    - tagged: all | tagged | untagged
    - vlan: vlan-id

# IP stream identification (5-tuple)
  - ip-stream-identification:
    - destination-mac: mac-address
    - vlan: vlan-id
    - ipv4:
      - source-address: ipv4-address
      - destination-address: ipv4-address
      - dscp: uint8 (0-63)
      - protocol: uint8 (6=TCP, 17=UDP)
      - source-port: uint16
      - destination-port: uint16
```

**Stream Filter:**
```yaml
/ieee802-dot1cb-frer:stream-filters[filter-id]
Fields:
  - filter-id: uint32
  - stream-handle-spec: uint32 (references stream handle)
  - stream-gate-instance-id: uint32 (0 = none)
  - flow-meter-instance-id: uint32 (0 = none)
  - maximum-sdu-size: uint32 (bytes)
  - filter-enable: boolean
```

**Stream Gate:**
```yaml
/ieee802-dot1cb-frer:stream-gates[gate-id]
Fields:
  - gate-id: uint32
  - gate-enable: boolean
  - admin-control-list:
    - admin-cycle-time:
      - numerator: uint32 (nanoseconds)
      - denominator: uint32 (usually 1)
    - admin-control-list-entry:
      - index: uint32
      - operation-name: set-gate-states
      - time-interval-value: uint32 (nanoseconds)
      - gate-states-value: uint8 (0=closed, 1=open)
```

**Flow Meter:**
```yaml
/ieee802-dot1cb-frer:flow-meters[meter-id]
Fields:
  - meter-id: uint32
  - committed-information-rate: uint32 (bps)
  - committed-burst-size: uint32 (bytes)
  - excess-information-rate: uint32 (bps)
  - excess-burst-size: uint32 (bytes)
  - coupling-flag: boolean
```

---

## 🚀 Development Process

### Phase 1: Core Infrastructure (완료)

**Tasks Completed: 56/113**

1. ✅ MUP1 Protocol Implementation
   - 16-bit one's complement checksum
   - Proper escape sequence handling
   - EOF marker logic (single/double `<`)

2. ✅ CoAP Message Builder
   - Content-Type handling (140/141/142)
   - Token generation
   - CBOR payload encoding

3. ✅ WebSerial Core
   - Serial port connection
   - Data read/write
   - MUP1 frame parsing

4. ✅ YANG Browser
   - Hierarchical tree view
   - Module loading
   - Path navigation

5. ✅ Registry-Style Config Editor
   - Apple design system
   - Multi-view editor (Form/YAML/JSON)
   - Change tracking
   - Auto-load configuration

6. ✅ Comprehensive Mock Data (687 lines)
   - Port configuration (4 ports)
   - QoS configuration (8 TCs)
   - VLAN/Bridge (3 VLANs)
   - System config (NTP, users, CoAP auth)
   - TSN (CBS, TAS with gate control)
   - PTP/IEEE1588 (LTC, instance, servos)
   - PSFP (3 stream types, gates, meters)

### Phase 2: Interactive Demos & Examples (완료)

**Tasks Completed: 8/8**

1. ✅ Created 4 Example YAML Files
   - Port configuration example
   - VLAN configuration example
   - TSN CBS example
   - TSN TAS example

2. ✅ Created 3 Interactive HTML Demos
   - Port Configuration Demo
   - VLAN Configuration Demo
   - TSN CBS Demo

3. ✅ Created Demos Index Page
   - Landing page with all demos
   - Main tools navigation
   - "Coming Soon" placeholders

4. ✅ Updated Documentation
   - README.md with demos section
   - Example files documentation

### Phase 3: Documentation (완료)

1. ✅ PROJECT_OVERVIEW.md (this document)
   - Complete project documentation
   - Architecture details
   - Data structure reference
   - API reference
   - Usage guide

### Remaining Work (Coming Soon)

**Interactive Demos (5 more):**
- 🔜 TSN TAS Configuration Demo
- 🔜 QoS Configuration Demo
- 🔜 PTP Configuration Demo
- 🔜 PSFP Configuration Demo
- 🔜 Security Configuration Demo

**Documentation:**
- 🔜 CONFIGURATION_GUIDE.md (step-by-step scenarios)
- 🔜 API_REFERENCE.md (detailed YANG paths)

**Enhancements:**
- 🔜 Port statistics/counters display
- 🔜 Validation rules in config editor
- 🔜 Enhanced tree browser (type indicators, mandatory flags)

---

## 📚 References

### Official Resources

- **VelocityDRIVE-SP Documentation**: https://github.com/microchip-ung/velocitydrivesp-documentation
- **VelocityDRIVE-SP Support Tools**: https://github.com/microchip-ung/velocitydrivesp-support
- **MUP1 Protocol Reference**: `support/libeasy/handler/mup1.rb`

### Standards

- **RFC 7252**: CoAP - Constrained Application Protocol
- **RFC 7950**: YANG - Data Modeling Language
- **RFC 7951**: JSON Encoding of YANG Data
- **RFC 9254**: CBOR Encoding of YANG Data (CORECONF)
- **RFC 8949**: CBOR - Concise Binary Object Representation
- **WebSerial API**: https://wicg.github.io/serial/

### TSN Standards

- **IEEE 802.1Q**: Virtual LANs and Bridging
- **IEEE 802.1Qav**: Credit-Based Shaper (CBS)
- **IEEE 802.1Qbv**: Time-Aware Shaper (TAS)
- **IEEE 802.1Qci**: Per-Stream Filtering and Policing (PSFP)
- **IEEE 802.1CB**: Frame Replication and Elimination (FRER)
- **IEEE 1588**: Precision Time Protocol (PTP)

---

## 🔗 Live Deployment

**Main Application**: https://hwkim3330.github.io/codingtest/

**Tools:**
- Simple Client: https://hwkim3330.github.io/codingtest/index.html
- Config Editor: https://hwkim3330.github.io/codingtest/config-editor.html

**Interactive Demos**: https://hwkim3330.github.io/codingtest/demos/
- Port Config: https://hwkim3330.github.io/codingtest/demos/port-config-demo.html
- VLAN Config: https://hwkim3330.github.io/codingtest/demos/vlan-config-demo.html
- TSN CBS: https://hwkim3330.github.io/codingtest/demos/tsn-cbs-demo.html

**GitHub Repository**: https://github.com/hwkim3330/codingtest

---

## 📄 License

MIT License

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

**Last Updated**: 2025-01-19
