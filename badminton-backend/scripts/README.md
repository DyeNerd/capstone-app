# Mock CV Component Scripts

This directory contains scripts to simulate the Computer Vision component for testing.

## Mock CV Component (`mock_cv_component.py`)

Simulates a badminton computer vision system that detects shuttlecock positions and sends shot data to RabbitMQ.

### Features

- Generates 10 realistic badminton shots
- Sends data every 3 seconds
- Realistic court positions (13.4m × 6.1m)
- Varied accuracy levels (high/medium/low)
- Realistic velocities (180-280 km/h)
- Detection confidence scores (88-98%)

### Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Make sure RabbitMQ is running:**
   ```bash
   # RabbitMQ should be running via docker-compose
   docker-compose ps | grep rabbitmq
   ```

### Usage

**Method 1: With Session ID (Recommended)**

First, start a training session in the frontend, then use that session ID:

```bash
python scripts/mock_cv_component.py <session-id>
```

Example:
```bash
python scripts/mock_cv_component.py "123e4567-e89b-12d3-a456-426614174000"
```

**Method 2: Interactive Mode**

Run without arguments and enter session ID when prompted:

```bash
python scripts/mock_cv_component.py
# Enter Session ID: <paste-your-session-id>
```

**Method 3: Test Mode**

Press Enter at the prompt to use auto-generated test session ID:

```bash
python scripts/mock_cv_component.py
# Enter Session ID: [press Enter]
```

### Output

The script displays each shot's details:

```
Shot #1:
  Target:   (2.35, 4.12)
  Landing:  (2.42, 4.23)
  Accuracy: 13.6 cm
  Velocity: 245.3 km/h
  Confidence: 0.95
  ✅ Sent to RabbitMQ
  ⏳ Waiting 3 seconds...
```

### Integration

The shot data is sent to:
- **Exchange:** `badminton_training`
- **Routing Key:** `shot.data.mock`
- **Queue:** `shot_data_queue`

The backend automatically:
1. Receives the shot data
2. Calculates accuracy and court zones
3. Saves to PostgreSQL database
4. Broadcasts to WebSocket clients
5. Updates session statistics

### Testing Flow

1. **Start Backend:**
   ```bash
   cd badminton-backend
   docker-compose up -d
   ```

2. **Start Frontend:**
   ```bash
   cd badminton-frontend
   npm start
   ```

3. **In Browser (http://localhost:3000):**
   - Login/Register
   - Create an athlete
   - Start a training session
   - Copy the session ID from the URL or console

4. **Run Mock CV:**
   ```bash
   python scripts/mock_cv_component.py <session-id>
   ```

5. **Watch Live Updates:**
   - Frontend shows shots appearing on court in real-time
   - Statistics update automatically
   - Each shot appears 3 seconds apart

### Troubleshooting

**Error: `ModuleNotFoundError: No module named 'pika'`**
```bash
pip install pika
```

**Error: `Connection refused` or `ACCESS_REFUSED`**
- Make sure RabbitMQ is running: `docker-compose ps`
- Check RabbitMQ port: `lsof -i:5672`
- Verify credentials: Username=`badminton`, Password=`badminton123`

**No shots appearing in frontend?**
- Check session ID is correct
- Check backend logs: `docker-compose logs -f api`
- Check RabbitMQ management UI: http://localhost:15672 (badminton/badminton123)

### Advanced

**Modify Shot Patterns:**

Edit the script to customize:
- Number of shots: Change `range(1, 11)` to `range(1, 21)` for 20 shots
- Time interval: Change `time.sleep(3)` to `time.sleep(1)` for 1-second intervals
- Accuracy: Modify `accuracy_levels` array weights
- Court zones: Adjust `zone_positions` dictionary

**Send Continuous Shots:**

```python
while True:
    shot_data = generate_mock_shot(session_id, shot_num)
    send_to_rabbitmq(shot_data)
    shot_num += 1
    time.sleep(2)
```

## Future Scripts

- `analyze_session.py` - Analyze completed training sessions
- `generate_report.py` - Generate PDF performance reports
- `stress_test.py` - Send high-volume shot data for testing

