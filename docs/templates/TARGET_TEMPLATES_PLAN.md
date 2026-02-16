# Target Templates Feature - Implementation Plan

## Overview

Add a **Target Templates** feature with **hardcoded preset templates** that coaches can select when starting training sessions. Templates are not customizable (presets only, defined in code).

### Key Concepts
- **Target Template**: A named collection of target positions
- **Target Position**: Contains a **box** (hit zone) and **dot** (ideal landing point)
- **Cycling**: Shot N uses position `N % templateSize` (e.g., 3 positions: 0→1→2→0→1→2...)
- **Presets Only**: Templates are hardcoded in code
- **Required**: User MUST select a template before starting a session (not optional)
- **Isolated**: CV/AI components are unaware of templates - all logic handled by backend

### Coordinate System (Half-Court)
```      
(0,0) ────────net-─────── (610, 0)
  │                           │
  │      HALF COURT           │
  │      (where ball lands)   │
  │                           │
(0, 670) ───────────────── (610, 670)

Scale: 1 unit = 1 centimeter
Half-court dimensions: 610cm wide × 670cm deep
```

### Visual Feedback
- Show target **box** as rectangle outline on court
- **Landing dot** color-coded: Green if in box, Red if outside (in addition to accuracy color)

---

## Phase 1: Backend - Types & Constants

### New Types (`badminton-backend/src/types/index.ts`)

```typescript
interface TargetPosition {
  positionIndex: number;
  box: { x1: number; y1: number; x2: number; y2: number }; // cm
  dot: { x: number; y: number }; // cm
  label?: string;
}

interface TargetTemplate {
  id: string;
  name: string;
  description?: string;
  positions: TargetPosition[];
}
```

### Preset Templates Constants (`badminton-backend/src/constants/templates.ts`)

```typescript
export const PRESET_TEMPLATES: TargetTemplate[] = [
  {
    id: 'template-001',
    name: 'template-001',
    description: 'first template',
    positions: [
      {
        positionIndex: 0,
        box: { x1: 46, y1: 594, x2: 122, y2: 670 },
        dot: { x: 46, y: 670 }
      },
      {
        positionIndex: 1,
        box: { x1: 488, y1: 198, x2: 564, y2: 274 },
        dot: { x: 526, y: 236 }
      },
      {
        positionIndex: 2,
        box: { x1: 488, y1: 0, x2: 564, y2: 76 },
        dot: { x: 526, y: 38 }
      },
    ]
  },
  // More templates can be added here
];
```

**Visual representation of template-001:**
```
(0,0) ─────────────────────────────────── (610, 0)
  │                              ┌─────┐
  │                              │ [3] │ dot:(526,38)
  │                              └─────┘
  │
  │                              ┌─────┐
  │                              │ [2] │ dot:(526,236)
  │                              └─────┘
  │
  │
  │
  │  ┌─────┐
  │  │ [1] │
  │  └─────┘ dot:(46,670)
(0, 670) ─────────────────────────────── (610, 670)

Shot cycle: 0→[1], 1→[2], 2→[3], 3→[1], 4→[2], 5→[3]...
```

### Files to Create
- `badminton-backend/src/constants/templates.ts` (new)
- `badminton-backend/src/types/index.ts` (modify - add types)

---

## Phase 2: Backend - Database Schema

### Modified Entities

**TrainingSession** (`badminton-backend/src/models/TrainingSession.ts`)
Add field:
```typescript
@Column({ type: 'varchar', length: 50, nullable: true })
template_id?: string;  // References preset template ID
```

**Shot** (`badminton-backend/src/models/Shot.ts`)
Add fields:
```typescript
@Column({ type: 'boolean', nullable: true })
in_box?: boolean;  // Was landing inside target box?

@Column({ type: 'integer', nullable: true })
target_position_index?: number;  // Which position in cycle (0, 1, 2...)
```

### Files to Modify
- `badminton-backend/src/models/TrainingSession.ts`
- `badminton-backend/src/models/Shot.ts`

---

