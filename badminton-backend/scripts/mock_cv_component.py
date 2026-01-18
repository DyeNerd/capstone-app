#!/usr/bin/env python3
"""
Mock CV Component - Simulates Computer Vision System Sending Shot Data
This script sends 10 mock badminton shot data to RabbitMQ with 3-second intervals.
"""

import pika
import json
import time
import random
from datetime import datetime
import sys

# RabbitMQ Configuration
RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'badminton'
RABBITMQ_PASS = 'badminton123'
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
            credentials=credentials
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
    Main function to send 10 mock shots with 3-second intervals.
    """
    print("🏸 Mock CV Component - Badminton Shot Data Generator")
    print("=" * 60)
    
    # Get session ID from command line or use default
    if len(sys.argv) > 1:
        session_id = sys.argv[1]
    else:
        # Default test session ID (you'll need to replace with actual session ID)
        session_id = input("Enter Session ID (or press Enter for test mode): ").strip()
        if not session_id:
            session_id = "test-session-" + datetime.now().strftime("%Y%m%d-%H%M%S")
            print(f"⚠️  Using test session ID: {session_id}")
    
    print(f"\n📋 Session ID: {session_id}")
    print(f"🎯 Sending 10 shots with 3-second intervals...\n")
    
    # Send 10 shots
    for shot_num in range(1, 11):
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
        
        # Wait 3 seconds before next shot (except for last shot)
        if shot_num < 10:
            print(f"  ⏳ Waiting 3 seconds...\n")
            time.sleep(3)
        else:
            print()
    
    print("=" * 60)
    print("✅ All 10 shots sent successfully!")
    print("\n💡 Check your backend logs and frontend to see the shots appear in real-time!")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user. Exiting...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

