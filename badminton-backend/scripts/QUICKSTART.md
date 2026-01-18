# 🚀 Quick Start - Mock CV Component

Send 10 realistic badminton shots to your training session in just 3 steps!

## Step 1: Install Dependencies

```bash
cd badminton-backend/scripts
pip install pika
```

Or:
```bash
pip install -r requirements.txt
```

## Step 2: Make Sure Backend is Running

```bash
# In badminton-backend directory
docker-compose up -d

# Verify RabbitMQ is accessible
curl http://localhost:15672
# Should show RabbitMQ management interface
```

## Step 3: Run the Mock CV

### Option A: With Real Session ID (Best for Testing)

1. Open http://localhost:3000
2. Login and start a training session
3. Copy the session ID from the response/console
4. Run:

```bash
python mock_cv_component.py YOUR_SESSION_ID_HERE
```

Example:
```bash
python mock_cv_component.py "abc123-session-id"
```

### Option B: Test Mode (No Active Session)

```bash
python mock_cv_component.py
# Press Enter when asked for session ID
```

## What You'll See

```
🏸 Mock CV Component - Badminton Shot Data Generator
============================================================

📋 Session ID: abc123-session-id
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
  ...
```

## Live Testing

Watch the shots appear in real-time on the frontend court visualization!

1. Frontend: http://localhost:3000
2. Start a training session
3. Run the mock CV with that session ID
4. Watch the court update live every 3 seconds! 🏸

## Troubleshooting

**ModuleNotFoundError: No module named 'pika'**
```bash
pip install pika
```

**Connection refused**
```bash
# Start Docker services
cd ../
docker-compose up -d
```

**Shots not appearing?**
- Check backend logs: `docker-compose logs -f api`
- Verify session ID is correct
- Check RabbitMQ: http://localhost:15672 (guest/guest)

---

**That's it! Enjoy testing your badminton training system! 🏸**

