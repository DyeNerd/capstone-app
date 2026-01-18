# 🎯 Mock CV Component - Complete Setup Guide

A Python script to simulate the Computer Vision component sending badminton shot data to RabbitMQ.

## 📁 Files Created

```
badminton-backend/scripts/
├── mock_cv_component.py    # Main script - sends 10 shots with 3s intervals
├── test_connection.py      # Quick RabbitMQ connection test
├── requirements.txt        # Python dependencies (pika)
├── README.md              # Detailed documentation
└── QUICKSTART.md          # Quick start guide
```

## 🚀 Quick Start (3 Steps)

### 1. Install Python Dependencies

```bash
cd badminton-backend/scripts
pip install pika
```

### 2. Start Backend Services

```bash
cd badminton-backend
docker-compose up -d
```

### 3. Run Mock CV

```bash
# Test RabbitMQ connection first
python test_connection.py

# Send mock shots
python mock_cv_component.py
# Press Enter when prompted for session ID (test mode)
```

## 🎮 Real Testing Flow

### Complete End-to-End Test

1. **Start Backend:**
   ```bash
   cd badminton-backend
   docker-compose up -d
   sleep 5
   curl http://localhost:5000/health
   ```

2. **Start Frontend:**
   ```bash
   cd badminton-frontend
   npm start
   # Opens at http://localhost:3000
   ```

3. **In Browser:**
   - Register/Login as a coach
   - Create an athlete
   - Go to "Training Control"
   - Select the athlete
   - Click "Start Training"
   - **Copy the Session ID** from the browser console or URL

4. **Send Mock Shots:**
   ```bash
   cd badminton-backend/scripts
   python mock_cv_component.py YOUR_SESSION_ID
   ```

5. **Watch the Magic! ✨**
   - Shots appear on the court visualization every 3 seconds
   - Statistics update in real-time
   - Each shot shows accuracy, velocity, and position

## 📊 What the Mock CV Sends

### Data Format (JSON)

```json
{
  "sessionId": "abc123-session-id",
  "shotNumber": 1,
  "timestamp": "2025-10-29T15:30:45.123Z",
  "targetPosition": {
    "x": 2.35,
    "y": 4.12
  },
  "landingPosition": {
    "x": 2.42,
    "y": 4.23
  },
  "velocity": 245.3,
  "detectionConfidence": 0.95
}
```

### Shot Characteristics

- **10 shots total** - Configurable
- **3 second intervals** - Configurable
- **Realistic court positions** (13.4m × 6.1m court)
- **Varied accuracy levels:**
  - High: ±10cm from target
  - Medium: ±30cm from target
  - Low: ±60cm from target
- **Realistic velocities:** 180-280 km/h
- **Detection confidence:** 88-98%

## 🔧 Configuration

### Change Number of Shots

Edit `mock_cv_component.py`, line ~165:
```python
for shot_num in range(1, 11):  # Change 11 to 21 for 20 shots
```

### Change Time Interval

Edit `mock_cv_component.py`, line ~200:
```python
time.sleep(3)  # Change 3 to 1 for 1-second intervals
```

### Change RabbitMQ Connection

Edit top of `mock_cv_component.py`:
```python
RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'badminton'      # Default credentials
RABBITMQ_PASS = 'badminton123'   # Change if needed
```

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'pika'"

```bash
pip install pika
# or
pip3 install pika
```

### "Connection refused [Errno 61]"

RabbitMQ is not running:
```bash
# Start OrbStack/Docker
# Then:
cd badminton-backend
docker-compose up -d

# Verify:
docker-compose ps | grep rabbitmq
# Should show "healthy"
```

### "Empty reply from server" for backend

Backend API container may have crashed:
```bash
# Check logs:
docker-compose logs api

# Restart:
docker-compose restart api

# Or rebuild:
docker-compose down
docker-compose up -d --build
```

### Shots Not Appearing in Frontend

1. **Check Session ID:**
   - Must match an active session
   - Copy from browser console after starting training

2. **Check Backend Logs:**
   ```bash
   docker-compose logs -f api
   # Should show: "[BROKER] Received shot data"
   ```

3. **Check WebSocket Connection:**
   - Open browser DevTools → Network → WS
   - Should see WebSocket connection to `localhost:5000`
   - Should see messages coming in

4. **Check RabbitMQ:**
   - Open http://localhost:15672
   - Login: badminton/badminton123
   - Check Queues → `shot_data_queue`
   - Should show messages being consumed

## 📚 Documentation

- **QUICKSTART.md** - Get started in 3 steps
- **README.md** - Full documentation with examples
- **This file** - Complete setup and troubleshooting

## 🎯 Example Output

```
🏸 Mock CV Component - Badminton Shot Data Generator
============================================================

📋 Session ID: test-session-20251029-223045
🎯 Sending 10 shots with 3-second intervals...

Shot #1:
  Target:   (2.35, 4.12)
  Landing:  (2.42, 4.23)
  Accuracy: 13.6 cm
  Velocity: 245.3 km/h
  Confidence: 0.95
  ✅ Sent to RabbitMQ
  ⏳ Waiting 3 seconds...

Shot #2:
  Target:   (3.85, 10.55)
  Landing:  (3.72, 10.48)
  Accuracy: 15.3 cm
  Velocity: 218.7 km/h
  Confidence: 0.92
  ✅ Sent to RabbitMQ
  ⏳ Waiting 3 seconds...

...

============================================================
✅ All 10 shots sent successfully!

💡 Check your backend logs and frontend to see the shots appear in real-time!
```

## 🎬 Demo Scenario

Perfect for demos and testing:

1. **Setup** (1 minute)
   ```bash
   docker-compose up -d
   npm start  # in frontend directory
   ```

2. **Demo** (2 minutes)
   - Open http://localhost:3000
   - Register → Create Athlete → Start Training
   - Copy session ID

3. **Show Live Features** (30 seconds)
   ```bash
   python mock_cv_component.py SESSION_ID
   ```
   - Watch shots appear live on court
   - Statistics update automatically
   - Showcase real-time capabilities

4. **Review Session** (1 minute)
   - Stop training
   - Navigate to Performance Dashboard
   - Click on completed session
   - Show detailed session view with all shots

**Total Demo Time: ~5 minutes** 🚀

## 🔮 Future Enhancements

Potential additions to the mock CV:

- **Continuous mode:** Keep sending shots until stopped
- **Rally simulation:** Simulate back-and-forth rallies
- **Multiple sessions:** Send to multiple sessions simultaneously
- **Error injection:** Simulate dropped frames, low confidence
- **CSV input:** Read shot patterns from CSV file
- **Video sync:** Time shots based on video timestamps

## ✅ Success Criteria

You'll know everything is working when:

- ✅ `test_connection.py` shows "Connection successful"
- ✅ Backend health check returns OK: `curl http://localhost:5000/health`
- ✅ Frontend loads at http://localhost:3000
- ✅ Mock CV script runs without errors
- ✅ Shots appear on the court visualization in real-time
- ✅ Session statistics update after each shot
- ✅ Completed session shows all 10 shots in detail view

---

**Ready to test? Start with `QUICKSTART.md` or run the 3-step quick start above! 🏸**