## Phase 3: Backend - API & Services

### New API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates` | List all preset templates |
| GET | `/api/templates/:id` | Get specific preset template |

### Modified Endpoints

**POST `/api/sessions/start`** - Add required `templateId`:
```typescript
{ athleteId: string, templateId: string }  // templateId is REQUIRED
```

### New Service: template.service.ts

```typescript
class TemplateService {
  getAllTemplates(): TargetTemplate[]  // Returns PRESET_TEMPLATES
  getTemplateById(id: string): TargetTemplate | null
  getTargetForShot(templateId: string, shotNumber: number): TargetPosition | null
}
```

### Modified: broker.service.ts - Shot Processing

Update `processShotData()` to:
1. Check if session has a `template_id`
2. Get template from `PRESET_TEMPLATES`
3. Determine target position: `shotNumber % positions.length`
4. Use **dot** coordinates for accuracy calculation (convert cm to meters)
5. Check if landing is **in box**: `isPointInBox(landing, box)`
6. Save `in_box` and `target_position_index` to shot record

### New Utility: court.utils.ts

```typescript
// Check if point is inside box (all in cm)
isPointInBox(
  point: { x: number; y: number },
  box: { x1: number; y1: number; x2: number; y2: number }
): boolean
```

### Files to Create/Modify
- `badminton-backend/src/services/template.service.ts` (new)
- `badminton-backend/src/controllers/template.controller.ts` (new)
- `badminton-backend/src/routes/template.routes.ts` (new)
- `badminton-backend/src/routes/index.ts` (register routes)
- `badminton-backend/src/services/broker.service.ts` (modify)
- `badminton-backend/src/services/session.service.ts` (modify)
- `badminton-backend/src/controllers/session.controller.ts` (modify)
- `badminton-backend/src/utils/court.utils.ts` (add utility)

---

## Phase 4: Frontend - Types & API

### New Types (`badminton-frontend/src/types/index.ts`)

```typescript
interface TargetPosition {
  positionIndex: number;
  box: { x1: number; y1: number; x2: number; y2: number };
  dot: { x: number; y: number };
  label?: string;
}

interface TargetTemplate {
  id: string;
  name: string;
  description?: string;
  positions: TargetPosition[];
}
```

### API Additions (`badminton-frontend/src/utils/api.ts`)

```typescript
getTemplates(): Promise<TargetTemplate[]>
getTemplate(id: string): Promise<TargetTemplate>
// startSession already exists, add templateId parameter
```

### Files to Modify
- `badminton-frontend/src/types/index.ts`
- `badminton-frontend/src/utils/api.ts`

---

## Phase 5: Frontend - Template Selector Component

### New Component: TemplateSelector.tsx

Location: `badminton-frontend/src/components/training/TemplateSelector.tsx`

Features:
- Dropdown/select to choose from preset templates (REQUIRED - no "No Template" option)
- **Preview drawing** showing ALL boxes and dots on mini-court with labels (1, 2, 3)
- Display template name and description
- Must select before START button is enabled

### Files to Create
- `badminton-frontend/src/components/training/TemplateSelector.tsx`

---

## Phase 6: Frontend - Training Integration

### Modify TrainingContext.tsx

Add state:
```typescript
templates: TargetTemplate[]
selectedTemplate: TargetTemplate | null
currentTargetIndex: number  // For display during live session
```

Add methods:
```typescript
loadTemplates(): Promise<void>
selectTemplate(template: TargetTemplate | null): void
```

Update `startTraining()` to pass `templateId` to backend.

### Modify CourtVisualization.tsx

Add props:
```typescript
targetBox?: { x1: number; y1: number; x2: number; y2: number }  // Current target box
targetDot?: { x: number; y: number }  // Current target dot
inBox?: boolean  // Whether last shot was in box
```

Render:
- **Target box** as semi-transparent rectangle
- **Target dot** as circle with crosshair (existing style)
- **Landing position** color:
  - Green border/fill if `inBox === true`
  - Red border/fill if `inBox === false`
  - (Keep existing accuracy colors as secondary indicator)

