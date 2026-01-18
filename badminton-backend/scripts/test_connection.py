#!/usr/bin/env python3
"""
Quick test script to verify RabbitMQ connection.
"""

import pika
import sys

RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
RABBITMQ_USER = 'badminton'
RABBITMQ_PASS = 'badminton123'

def test_connection():
    try:
        print("🔌 Testing RabbitMQ connection...")
        print(f"   Host: {RABBITMQ_HOST}")
        print(f"   Port: {RABBITMQ_PORT}")
        print(f"   User: {RABBITMQ_USER}")
        
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        parameters = pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials
        )
        
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        
        print("✅ Connection successful!")
        print("✅ Channel created!")
        
        connection.close()
        print("✅ Connection closed properly!")
        print("\n🎉 RabbitMQ is ready to use!")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("\n💡 Troubleshooting:")
        print("   1. Make sure Docker/OrbStack is running")
        print("   2. Start RabbitMQ: docker-compose up -d")
        print("   3. Check RabbitMQ status: docker-compose ps")
        print("   4. Check port 5672: lsof -i:5672")
        return False

if __name__ == '__main__':
    success = test_connection()
    sys.exit(0 if success else 1)

