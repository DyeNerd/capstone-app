# CV Component Integration Plan

## Context

The badminton training system backend is fully deployed (Railway + CloudAMQP). The next step is integrating with the friend's CV (Computer Vision) component, which runs on the same machine as the camera and connects to CloudAMQP remotely. The CV detection logic is partially working. This plan defines the integration contract and any backend adjustments needed.

## How the Integration Works

The CV component communicates with the backend **exclusively through RabbitMQ** (no HTTP calls needed). The message broker acts as the bridge:

```
Camera → CV Component → RabbitMQ (CloudAMQP) → Backend → WebSocket → Frontend
```

**How `session.start` and `session.stop` reach the CV component:**
The backend already publishes these messages to RabbitMQ automatically -- no extra work needed. When a coach starts or stops a session from the web app, the backend's `session.controller.ts` calls `brokerService.publishSessionStart()` / `brokerService.publishSessionStop()`, which publish to the `badminton_training` exchange with the corresponding routing keys. The CV component receives them by binding its own queue to those routing keys on the same exchange. All communication is through RabbitMQ; there are no direct HTTP calls between the backend and the CV component.

```
Coach clicks "Start" → Frontend → Backend API (POST /api/sessions/start)
                                      ↓
                              brokerService.publishSessionStart()
                                      ↓
                              RabbitMQ exchange (badminton_training)
                                      ↓ routing key: session.start
                              CV component's queue → CV starts detection

Coach clicks "Stop"  → Frontend → Backend API (POST /api/sessions/:id/stop)
                                      ↓
                              brokerService.publishSessionStop()
                                      ↓
                              RabbitMQ exchange (badminton_training)
                                      ↓ routing key: session.stop
                              CV component's queue → CV stops detection
```

---

## 1. RabbitMQ Connection Details (for friend)

The CV component needs to connect to the **same CloudAMQP instance** the backend uses.

| Setting | Value |
|---------|-------|
| **Exchange** | `badminton_training` (topic type, durable) |
| **Protocol** | AMQP 0-9-1 |
| **Connection URL** | The CloudAMQP URL (share securely with friend) |

The friend's component must:
1. Connect to CloudAMQP using the provided URL
2. Declare/assert the exchange `badminton_training` (topic, durable) -- idempotent, safe to call even though backend already declares it
3. Create its OWN queue (e.g., `cv_session_control_queue`), bind it to the exchange with routing keys `session.start` and `session.stop`
4. Publish shot data to the exchange with routing key `shot.data.detected` (or any `shot.data.*` pattern)

---

## 2. Messages the CV Component Must CONSUME

### 2a. `session.start` -- Start Tracking

When a coach starts a training session, the backend publishes this message.

**Routing Key:** `session.start`

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "athleteId": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-02-23T10:30:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string (UUID) | **Critical** -- must be included in every shot message |
| `athleteId` | string (UUID) | Informational, can be ignored by CV |
| `targetZone` | string (optional) | Currently unused, reserved for future use. Will be absent from the message. |
| `timestamp` | string (ISO 8601) | When the session started |

**CV action:** Start the camera feed / shot detection loop. Store the `sessionId` for tagging shots.

### 2b. `session.stop` -- Stop Tracking

When a coach stops the session:

**Routing Key:** `session.stop`

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-02-23T10:50:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string (UUID) | Which session to stop |
| `timestamp` | string (ISO 8601) | When the session ended |

**CV action:** Stop the camera feed / detection loop for this session.

---

## 3. Messages the CV Component Must PRODUCE

### `shot.data.*` -- Shot Detection Event

Each time the CV detects a shuttlecock landing, publish this message.

**Routing Key:** `shot.data.detected` (any `shot.data.*` pattern works)

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "shotNumber": 1,
  "timestamp": "2025-02-23T10:30:05.123Z",
  "landingPosition": {
    "x": 305,
    "y": -335
  },
  "velocity": 85.5,
  "detectionConfidence": 0.95
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string (UUID) | **Yes** | Must match the sessionId from `session.start` |
| `shotNumber` | number (integer) | **Yes** | Sequential counter, starting from 1 |
| `timestamp` | string (ISO 8601) | **Yes** | When the shot was detected |
| `landingPosition.x` | number | **Yes** | Landing X coordinate in **centimeters** |
| `landingPosition.y` | number | **Yes** | Landing Y coordinate in **centimeters** |
| `velocity` | number | No | Shot speed in km/h (if measurable) |
| `detectionConfidence` | number (0-1) | No | How confident the CV model is in the detection |

**Important:** Messages must be published with `persistent: true` (delivery_mode=2) to survive broker restarts.

---

## 4. Coordinate System (Critical for Friend)

The CV component must output landing positions in **half-court centimeters**.

