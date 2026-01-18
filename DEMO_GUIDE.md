# 🎬 Complete Demo & Testing Guide

Step-by-step guide to demonstrate the badminton training system with live shot tracking.

---

## 🚀 Pre-Flight Checklist

Before starting, ensure everything is running:

```bash
# 1. Check OrbStack/Docker is running
docker ps

# 2. Start Backend Services
cd badminton-backend
docker-compose up -d

# 3. Verify all services are healthy
docker-compose ps
# All should show "healthy" or "running"

# 4. Test backend API
curl http://localhost:5000/health
# Should return: {"status":"ok","message":"Badminton Training API is running"}

# 5. Test RabbitMQ connection
cd scripts
python3 test_connection.py
# Should show: ✅ RabbitMQ is ready to use!

# 6. Start Frontend (in new terminal)
cd badminton-frontend
npm start
# Opens at http://localhost:3000
```

---

## 📋 **Method 1: Complete End-to-End Demo (Recommended)**

### Step 1: Prepare Frontend

1. Open **http://localhost:3000** in your browser
2. **Open Browser DevTools** (F12 or Cmd+Option+I)
3. Go to **Console** tab (this is important!)
4. Keep DevTools open

### Step 2: Login/Setup

1. Register a new account (or login if you already have one)
2. Navigate to **"Athletes"** tab
3. Click **"Create New Athlete"**
4. Fill in:
   - Name: Test Athlete
   - Skill Level: Intermediate (or any)
   - Click **"Create"**

### Step 3: Start Training Session

1. Navigate to **"Training Control"** tab
2. Select your athlete from dropdown
3. Click **"Start Training"** button
4. **IMPORTANT:** Look at the **browser console** (DevTools)
5. You should see a log like:

```javascript
Session started: {
  id: "abc123-xyz-456-789-session-id",
  athlete_id: "...",
  ...
}
```

6. **COPY THE SESSION ID** (the long UUID string after `id:`)

### Step 4: Send Mock Shots

Open a **new terminal** (keep frontend running):

```bash
cd badminton-backend/scripts

# Send 10 shots with the ACTUAL session ID
python3 mock_cv_component.py abc123-xyz-456-789-session-id
```

Replace `abc123-xyz-456-789-session-id` with your actual session ID from step 3!

### Step 5: Watch the Magic! ✨

You should see:

**In Terminal:**
```
🏸 Mock CV Component - Badminton Shot Data Generator
============================================================

Shot #1:
  Target:   (2.35, 4.12)
  Landing:  (2.42, 4.23)
  Accuracy: 13.6 cm
  Velocity: 245.3 km/h
  ✅ Sent to RabbitMQ
  ⏳ Waiting 3 seconds...
```

**In Browser:**
- 🎯 Shot appears on the court visualization
- 📊 Statistics update (Total Shots, Accuracy %, etc.)
- 🔴 Red dot shows landing position
- 🔵 Blue crosshair shows target position
- 📈 Numbers increment with each shot

**In Browser Console:**
```javascript
Shot received: {shot_number: 1, accuracy_cm: 13.6, ...}
Session stats updated: {total_shots: 1, ...}
```

### Step 6: Review Completed Session

After all 10 shots:

1. Click **"Stop Training"** in the UI
2. Add notes (optional) and rating
3. Click **"Save Session"**
4. Navigate to **"Performance"** tab
5. Click on the completed session
6. See **all 10 shots displayed on the court**!

---

## 🔍 **Method 2: Quick Debug/Test Mode**

If you just want to test the system without a real session:

### Option A: Test with Random Session ID

```bash
cd badminton-backend/scripts
python3 mock_cv_component.py
# Press Enter when prompted (uses test session ID)
```

This will send shots but they won't appear in the UI since there's no active session listening.

### Option B: Check Backend Only

```bash
# Terminal 1: Watch backend logs
cd badminton-backend
docker-compose logs -f api

# Terminal 2: Send test shots
cd scripts
python3 mock_cv_component.py test-session-123
```

Check if backend logs show:
```
[BROKER] Received shot data: {...}
```

---

## 🐛 Troubleshooting Guide

### Issue 1: No Shots Appearing in UI

**Symptoms:** Script runs successfully, but UI doesn't update

**Solution Checklist:**

1. **Check Session ID Match**
   ```bash
   # In browser console, you should see:
   "Session started: {id: 'YOUR-SESSION-ID'}"
   
   # Make sure you use THIS EXACT ID in the Python script
   python3 mock_cv_component.py YOUR-SESSION-ID
   ```

2. **Check WebSocket Connection**
   - Open DevTools → **Network** tab
   - Filter by **WS** (WebSocket)
   - You should see a connection to `localhost:5000`
   - Status should be `101 Switching Protocols` (green)
   - If red or no connection, backend may not be running

3. **Check Browser Console for Errors**
   - Look for red error messages
   - Common: "WebSocket connection failed"
   - Solution: Restart backend with `docker-compose restart api`

