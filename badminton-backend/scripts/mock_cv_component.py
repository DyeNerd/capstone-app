#!/usr/bin/env python3
"""
Mock CV Component - Simulates Computer Vision System Sending Shot Data
This script sends mock badminton shot data to RabbitMQ.

Usage:
  python mock_cv_component.py <session_id> [--count N] [--interval-ms MS] [--template ID]

Examples:
  python mock_cv_component.py abc123                                    # 10 shots, random landing
  python mock_cv_component.py abc123 --count 50 --interval-ms 50        # 50 shots, 50ms interval
  python mock_cv_component.py abc123 --count 50 --template template-001 # 50 shots, 100% accurate on template
"""

import pika
import json
import time
import random
from datetime import datetime
import sys
import argparse
import os

# RabbitMQ Configuration - Use environment variables with defaults
RABBITMQ_URL = os.environ.get('RABBITMQ_URL', 'amqp://badminton:badminton123@localhost:5672')

# Parse RABBITMQ_URL to extract connection parameters
# Format: amqp://user:pass@host:port
def parse_rabbitmq_url(url: str) -> dict:
    """Parse RabbitMQ URL into connection parameters."""
    # Remove 'amqp://' prefix
    url = url.replace('amqp://', '')

    # Split into credentials and host parts
    if '@' in url:
        credentials, host_part = url.split('@')
        user, password = credentials.split(':')
    else:
        user = 'badminton'
        password = 'badminton123'
        host_part = url

    # Split host and port
    if ':' in host_part:
        host, port = host_part.split(':')
        port = int(port)
    else:
        host = host_part
        port = 5672

    return {
        'host': host,
        'port': port,
        'user': user,
        'password': password
    }

rabbitmq_config = parse_rabbitmq_url(RABBITMQ_URL)
RABBITMQ_HOST = rabbitmq_config['host']
RABBITMQ_PORT = rabbitmq_config['port']
RABBITMQ_USER = rabbitmq_config['user']
RABBITMQ_PASS = rabbitmq_config['password']
EXCHANGE = 'badminton_training'
ROUTING_KEY = 'shot.data.mock'

# Half-Court Dimensions (in centimeters)
# Template coordinate system: (0,0) at net left, (610, 670) at baseline right
HALF_COURT_WIDTH = 610   # cm
HALF_COURT_DEPTH = 670   # cm

# Template-001 target dots (exact landing positions for 100% accuracy)
# Shot N lands on position N % 3, cycling through all 3 positions
TEMPLATE_001_DOTS = [
    {'x': 46, 'y': 670},   # Position 0 - Bottom-left corner (baseline)
    {'x': 526, 'y': 236},  # Position 1 - Mid-right area
    {'x': 526, 'y': 38},   # Position 2 - Top-right near net
]

def get_template_landing_position(template_id: str, shot_number: int) -> dict:
    """
    Get landing position for a shot that lands exactly on the template target dot.
    Returns the exact target dot coordinates for 100% accuracy.

    Args:
        template_id: Template ID (currently only 'template-001' supported)
        shot_number: The shot number (0-indexed), used to cycle through positions

    Returns:
        dict with 'x' and 'y' coordinates in cm
    """
    if template_id == 'template-001':
        position_index = shot_number % len(TEMPLATE_001_DOTS)
        return TEMPLATE_001_DOTS[position_index].copy()
    else:
        # Unknown template, fall back to random
        return generate_landing_position('random')

def generate_landing_position(zone='random'):
    """
    Generate realistic landing positions on half-court in centimeters.
    Half-court coordinates: x=[0, 610], y=[0, 670]
    (0,0) is at the net, (610, 670) is at the baseline.

    Note: Target positions come from templates on the backend.
    This function just generates where the shuttlecock lands.
    """
    if zone == 'random':
        zones = ['front_left', 'front_right', 'back_left', 'back_right', 'mid_left', 'mid_right']
        zone = random.choice(zones)

    # Define zone boundaries in cm (half-court)
    # y=0 is at net, y=670 is at baseline
    zone_positions = {
        'front_left': (50, 200, 0, 200),       # Near net, left side
        'front_right': (410, 560, 0, 200),     # Near net, right side
        'mid_left': (50, 200, 250, 420),       # Mid court, left side
        'mid_right': (410, 560, 250, 420),     # Mid court, right side
        'back_left': (50, 200, 470, 670),      # Baseline, left side
        'back_right': (410, 560, 470, 670),    # Baseline, right side
    }

    if zone in zone_positions:
        x_min, x_max, y_min, y_max = zone_positions[zone]
        x = round(random.uniform(x_min, x_max))
        y = round(random.uniform(y_min, y_max))
    else:
        # Fallback: anywhere on half-court
        x = round(random.uniform(50, HALF_COURT_WIDTH - 50))
        y = round(random.uniform(50, HALF_COURT_DEPTH - 50))

    return {'x': x, 'y': y}