### Modify TrainingControl.tsx

- Add `<TemplateSelector />` component before start button
- Only show when not actively training

### Modify LiveSessionInfo.tsx

- Show "Position X of Y" when using template
- Show "In Box: ✓ / ✗" indicator for last shot

### Files to Modify
- `badminton-frontend/src/context/TrainingContext.tsx`
- `badminton-frontend/src/components/CourtVisualization.tsx`
- `badminton-frontend/src/components/TrainingControl.tsx`
- `badminton-frontend/src/components/training/LiveSessionInfo.tsx`

---

## Phase 7: Testing & Verification

### Backend Tests
- Unit tests for `template.service.ts` (getAll, getById, getTargetForShot)
- Unit tests for `isPointInBox` utility
- Integration tests for GET `/api/templates`
- Test shot processing with template (cycling, in_box calculation)

### Frontend Tests
- Component test for TemplateSelector
- Test template selection flow in TrainingContext

### Manual Verification
1. Select template-001 (required before START is enabled)
2. Verify preview shows all 3 boxes and dots with labels
3. Start session and run mock CV to send 10+ shots
4. Verify:
   - Shots cycle through positions correctly (0→1→2→0→1→2...)
   - Court shows correct box and dot for current target
   - Landing position shows green/red based on in_box
   - `in_box` field saved correctly to database

---

## Phase 8: RabbitMQ Interface Update

### Remove `targetPosition` from CV Message

The CV component no longer needs to send `targetPosition` - the backend determines it from the template.

**Update Types** (`badminton-backend/src/types/index.ts`)

Before:
```typescript
interface ShotDataFromCV {
  sessionId: string;
  shotNumber: number;
  timestamp: string;
  targetPosition: { x: number; y: number };  // REMOVE THIS
  landingPosition: { x: number; y: number };
  velocity?: number;
  detectionConfidence?: number;
}
```

After:
```typescript
interface ShotDataFromCV {
  sessionId: string;
  shotNumber: number;
  timestamp: string;
  landingPosition: { x: number; y: number };  // In cm (0-610 x 0-670)
  velocity?: number;
  detectionConfidence?: number;
}
```

### Update broker.service.ts

Modify `processShotData()` to:
1. **NOT** use `targetPosition` from CV message
2. Look up session's `template_id`
3. Get target from `PRESET_TEMPLATES` based on `shotNumber % positions.length`
4. Use template's **dot** for accuracy calculation
5. Use template's **box** for `in_box` check

### Update Mock CV Script

Update `mock_cv_component.py` to stop sending `targetPosition`:
```python
# Before
shot_data = {
    'sessionId': session_id,
    'shotNumber': shot_number,
    'targetPosition': {'x': ..., 'y': ...},  # REMOVE
    'landingPosition': {'x': ..., 'y': ...},
    ...
}

# After
shot_data = {
    'sessionId': session_id,
    'shotNumber': shot_number,
    'landingPosition': {'x': random_x, 'y': random_y},  # In cm
    ...
}
```

### Files to Modify
- `badminton-backend/src/types/index.ts` (remove targetPosition from interface)
- `badminton-backend/src/services/broker.service.ts` (use template instead of CV target)
- `badminton-backend/scripts/mock_cv_component.py` (or wherever mock CV is)

---

## Phase 9: Half-Court Visualization

### Overview

Modify the live session court visualization to display only the **half-court** using the **cm coordinate system** (610 × 670) that matches the template definitions.

### Current State
- CourtVisualization.tsx renders a full court (13.4m × 6.1m = 1340cm × 610cm)
- Coordinates are in meters
- Shows both sides of the net

### Target State
- Render only half-court (610cm × 670cm)
- Use cm coordinates directly (no conversion needed)
- Origin (0,0) at top-left (net side)
- Matches template coordinate system exactly

