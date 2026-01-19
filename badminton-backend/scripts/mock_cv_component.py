#!/usr/bin/env python3
"""
Mock CV Component - Simulates Computer Vision System Sending Shot Data
This script sends mock badminton shot data to RabbitMQ.

Usage:
  python mock_cv_component.py <session_id> [--count N] [--interval-ms MS]

Examples:
  python mock_cv_component.py abc123                           # 10 shots, 3s interval (default)
  python mock_cv_component.py abc123 --count 50                # 50 shots, 3s interval
  python mock_cv_component.py abc123 --count 50 --interval-ms 50  # 50 shots, 50ms interval
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

# Badminton Court Dimensions (in meters)
COURT_WIDTH = 6.1
COURT_LENGTH = 13.4

def generate_court_position(zone='random'):
    """
    Generate realistic positions on badminton court.
    Court coordinates: x=[0, 6.1], y=[0, 13.4]
    """
    if zone == 'random':
        zones = ['front_left', 'front_right', 'back_left', 'back_right', 'mid_left', 'mid_right']
        zone = random.choice(zones)
    
    # Define zone boundaries
    zone_positions = {
        'front_left': (1.5, 2.5, 3.0, 5.0),    # (x_min, x_max, y_min, y_max)
        'front_right': (3.6, 4.6, 3.0, 5.0),
        'mid_left': (1.5, 2.5, 6.0, 7.5),
        'mid_right': (3.6, 4.6, 6.0, 7.5),
        'back_left': (1.0, 2.5, 9.5, 12.0),
        'back_right': (3.6, 5.1, 9.5, 12.0),
    }
    
    if zone in zone_positions:
        x_min, x_max, y_min, y_max = zone_positions[zone]
        x = round(random.uniform(x_min, x_max), 2)
        y = round(random.uniform(y_min, y_max), 2)
    else:
        # Fallback: anywhere on court
        x = round(random.uniform(0.5, COURT_WIDTH - 0.5), 2)
        y = round(random.uniform(2.0, COURT_LENGTH - 1.0), 2)
    
    return {'x': x, 'y': y}

def generate_landing_near_target(target, accuracy_level='medium'):
    """
    Generate landing position near target with realistic variance.
    accuracy_level: 'high' (±10cm), 'medium' (±30cm), 'low' (±60cm)
    """
    variance_map = {
        'high': 0.10,    # ±10cm
        'medium': 0.30,  # ±30cm
        'low': 0.60,     # ±60cm
    }
    
    max_variance = variance_map.get(accuracy_level, 0.30)
    
    # Add random variance
    dx = random.uniform(-max_variance, max_variance)
    dy = random.uniform(-max_variance, max_variance)
    
    landing_x = round(max(0, min(COURT_WIDTH, target['x'] + dx)), 2)
    landing_y = round(max(0, min(COURT_LENGTH, target['y'] + dy)), 2)
    
    return {'x': landing_x, 'y': landing_y}

def generate_mock_shot(session_id, shot_number):
    """
    Generate a single mock shot data matching ShotDataFromCV interface.
    """
    # Vary accuracy level for realistic data
    accuracy_levels = ['high', 'high', 'medium', 'medium', 'medium', 'low']
    accuracy = random.choice(accuracy_levels)
    
    # Generate target position
    target = generate_court_position('random')
    
    # Generate landing position near target
    landing = generate_landing_near_target(target, accuracy)
    
    # Generate velocity (realistic smash/clear speeds: 150-300 km/h)
    velocity = round(random.uniform(180, 280), 1)
    
    # Detection confidence (CV system confidence: 0.85-0.99)
    confidence = round(random.uniform(0.88, 0.98), 2)
    
    shot_data = {
        'sessionId': session_id,
        'shotNumber': shot_number,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'targetPosition': target,
        'landingPosition': landing,
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

    args = parser.parse_args()

    session_id = args.session_id
    shot_count = args.count
    interval_seconds = args.interval_ms / 1000.0

    print("🏸 Mock CV Component - Badminton Shot Data Generator")
    print("=" * 60)
    print(f"📋 Session ID: {session_id}")
    print(f"🔌 RabbitMQ: {RABBITMQ_HOST}:{RABBITMQ_PORT} (user: {RABBITMQ_USER})")
    print(f"🎯 Sending {shot_count} shots with {args.interval_ms}ms interval...\n")

    # Send shots
    for shot_num in range(1, shot_count + 1):
        # Generate shot data
        shot_data = generate_mock_shot(session_id, shot_num)

        # Display shot info
        target = shot_data['targetPosition']
        landing = shot_data['landingPosition']
        distance = ((target['x'] - landing['x'])**2 + (target['y'] - landing['y'])**2)**0.5
        distance_cm = distance * 100

        print(f"Shot #{shot_num}:")
        print(f"  Target:   ({target['x']:.2f}, {target['y']:.2f})")
        print(f"  Landing:  ({landing['x']:.2f}, {landing['y']:.2f})")
        print(f"  Accuracy: {distance_cm:.1f} cm")
        print(f"  Velocity: {shot_data['velocity']} km/h")
        print(f"  Confidence: {shot_data['detectionConfidence']}")

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

