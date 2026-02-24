# Plan: Change Y-Axis Coordinate System from (0 to 670) to (0 to -670)

## Context

The half-court coordinate system currently uses positive y-values (0 at net, 670 at baseline). This needs to change so that moving away from the net produces increasingly negative values (0 at net, -670 at baseline). The x-axis (0-610) is unchanged. No database migration is needed.

---

## Changes by File

### 1. Backend Template Definitions (source of truth)

**`badminton-backend/src/constants/templates.ts`**

Negate all y-values in template-001 positions:

| Position | Field | Before | After |
|----------|-------|--------|-------|
| 0 | box y1, y2 | 594, 670 | -594, -670 |
| 0 | dot y | 670 | -670 |
| 1 | box y1, y2 | 198, 274 | -198, -274 |
| 1 | dot y | 236 | -236 |
| 2 | box y1, y2 | 0, 76 | 0, -76 |
| 2 | dot y | 38 | -38 |

Update comment: origin `(610, 670)` -> `(610, -670)`

---

### 2. Backend Court Utilities

**`badminton-backend/src/utils/court.utils.ts`**

- `calculateAccuracy()` - **No change** (Euclidean distance is sign-independent)
- `isPointInBox()` - **No change** (uses `Math.min`/`Math.max`, handles negatives correctly)
- `determineCourtZone()` (line 20) - Fix: `y < 0` rejects negative y. Change to use `Math.abs(y)`:
  ```
  const absY = Math.abs(y);
  if (x < 0 || x > COURT_LENGTH || absY > COURT_WIDTH) { return 'unknown'; }
  const isLeft = absY < COURT_WIDTH / 2;
  ```
- Update comment on line 43: `670 deep` -> `670 deep (y: 0 to -670)`

---

### 3. Frontend Court Visualization (critical SVG change)

**`badminton-frontend/src/components/CourtVisualization.tsx`**

**`toSvgY` function (line 71):** The core transformation change.

- Before: `padding + Number(courtY) * scaleY` (courtY=670 maps to bottom)
- After: `padding - Number(courtY) * scaleY` (courtY=-670: `padding - (-670)*scale = padding + 670*scale`, maps to bottom correctly)

**`HalfCourtLines` component (lines 499-602):** Update hardcoded y-values to negative:
- `toSvgY(198)` -> `toSvgY(-198)` (short service line)
- `toSvgY(594)` -> `toSvgY(-594)` (long service line)
- `toSvgY(198)` -> `toSvgY(-198)` (center line endpoint)
- `toSvgY(0)` stays as-is (net line)
- Update comment: line positions from positive to negative

All other rendering logic (shots, target boxes, template positions, live shots) passes coordinates through `toSvgY()` and uses `Math.abs()` for width/height already, so **no other changes needed** in this file.

---

### 4. Mock CV Component

**`badminton-backend/scripts/mock_cv_component.py`**

- Negate `TEMPLATE_001_DOTS` y-values: `670 -> -670`, `236 -> -236`, `38 -> -38`
- Negate `zone_positions` y-ranges (e.g., `(0, 200)` -> `(-200, 0)`, `(470, 670)` -> `(-670, -470)`)
- Update fallback random generation to use negative y range

---

### 5. Backend Tests

**`badminton-backend/src/__tests__/unit/utils/court.utils.test.ts`**
- Negate y-values in template position box test data (positions 0, 1, 2)
- Update `determineCourtZone` tests for negative y-coordinates
- Add test case for negative y with `determineCourtZone`

**`badminton-backend/src/__tests__/unit/services/template.service.test.ts`**
- Update all `toEqual` assertions with negated y-values
- Change `MAX_Y = 670` validation to `MIN_Y = -670`, check `y >= -670 && y <= 0`

**`badminton-backend/src/__tests__/unit/services/shot.service.test.ts`**
- Negate y-values in template-related shot test data (meters: `6.32 -> -6.32`, `6.70 -> -6.70`, `2.36 -> -2.36`)

**`badminton-backend/src/__tests__/integration/template.integration.test.ts`**
- Update all position assertions with negated y-values
- Update bounds validation to check `y >= -670 && y <= 0`

---

### 6. Frontend Tests

**`badminton-frontend/src/__tests__/components/TemplateSelector.test.tsx`**
- Negate y-values in mock template data

**`badminton-frontend/src/__tests__/context/TrainingContext.templates.test.tsx.skip`**
- Negate y-values in mock template data (file is skipped but update for consistency)

---

### 7. Documentation

**`plans/cv-integration-plan.md`** - Update coordinate system diagram and y-axis range descriptions

**`docs/templates/TARGET_TEMPLATES_PLAN.md`** - Update coordinate system diagram

---

### Files that need NO changes

These files pass coordinates through without y-value manipulation:
- `badminton-backend/src/services/broker.service.ts` (divides by 100, works with negatives)
- `badminton-backend/src/services/shot.service.ts` (stores values as-is)
- `badminton-backend/src/services/template.service.ts` (returns template data as-is)
- `badminton-backend/src/models/Shot.ts` (decimal columns accept negatives)
- `badminton-frontend/src/context/TrainingContext.tsx` (passes data through)
- `badminton-frontend/src/components/TrainingControl.tsx` (passes data through)
- `badminton-frontend/src/components/training/TemplateSelector.tsx` (passes data through)
- `badminton-frontend/src/components/training/LiveSessionInfo.tsx` (displays index only)
- `badminton-frontend/src/types/index.ts` (number types accept negatives)
- `badminton-backend/src/types/index.ts` (number types, update comments only)

---

## Implementation Order

1. `badminton-backend/src/constants/templates.ts` (source of truth)
2. `badminton-backend/src/utils/court.utils.ts` (`determineCourtZone` fix)
3. `badminton-frontend/src/components/CourtVisualization.tsx` (`toSvgY` + `HalfCourtLines`)
4. `badminton-backend/scripts/mock_cv_component.py`
5. All backend test files (4 files)
6. All frontend test files (2 files)
7. Documentation files (2 files)

---

## Verification

1. **Backend tests:** `cd badminton-backend && npm test` - all 151 tests pass
2. **Frontend tests:** `cd badminton-frontend && npm test -- --watchAll=false` - all tests pass
3. **Visual check:** Start backend + frontend, select template-001, verify court preview shows positions in correct locations (near baseline, mid-court, near net)
4. **Live test:** Run mock CV with `python scripts/mock_cv_component.py <sessionId> --count 5 --template template-001`, verify shots render correctly on court