### Coordinate System Alignment
```
CourtVisualization (Half-Court Mode)     Template Coordinates
         ↓                                      ↓
(0,0) ───net────── (610, 0)         (0,0) ───net────── (610, 0)
  │                    │              │                    │
  │                    │              │                    │
  │                    │      ===     │                    │
  │                    │              │                    │
  │                    │              │                    │
(0, 670) ────────── (610, 670)      (0, 670) ────────── (610, 670)
```

### Modify CourtVisualization.tsx

**Add prop for half-court mode:**
```typescript
interface CourtVisualizationProps {
  shots: Shot[];
  targetBox?: { x1: number; y1: number; x2: number; y2: number };
  targetDot?: { x: number; y: number };
  halfCourt?: boolean;  // NEW - when true, render half-court in cm
}
```

**SVG viewBox change:**
```typescript
// Full court (existing)
viewBox="0 0 1340 610"  // 13.4m × 6.1m in cm

// Half court (new)
viewBox="0 0 610 670"   // 610cm × 670cm
```

**Render half-court elements:**
```typescript
// Half-court lines to render:
// - Outer boundary rectangle
// - Net line at y=0
// - Service lines
// - Center line
// - Service box divisions
```

**Half-court line positions (in cm):**
```
Net line: y = 0
Short service line: y = 198
Long service line (doubles): y = 76 from back = 594
Center line: x = 305 (half of 610)
Side tramlines: x = 46 (singles sideline)
```

### Shot Position Mapping

When `halfCourt={true}`:
- Shot `landingPosition` is already in cm (0-610, 0-670)
- No coordinate transformation needed
- Direct mapping: `x={shot.landingPosition.x} y={shot.landingPosition.y}`

When `halfCourt={false}` (existing behavior):
- Keep existing meter-to-pixel conversion
- Full court rendering unchanged

### Integration with TrainingControl

```typescript
// During active session with template, use half-court mode
<CourtVisualization
  shots={shots}
  targetBox={currentTargetBox}
  targetDot={currentTargetDot}
  halfCourt={!!selectedTemplate}  // Half-court when using template
/>
```

### Visual Elements in Half-Court Mode

| Element | Rendering |
|---------|-----------|
| Court boundary | Rectangle (0,0) to (610,670) |
| Net | Line at y=0 from x=0 to x=610 |
| Target box | Semi-transparent rectangle |
| Target dot | Circle with crosshair |
| Landing positions | Colored circles (green/red based on in_box) |
| Shot trails | Optional lines connecting shots |

### Files to Modify
- `badminton-frontend/src/components/CourtVisualization.tsx`
- `badminton-frontend/src/components/TrainingControl.tsx` (pass halfCourt prop)

---

## Phase 10: E2E Mock CV - 100% Accurate Shots

### Overview

Update the E2E test mock CV component to generate shots that land **exactly on the target dots** for template-001, achieving 100% accuracy and 100% in-box rate.

### Current Mock CV Behavior
- Generates random landing positions
- No awareness of templates
- Shots land anywhere on the court

### Target Behavior
- Landing positions match template-001 target dots exactly
- Shot N lands on position `N % 3` (cycling through 3 positions)
- All 50 shots are 100% accurate (0cm deviation)
- All 50 shots are in-box

### template-001 Target Dots (for reference)
```
Position 0: dot = (46, 670)   - Bottom-left corner
Position 1: dot = (526, 236)  - Mid-right area
Position 2: dot = (526, 38)   - Top-right near net
```

### Mock CV Shot Generation Logic

```python
# template-001 target dots (in cm)
TEMPLATE_001_DOTS = [
    {'x': 46, 'y': 670},   # Position 0
    {'x': 526, 'y': 236},  # Position 1
    {'x': 526, 'y': 38},   # Position 2
]

def get_landing_position(shot_number: int) -> dict:
    """Get landing position for shot that matches template-001 target."""
    position_index = shot_number % 3
    target_dot = TEMPLATE_001_DOTS[position_index]

    # Land exactly on target for 100% accuracy
    return {
        'x': target_dot['x'],
        'y': target_dot['y']
    }
```