```
          NET (y = 0)
    ┌──────────────────────┐
    │                      │
    │    (0,0)             │  Width: 610 cm
    │    ┌────────────┐    │  (left to right)
    │    │            │    │
    │    │ HALF COURT │    │  Depth: 670 cm
    │    │            │    │  (net to baseline)
    │    │            │    │
    │    └────────────┘    │
    │             (610,-670)│
    │                      │
    └──────────────────────┘
        BASELINE (y = -670)
```

| Axis | Range | Direction |
|------|-------|-----------|
| **X** | 0 - 610 cm | Left edge (0) to right edge (610) |
| **Y** | 0 - 670 cm | Net (0) to baseline (670) |

**The CV component needs to:**
1. Calibrate the camera so it knows the court boundaries
2. Map detected pixel positions to half-court centimeter coordinates
3. Output `landingPosition: { x, y }` where x is 0-610 and y is 0-670

The backend handles everything else (accuracy calculation, target matching, zone detection, database storage).

---

## 5. Complete Flow (What the CV Component Does)

```
1. CV component starts up → connects to CloudAMQP
2. CV declares its queue, binds to "session.start" and "session.stop"
3. CV waits for messages...

--- Coach starts a session from the web app ---

4. CV receives "session.start" message
   → Stores sessionId
   → Starts camera capture / detection loop
   → Initializes shotNumber counter = 0

5. For each detected shot:
   → shotNumber += 1
   → Determine landing position in half-court cm
   → Publish "shot.data.detected" message with sessionId, shotNumber, position
   → (Optional: include velocity, detectionConfidence)

--- Coach stops the session from the web app ---

6. CV receives "session.stop" message
   → Stops detection loop for that sessionId
   → Cleans up resources
7. CV goes back to waiting for next session.start
```

---

## 6. Backend Changes Needed

### 6a. No structural changes required
The backend already fully handles:
- Consuming `shot.data.*` messages
- Calculating accuracy against template targets
- Saving shots to database
- Broadcasting via WebSocket

### 6b. Optional: Add `templateId` to session.start event
Currently the session.start message does NOT include the template ID. If the CV component ever needs to know which template is active (e.g., to display target positions on a monitor), we can add it.

**File:** `badminton-backend/src/controllers/session.controller.ts:38-43`
**File:** `badminton-backend/src/types/index.ts:20-25`

Change `SessionStartEvent` to optionally include `templateId`:
```typescript
export interface SessionStartEvent {
  sessionId: string;
  athleteId: string;
  targetZone?: string;
  templateId?: string;  // NEW: so CV knows the active template
  timestamp: string;
}
```

And update the publish call in `session.controller.ts`:
```typescript
await brokerService.publishSessionStart({
  sessionId: session.id,
  athleteId,
  targetZone,
  templateId,  // NEW
  timestamp: new Date().toISOString(),
});
```

### 6c. Optional: Add input validation for shot data
Add basic validation in `broker.service.ts:processShotData()` to guard against malformed CV messages (missing fields, out-of-range coordinates).

---

## 7. Testing the Integration

### Step 1: Test with Mock CV (verify backend still works)
```bash
cd badminton-backend
# Start the backend
docker-compose up -d
# Use the existing mock CV script
python scripts/mock_cv_component.py <session_id> --count 10 --interval-ms 1000
```

### Step 2: Test friend's CV component locally
1. Share the local RabbitMQ connection URL: `amqp://badminton:badminton123@localhost:5672`
2. Friend connects their CV component to local RabbitMQ
3. Start a session via the frontend or curl
4. Friend's CV publishes shot messages
5. Verify shots appear in the frontend court visualization

### Step 3: Test in production
1. Share the CloudAMQP URL with friend (securely)
2. Friend's CV component connects from their machine to CloudAMQP
3. Run a real training session through the deployed frontend
4. Verify end-to-end flow works

---

## 8. Info Summary to Share with Friend

Share with your friend:

1. **CloudAMQP URL** (the `RABBITMQ_URL` from Railway env vars)
2. **Exchange name:** `badminton_training` (topic type)
3. **Messages to consume:** `session.start`, `session.stop` (create own queue, bind to these routing keys)
4. **Messages to produce:** `shot.data.detected` (publish to the exchange)
5. **Coordinate system:** Half-court, centimeters, x=0-610, y=0-670, origin at net left corner
6. **Shot message format:** `{ sessionId, shotNumber, timestamp, landingPosition: {x, y}, velocity?, detectionConfidence? }`
7. **Reference implementation:** `badminton-backend/scripts/mock_cv_component.py` -- a working Python example they can use as a starting point

---

## 9. Verification Checklist

- [ ] Friend can connect to CloudAMQP from their machine
- [ ] Friend's component receives `session.start` when coach starts session
- [ ] Friend's component publishes shot data with correct format
- [ ] Shots appear in real-time on the frontend court visualization
- [ ] Friend's component stops on `session.stop`
- [ ] Shot accuracy calculations are reasonable (not all 0% or 100%)
- [ ] Coordinates map correctly to the court (shots land in expected areas)
