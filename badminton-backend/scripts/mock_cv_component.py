#!/usr/bin/env python3
"""
Mock CV Component - Simulates Computer Vision System Sending Shot Data

Two modes:

  Event-driven mode (no session_id):
    python mock_cv_component.py [--interval-ms MS] [--template ID]
    Connects to RabbitMQ, listens for session.start/session.stop messages,
    and sends shots while a session is active. Runs until Ctrl+C.

  Legacy mode (with session_id):
    python mock_cv_component.py <session_id> [--count N] [--interval-ms MS] [--template ID]
    Fire-and-forget: sends N shots to the given session, then exits.

Examples:
  python mock_cv_component.py                                              # Event-driven, 1.5s interval
  python mock_cv_component.py --interval-ms 1000                           # Event-driven, 1s interval
  python mock_cv_component.py abc123                                       # Legacy: 10 shots, 3s interval
  python mock_cv_component.py abc123 --count 50 --interval-ms 50           # Legacy: 50 shots, 50ms
  python mock_cv_component.py abc123 --count 50 --template template-001    # Legacy: 50 shots, 100% accurate

RabbitMQ message types: (from badminton-backend/src/types/index.ts)
export interface ShotDataFromCV {
  sessionId: string;
  shotNumber: number;
  timestamp: string;
  landingPosition: { x: number; y: number }; // In cm (half-court: 0-610 x 0-670)
  velocity?: number;
  detectionConfidence?: number;
}

export interface SessionStartEvent {
  sessionId: string;
  timestamp: string;
}

export interface SessionStopEvent {
  sessionId: string;
  timestamp: string;
}
"""

import pika
import json
import time
import random
import threading
import signal
from datetime import datetime, timezone
import sys
import argparse
import os

# RabbitMQ Configuration
RABBITMQ_URL = os.environ.get(
    'RABBITMQ_URL',
    'amqps://dzpkyqby:bnuzuwxSeCfiZBS6VIeDq8uDSETK1DDe@armadillo.rmq.cloudamqp.com/dzpkyqby'
)

EXCHANGE = 'badminton_training'
ROUTING_KEY = 'shot.data.mock'
SESSION_CONTROL_QUEUE = 'session_control_queue'

# Half-Court Dimensions (in centimeters)
# Template coordinate system: (0,0) at net left, (610, -670) at baseline right
HALF_COURT_WIDTH = 610   # cm
HALF_COURT_DEPTH = 670   # cm