### Shot Sequence (50 shots)
```
Shot 0  → Position 0 → Land at (46, 670)
Shot 1  → Position 1 → Land at (526, 236)
Shot 2  → Position 2 → Land at (526, 38)
Shot 3  → Position 0 → Land at (46, 670)
Shot 4  → Position 1 → Land at (526, 236)
...
Shot 47 → Position 2 → Land at (526, 38)
Shot 48 → Position 0 → Land at (46, 670)
Shot 49 → Position 1 → Land at (526, 236)
```

### E2E Test Verification Updates

Update `e2e/tests/training-session.e2e.spec.ts` to verify:
```typescript
// Verify 100% accuracy
expect(sessionStats.averageAccuracy).toBe(0);  // 0cm deviation = perfect

// Verify all shots in-box
expect(sessionStats.inBoxCount).toBe(50);
expect(sessionStats.inBoxPercentage).toBe(100);

// Verify court shows all green markers (in-box)
const greenMarkers = await page.locator('.shot-marker.in-box').count();
expect(greenMarkers).toBe(50);
```

### Mock CV Script Update

**File:** `e2e/helpers/mock-cv.ts` or `badminton-backend/scripts/mock_cv_component.py`

```python
import pika
import json
import time

TEMPLATE_001_DOTS = [
    {'x': 46, 'y': 670},
    {'x': 526, 'y': 236},
    {'x': 526, 'y': 38},
]

def send_shots(session_id: str, num_shots: int = 50, interval_ms: int = 50):
    """Send shots with 100% accuracy for template-001."""
    connection = pika.BlockingConnection(...)
    channel = connection.channel()

    for shot_number in range(num_shots):
        position_index = shot_number % 3
        landing = TEMPLATE_001_DOTS[position_index]

        shot_data = {
            'sessionId': session_id,
            'shotNumber': shot_number,
            'timestamp': datetime.now().isoformat(),
            'landingPosition': landing,  # Exactly on target dot
            'velocity': 15.0,
            'detectionConfidence': 0.99
        }

        channel.basic_publish(
            exchange='badminton_exchange',
            routing_key=f'shot.data.{session_id}',
            body=json.dumps(shot_data)
        )

        time.sleep(interval_ms / 1000)

    connection.close()
```

### Expected E2E Test Results

After implementation:
- **50 shots received** via WebSocket
- **Average accuracy: 0cm** (perfect shots)
- **In-box rate: 100%** (50/50 shots)
- **Court visualization:** All markers green
- **Session stats:** Perfect score

### Files to Modify
- `e2e/helpers/mock-cv.ts` (if TypeScript mock exists)
- `badminton-backend/scripts/mock_cv_component.py` (Python mock)
- `e2e/tests/training-session.e2e.spec.ts` (add accuracy assertions)

---

## Summary of Changes

| Area | New Files | Modified Files |
|------|-----------|----------------|
| Backend Constants | 1 | 0 |
| Backend Services | 1 | 2 |
| Backend Controllers | 1 | 1 |
| Backend Routes | 1 | 1 |
| Backend Models | 0 | 2 |
| Backend Utils | 0 | 1 |
| Backend Types | 0 | 1 |
| Backend Scripts | 0 | 1 (mock CV) |
| Frontend Components | 1 | 4 (includes CourtVisualization half-court) |
| Frontend Types | 0 | 1 |
| Frontend Utils | 0 | 1 |
| Frontend Context | 0 | 1 |
| E2E Tests | 0 | 2 (mock CV + test assertions) |
| **Total** | **5 new** | **18 modified** |

---

## Template Definitions

### template-001
- **Name**: template-001
- **Description**: first template
- **Positions**: 3

| Position | Box (x1,y1)→(x2,y2) | Dot (x,y) |
|----------|---------------------|-----------|
| 0 | (46, 594) → (122, 670) | (46, 670) |
| 1 | (488, 198) → (564, 274) | (526, 236) |
| 2 | (488, 0) → (564, 76) | (526, 38) |

*More templates will be added later.*