def generate_mock_shot(session_id, shot_number, template_id=None):
    """
    Generate a single mock shot data matching ShotDataFromCV interface.

    Note: targetPosition is NOT sent - the backend determines target from
    the session's template based on shot number (cycling through positions).

    Args:
        session_id: The training session ID
        shot_number: The shot number (0-indexed for template cycling)
        template_id: Optional template ID for 100% accurate shots on target dots
    """
    # Generate landing position on half-court (in cm)
    if template_id:
        # Land exactly on template target dot for 100% accuracy
        landing = get_template_landing_position(template_id, shot_number)
    else:
        # Random landing position
        landing = generate_landing_position('random')

    # Generate velocity (realistic smash/clear speeds: 150-300 km/h)
    velocity = round(random.uniform(180, 280), 1)

    # Detection confidence (CV system confidence: 0.85-0.99)
    confidence = round(random.uniform(0.88, 0.98), 2)

    shot_data = {
        'sessionId': session_id,
        'shotNumber': shot_number,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'landingPosition': landing,  # In cm (half-court: 0-610 x 0-670)
        'velocity': velocity,
        'detectionConfidence': confidence
    }

    return shot_data

def send_to_rabbitmq(shot_data):
    """
    Send shot data to RabbitMQ exchange.
    """
    try:
        # Connect to RabbitMQ
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            connection_attempts=3,
            retry_delay=2
        )

        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        # Declare exchange (should already exist, but doesn't hurt)
        channel.exchange_declare(
            exchange=EXCHANGE,
            exchange_type='topic',
            durable=True
        )
        
        # Publish message
        channel.basic_publish(
            exchange=EXCHANGE,
            routing_key=ROUTING_KEY,
            body=json.dumps(shot_data),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
                content_type='application/json'
            )
        )
        
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error sending to RabbitMQ: {e}")
        return False

def main():
    """
    Main function to send mock shots with configurable count and interval.
    """
    # Parse command-line arguments
    parser = argparse.ArgumentParser(
        description='Mock CV Component - Send badminton shot data to RabbitMQ',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s abc123                              # 10 shots, 3s interval (default)
  %(prog)s abc123 --count 50                   # 50 shots, 3s interval
  %(prog)s abc123 --count 50 --interval-ms 50  # 50 shots, 50ms interval (fast for E2E tests)
        """
    )
    parser.add_argument('session_id', help='Training session ID to send shots to')
    parser.add_argument('--count', type=int, default=10,
                        help='Number of shots to send (default: 10)')
    parser.add_argument('--interval-ms', type=int, default=3000,
                        help='Interval between shots in milliseconds (default: 3000)')
    parser.add_argument('--template', type=str, default=None,
                        help='Template ID for 100%% accurate shots (e.g., template-001)')

    args = parser.parse_args()

    session_id = args.session_id
    shot_count = args.count
    interval_seconds = args.interval_ms / 1000.0
    template_id = args.template

    print("🏸 Mock CV Component - Badminton Shot Data Generator")
    print("=" * 60)
    print(f"📋 Session ID: {session_id}")
    print(f"🔌 RabbitMQ: {RABBITMQ_HOST}:{RABBITMQ_PORT} (user: {RABBITMQ_USER})")
    if template_id:
        print(f"🎯 Template: {template_id} (100% accurate shots on target dots)")
    print(f"🎯 Sending {shot_count} shots with {args.interval_ms}ms interval...\n")

    # Send shots
    for shot_num in range(1, shot_count + 1):
        # Generate shot data (use 0-indexed for template position cycling)
        shot_data = generate_mock_shot(session_id, shot_num, template_id)

        # Display shot info
        landing = shot_data['landingPosition']

        print(f"Shot #{shot_num}:")
        print(f"  Landing:  ({landing['x']}, {landing['y']}) cm")
        print(f"  Velocity: {shot_data['velocity']} km/h")
        print(f"  Confidence: {shot_data['detectionConfidence']}")
        if template_id:
            position_index = shot_num % 3
            print(f"  Template Position: {position_index} (100% on target)")
        else:
            print(f"  (Target determined by backend template)")

        # Send to RabbitMQ
        if send_to_rabbitmq(shot_data):
            print(f"  ✅ Sent to RabbitMQ")
        else:
            print(f"  ❌ Failed to send")

        # Wait before next shot (except for last shot)
        if shot_num < shot_count:
            if interval_seconds >= 1:
                print(f"  ⏳ Waiting {interval_seconds:.1f} seconds...\n")
            time.sleep(interval_seconds)
        else:
            print()

        # Progress indicator for large counts
        if shot_count > 20 and shot_num % 10 == 0:
            print(f"📊 Progress: {shot_num}/{shot_count} shots sent\n")

    print("=" * 60)
    print(f"✅ Successfully sent all {shot_count} shots!")
    print("\n💡 Check your backend logs and frontend to see the shots appear in real-time!")
    sys.exit(0)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user. Exiting...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