# Template-001 target dots (exact landing positions for 100% accuracy)
# Shot N lands on position N % 3, cycling through all 3 positions
TEMPLATE_001_DOTS = [
    {'x': 46, 'y': -670},   # Position 0 - Bottom-left corner (baseline)
    {'x': 526, 'y': -236},  # Position 1 - Mid-right area
    {'x': 526, 'y': -38},   # Position 2 - Top-right near net
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
    Half-court coordinates: x=[0, 610], y=[0, -670]
    (0,0) is at the net, (610, -670) is at the baseline.

    Note: Target positions come from templates on the backend.
    This function just generates where the shuttlecock lands.
    """
    if zone == 'random':
        zones = ['front_left', 'front_right', 'back_left', 'back_right', 'mid_left', 'mid_right']
        zone = random.choice(zones)

    # Define zone boundaries in cm (half-court)
    # y=0 is at net, y=-670 is at baseline
    zone_positions = {
        'front_left': (50, 200, -200, 0),       # Near net, left side
        'front_right': (410, 560, -200, 0),     # Near net, right side
        'mid_left': (50, 200, -420, -250),      # Mid court, left side
        'mid_right': (410, 560, -420, -250),    # Mid court, right side
        'back_left': (50, 200, -670, -470),     # Baseline, left side
        'back_right': (410, 560, -670, -470),   # Baseline, right side
    }

    if zone in zone_positions:
        x_min, x_max, y_min, y_max = zone_positions[zone]
        x = round(random.uniform(x_min, x_max))
        y = round(random.uniform(y_min, y_max))
    else:
        # Fallback: anywhere on half-court
        x = round(random.uniform(50, HALF_COURT_WIDTH - 50))
        y = round(random.uniform(-(HALF_COURT_DEPTH - 50), -50))

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
        'timestamp': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'landingPosition': landing,  # In cm (half-court: x=0-610, y=0 to -670)
        'velocity': velocity,
        'detectionConfidence': confidence
    }

    return shot_data


# ---------------------------------------------------------------------------
# Event-driven mode: MockCVComponent class
# ---------------------------------------------------------------------------

class MockCVComponent:
    """
    Event-driven mock CV that listens for session.start/session.stop on
    RabbitMQ and publishes shots while a session is active.

    Uses two separate pika BlockingConnections (one per thread) because
    BlockingConnection is not thread-safe.
    """

    def __init__(self, interval_ms=1500, template_id=None):
        self.interval_seconds = interval_ms / 1000.0
        self.template_id = template_id

        # Ignore messages published before this component started
        self._started_at = datetime.now(timezone.utc)

        # Shared state (protected by lock)
        self._lock = threading.Lock()
        self._active_session_id = None
        self._shot_counter = 0
        self._running = True

        # Connections (each owned by one thread)
        self._consumer_connection = None
        self._publisher_connection = None
        self._publisher_channel = None

    # -- connection helpers --------------------------------------------------

    def _create_connection(self):
        """Create a new BlockingConnection using URLParameters (handles TLS)."""
        params = pika.URLParameters(RABBITMQ_URL)
        params.connection_attempts = 3
        params.retry_delay = 2
        params.heartbeat = 60
        return pika.BlockingConnection(params)

    # -- consumer (runs in daemon thread) ------------------------------------

    def _setup_consumer(self):
        """Open Connection A, declare exchange/queue, start consuming."""
        self._consumer_connection = self._create_connection()
        channel = self._consumer_connection.channel()

        channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)
        channel.queue_declare(queue=SESSION_CONTROL_QUEUE, durable=True)
        channel.queue_bind(queue=SESSION_CONTROL_QUEUE, exchange=EXCHANGE, routing_key='session.start')
        channel.queue_bind(queue=SESSION_CONTROL_QUEUE, exchange=EXCHANGE, routing_key='session.stop')

        channel.basic_qos(prefetch_count=10)
        channel.basic_consume(queue=SESSION_CONTROL_QUEUE, on_message_callback=self._on_message)

        print(f"[Consumer] Listening on queue '{SESSION_CONTROL_QUEUE}' for session.start / session.stop")
        channel.start_consuming()

    def _on_message(self, ch, method, _properties, body):
        """Handle incoming session.start / session.stop messages."""
        try:
            data = json.loads(body)
            routing_key = method.routing_key

            # Skip messages published before this component started
            msg_timestamp = data.get('timestamp')
            if msg_timestamp:
                try:
                    # Handle both 'Z' suffix and '+00:00' suffix
                    ts_str = msg_timestamp.replace('Z', '+00:00')
                    msg_time = datetime.fromisoformat(ts_str)
                    if msg_time < self._started_at:
                        print(f"[Consumer] Skipping old {routing_key} "
                              f"(sent {msg_timestamp}, started {self._started_at.isoformat()})")
                        return
                except (ValueError, TypeError):
                    pass  # Can't parse timestamp, process the message anyway

            if routing_key == 'session.start':
                session_id = data.get('sessionId')
                with self._lock:
                    if self._active_session_id is not None:
                        print(f"[Consumer] WARNING: Replacing active session "
                              f"{self._active_session_id} with {session_id}")
                    self._active_session_id = session_id
                    self._shot_counter = 0
                print(f"[Consumer] Session started: {session_id}")

            elif routing_key == 'session.stop':
                session_id = data.get('sessionId')
                with self._lock:
                    if self._active_session_id == session_id:
                        print(f"[Consumer] Session stopped: {session_id}")
                        self._active_session_id = None
                        self._shot_counter = 0
                    else:
                        print(f"[Consumer] Ignoring stop for {session_id} "
                              f"(active: {self._active_session_id})")
            else:
                print(f"[Consumer] Unknown routing key: {routing_key}")

        except json.JSONDecodeError as e:
            print(f"[Consumer] Bad JSON: {e}")
        except Exception as e:
            print(f"[Consumer] Error handling message: {e}")
        finally:
            ch.basic_ack(delivery_tag=method.delivery_tag)

    def _consumer_thread_run(self):
        """Entry point for the consumer daemon thread. Reconnects on failure."""
        while self._running:
            try:
                self._setup_consumer()
            except pika.exceptions.AMQPConnectionError as e:
                print(f"[Consumer] Connection lost: {e}. Reconnecting in 5s...")
            except Exception as e:
                if self._running:
                    print(f"[Consumer] Error: {e}. Reconnecting in 5s...")
            finally:
                try:
                    if self._consumer_connection and not self._consumer_connection.is_closed:
                        self._consumer_connection.close()
                except Exception:
                    pass
            if self._running:
                time.sleep(5)

    # -- publisher (runs in main thread) -------------------------------------

    def _setup_publisher(self):
        """Open Connection B, declare exchange, store channel."""
        self._publisher_connection = self._create_connection()
        self._publisher_channel = self._publisher_connection.channel()
        self._publisher_channel.exchange_declare(
            exchange=EXCHANGE, exchange_type='topic', durable=True
        )
        print("[Publisher] Connected to RabbitMQ")

    def _publish_shot(self, shot_data):
        """Publish a single shot message. Reconnects on failure."""
        try:
            self._publisher_channel.basic_publish(
                exchange=EXCHANGE,
                routing_key=ROUTING_KEY,
                body=json.dumps(shot_data),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            return True
        except (pika.exceptions.AMQPConnectionError, pika.exceptions.AMQPChannelError) as e:
            print(f"[Publisher] Connection lost: {e}. Reconnecting...")
            try:
                self._setup_publisher()
                self._publisher_channel.basic_publish(
                    exchange=EXCHANGE,
                    routing_key=ROUTING_KEY,
                    body=json.dumps(shot_data),
                    properties=pika.BasicProperties(
                        delivery_mode=2,
                        content_type='application/json'
                    )
                )
                return True
            except Exception as retry_err:
                print(f"[Publisher] Retry failed: {retry_err}")
                return False

    def _publisher_loop(self):
        """Main loop: publish shots while a session is active, else idle."""
        while self._running:
            with self._lock:
                session_id = self._active_session_id

            if session_id is None:
                time.sleep(0.5)
                continue

            # Increment shot counter and generate shot
            with self._lock:
                self._shot_counter += 1
                shot_num = self._shot_counter
                # Re-check session is still active after acquiring lock
                session_id = self._active_session_id
                if session_id is None:
                    continue

            shot_data = generate_mock_shot(session_id, shot_num, self.template_id)
            landing = shot_data['landingPosition']

            if self._publish_shot(shot_data):
                extra = ""
                if self.template_id:
                    position_index = shot_num % 3
                    extra = f" | Template pos {position_index}"
                print(f"  Shot #{shot_num} -> ({landing['x']}, {landing['y']}) cm "
                      f"| {shot_data['velocity']} km/h{extra}")
            else:
                print(f"  Shot #{shot_num} FAILED to send")

            time.sleep(self.interval_seconds)

    # -- lifecycle -----------------------------------------------------------

    def start(self):
        """Start the mock CV component (blocking)."""
        print("Mock CV Component - Event-Driven Mode")
        print("=" * 60)
        print(f"RabbitMQ: {RABBITMQ_URL.split('@')[-1]}")
        print(f"Interval: {self.interval_seconds}s between shots")
        if self.template_id:
            print(f"Template: {self.template_id} (100% accurate shots)")
        print("Waiting for session.start messages...")
        print("=" * 60)

        # Setup publisher connection (main thread)
        self._setup_publisher()

        # Start consumer in a daemon thread
        consumer = threading.Thread(target=self._consumer_thread_run, daemon=True)
        consumer.start()

        # Run publisher loop in main thread (blocks until shutdown)
        try:
            self._publisher_loop()
        except KeyboardInterrupt:
            pass
        finally:
            self.shutdown()

    def shutdown(self):
        """Graceful shutdown: stop loops and close connections."""
        print("\nShutting down...")
        self._running = False

        for conn_name, conn in [("Publisher", self._publisher_connection),
                                 ("Consumer", self._consumer_connection)]:
            try:
                if conn and not conn.is_closed:
                    conn.close()
                    print(f"  [{conn_name}] Connection closed")
            except Exception:
                pass

        print("Goodbye!")


# ---------------------------------------------------------------------------
# Legacy mode: fire-and-forget (backward compatible)
# ---------------------------------------------------------------------------

def run_legacy_mode(args):
    """Original fire-and-forget mode: send N shots to a given session, then exit."""
    session_id = args.session_id
    shot_count = args.count
    interval_seconds = args.interval_ms / 1000.0
    template_id = args.template

    # Mask credentials in display URL
    display_url = RABBITMQ_URL.split('@')[-1] if '@' in RABBITMQ_URL else RABBITMQ_URL

    print("Mock CV Component - Legacy Mode")
    print("=" * 60)
    print(f"Session ID: {session_id}")
    print(f"RabbitMQ: {display_url}")
    if template_id:
        print(f"Template: {template_id} (100% accurate shots on target dots)")
    print(f"Sending {shot_count} shots with {args.interval_ms}ms interval...\n")

    # Open a single persistent connection for all shots
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        params.connection_attempts = 3
        params.retry_delay = 2
        connection = pika.BlockingConnection(params)
        channel = connection.channel()
        channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)
    except Exception as e:
        print(f"Failed to connect to RabbitMQ: {e}")
        sys.exit(1)

    # Send shots
    for shot_num in range(1, shot_count + 1):
        shot_data = generate_mock_shot(session_id, shot_num, template_id)

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

        try:
            channel.basic_publish(
                exchange=EXCHANGE,
                routing_key=ROUTING_KEY,
                body=json.dumps(shot_data),
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            print(f"  Sent to RabbitMQ")
        except Exception as e:
            print(f"  Failed to send: {e}")

        # Wait before next shot (except for last shot)
        if shot_num < shot_count:
            if interval_seconds >= 1:
                print(f"  Waiting {interval_seconds:.1f} seconds...\n")
            time.sleep(interval_seconds)
        else:
            print()

        # Progress indicator for large counts
        if shot_count > 20 and shot_num % 10 == 0:
            print(f"Progress: {shot_num}/{shot_count} shots sent\n")

    # Close connection
    try:
        connection.close()
    except Exception:
        pass

    print("=" * 60)
    print(f"Successfully sent all {shot_count} shots!")
    print("\nCheck your backend logs and frontend to see the shots appear in real-time!")
    sys.exit(0)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Mock CV Component - Send badminton shot data to RabbitMQ',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Modes:
  Event-driven (no session_id):
    %(prog)s                              # Listen for session.start/stop, 1.5s interval
    %(prog)s --interval-ms 1000           # Custom interval

  Legacy (with session_id):
    %(prog)s abc123                        # 10 shots, 3s interval
    %(prog)s abc123 --count 50 --interval-ms 50
        """
    )
    parser.add_argument('session_id', nargs='?', default=None,
                        help='Session ID (legacy mode). Omit for event-driven mode.')
    parser.add_argument('--count', type=int, default=10,
                        help='Number of shots to send - legacy mode only (default: 10)')
    parser.add_argument('--interval-ms', type=int, default=None,
                        help='Interval between shots in ms (default: 1500 event-driven, 3000 legacy)')
    parser.add_argument('--template', type=str, default=None,
                        help='Template ID for 100%% accurate shots (e.g., template-001)')

    args = parser.parse_args()

    if args.session_id:
        # Legacy fire-and-forget mode
        if args.interval_ms is None:
            args.interval_ms = 3000
        run_legacy_mode(args)
    else:
        # Event-driven mode
        interval = args.interval_ms if args.interval_ms is not None else 1500
        component = MockCVComponent(interval_ms=interval, template_id=args.template)

        # Graceful shutdown on SIGTERM (e.g., docker stop)
        signal.signal(signal.SIGTERM, lambda sig, frame: component.shutdown())

        component.start()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user. Exiting...")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