4. **Verify Backend is Receiving Data**
   ```bash
   cd badminton-backend
   docker-compose logs -f api | grep -i "shot"
   ```
   
   You should see:
   ```
   [BROKER] Received shot data: {sessionId: '...', shotNumber: 1}
   ```

5. **Check Socket Room Join**
   - In browser console after clicking "Start Training", look for:
   ```javascript
   Socket event: join_session
   ```
   - If missing, frontend may not have joined the room

### Issue 2: Backend Not Running

**Symptoms:** `curl http://localhost:5000/health` fails

**Solutions:**

```bash
# Check if containers are running
docker-compose ps

# If stopped, start them
docker-compose up -d

# If unhealthy, check logs
docker-compose logs api

# Nuclear option: rebuild everything
docker-compose down
docker-compose up -d --build
```

### Issue 3: RabbitMQ Connection Errors

**Symptoms:** `ACCESS_REFUSED` or connection timeout

**Solutions:**

```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Should show: "healthy"

# Test connection
python3 test_connection.py

# Check credentials (should be badminton/badminton123)
# Open http://localhost:15672
# Login with: badminton / badminton123
```

### Issue 4: Frontend Not Loading

**Symptoms:** Port 3000 shows old content or errors

**Solutions:**

```bash
# Kill old processes
lsof -ti:3000 | xargs kill -9

# Clear cache and restart
cd badminton-frontend
rm -rf node_modules/.cache
npm start

# Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

---

## 📊 Verification Steps

After each shot, verify:

✅ **Terminal shows:** `✅ Sent to RabbitMQ`  
✅ **Backend logs show:** `[BROKER] Received shot data`  
✅ **Browser console shows:** `Shot received: {...}`  
✅ **UI updates:** New dot on court, stats increment  

---

## 🎥 Recording a Demo

For presentations or recordings:

### Setup (Before Recording)

1. Open browser in full screen
2. Zoom to 100% (Cmd+0)
3. Open frontend at http://localhost:3000
4. Have terminal ready with script command
5. Clear browser console (right-click → Clear console)

### Demo Script (2 minutes)

**[0:00-0:20] Introduction**
- "This is a real-time badminton training tracking system"
- Show the navigation: Training Control, Performance, Athletes

**[0:20-0:40] Create Athlete**
- Go to Athletes → Create New Athlete
- "Each athlete has a profile with skill level and training history"

**[0:40-1:00] Start Session**
- Go to Training Control
- Select athlete
- "When we start training, the system connects to a computer vision component"
- Click Start Training
- Show the court visualization

**[1:00-1:40] Live Shot Tracking**
- Switch to terminal
- Run: `python3 mock_cv_component.py SESSION_ID`
- "The CV system detects shuttlecock positions and sends them in real-time"
- Watch shots appear on court every 3 seconds
- Point out:
  - Blue crosshair = target
  - Red dot = actual landing
  - Accuracy calculation
  - Live statistics

**[1:40-2:00] Review Session**
- Stop training
- Navigate to Performance
- "Coaches can review all sessions and analyze performance"
- Click on session to see detailed view with all shots

---

## 🔧 Advanced Testing

### Test Multiple Sessions

```bash
# Terminal 1: Session 1
python3 mock_cv_component.py session-1-id

# Terminal 2: Session 2 (in 30 seconds)
sleep 30 && python3 mock_cv_component.py session-2-id
```

### Custom Shot Patterns

Edit `mock_cv_component.py`:

```python
# Line 32-40: Change court zones
zone_positions = {
    'front_left': (1.5, 2.5, 3.0, 5.0),
    # Modify these coordinates
}

# Line 165: Change number of shots
for shot_num in range(1, 21):  # 20 shots instead of 10

# Line 200: Change interval
time.sleep(1)  # 1 second instead of 3
```

### Stress Test

```bash
# Send 100 shots with 0.5s interval
# Edit script: range(1, 101) and time.sleep(0.5)
python3 mock_cv_component.py SESSION_ID
```

---

## 📱 Quick Reference

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- RabbitMQ UI: http://localhost:15672

### Credentials
- RabbitMQ: `badminton` / `badminton123`
- Database: `badminton_user` / `badminton_pass`

### Commands

```bash
# Start everything
docker-compose up -d && cd ../badminton-frontend && npm start

# Send shots
python3 scripts/mock_cv_component.py SESSION_ID

# Check logs
docker-compose logs -f api

# Stop everything
docker-compose down
```

---

## 🎉 Success Criteria

You know it's working when:

✅ All Docker containers show "healthy"  
✅ Backend health check returns OK  
✅ Frontend loads without errors  
✅ RabbitMQ connection test passes  
✅ Session starts and generates ID  
✅ Shots appear on court in real-time  
✅ Statistics update automatically  
✅ Completed sessions show in performance history  
✅ Session detail page displays all shots  

---

**Happy Testing! 🏸✨**

For issues, check the troubleshooting section or backend logs: `docker-compose logs api`

