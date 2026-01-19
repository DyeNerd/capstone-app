import amqp, { Channel, Connection } from 'amqplib';
import { BROKER_CONFIG } from '../config/broker';
import { ShotDataFromCV, SessionStartEvent, SessionStopEvent } from '../types';
import { shotService } from './shot.service';
import { sessionService } from './session.service';
import { socketHandler } from '../websocket/socket.handler';
import {
  calculateAccuracy,
  determineCourtZone,
  calculateAccuracyPercent,
} from '../utils/court.utils';

interface PendingStatsBroadcast {
  timeout: NodeJS.Timeout;
  sessionId: string;
}

class BrokerService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  // OPTIMIZATION: Debounce stats broadcasts to reduce WebSocket overhead
  private pendingStatsBroadcasts: Map<string, PendingStatsBroadcast> = new Map();
  private readonly STATS_BROADCAST_DEBOUNCE_MS = 500; // Max 2 broadcasts/second

  async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(BROKER_CONFIG.url);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create channel');
      }

      // Configure channel with prefetch for better performance
      await this.channel.prefetch(10);

      // Declare exchange
      await this.channel.assertExchange(BROKER_CONFIG.exchange, 'topic', {
        durable: true,
      });

      // Declare queue for shot data
      await this.channel.assertQueue(BROKER_CONFIG.queues.shotData, {
        durable: true,
      });
      await this.channel.bindQueue(
        BROKER_CONFIG.queues.shotData,
        BROKER_CONFIG.exchange,
        BROKER_CONFIG.routingKeys.shotData
      );

      console.log('✅ RabbitMQ connected and configured');

      // Start consuming shot data
      this.consumeShotData();
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error);
      // Don't exit, allow app to work without broker
    }
  }

  async publishSessionStart(data: SessionStartEvent): Promise<void> {
    if (!this.channel) {
      console.warn('⚠️  Broker not available, skipping session start publish');
      return;
    }

    const routingKey = BROKER_CONFIG.routingKeys.sessionStart;
    const message = JSON.stringify(data);

    this.channel.publish(BROKER_CONFIG.exchange, routingKey, Buffer.from(message), {
      persistent: true,
    });

    console.log(`[BROKER] Published session start: ${data.sessionId}`);
  }

  async publishSessionStop(data: SessionStopEvent): Promise<void> {
    if (!this.channel) {
      console.warn('⚠️  Broker not available, skipping session stop publish');
      return;
    }

    const routingKey = BROKER_CONFIG.routingKeys.sessionStop;
    const message = JSON.stringify(data);

    this.channel.publish(BROKER_CONFIG.exchange, routingKey, Buffer.from(message), {
      persistent: true,
    });

    console.log(`[BROKER] Published session stop: ${data.sessionId}`);

    // OPTIMIZATION: Clear any pending stats broadcasts for this session
    this.cancelPendingStatsBroadcast(data.sessionId);
  }

  private async consumeShotData(): Promise<void> {
    if (!this.channel) return;

    this.channel.consume(
      BROKER_CONFIG.queues.shotData,
      async (msg) => {
        if (msg) {
          try {
            const shotData: ShotDataFromCV = JSON.parse(msg.content.toString());
            console.log(`[BROKER] Received shot data:`, shotData);

            await this.processShotData(shotData);

            this.channel!.ack(msg);
          } catch (error) {
            console.error('[BROKER] Error processing shot data:', error);
            // Requeue message for retry
            this.channel!.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );
  }

  /**
   * REFACTORED: Incremental stats + debounced broadcasts
   *
   * Performance improvements:
   * 1. Use incrementalUpdateStats() instead of full recalculation: O(n) → O(1)
   * 2. Debounce stats broadcasts: 100 shots/min → 2 broadcasts/sec max
   * 3. Immediate shot data broadcast (no debounce for real-time feel)
   *
   * At 500 shots: 125,250 operations → 500 operations (99.6% reduction)
   */
  private async processShotData(shotData: ShotDataFromCV): Promise<void> {
    const {
      sessionId,
      shotNumber,
      timestamp,
      targetPosition,
      landingPosition,
      velocity,
      detectionConfidence,
    } = shotData;

    // Calculate accuracy metrics
    const accuracyCm = calculateAccuracy(targetPosition, landingPosition);
    const accuracyPercent = calculateAccuracyPercent(accuracyCm);
    const courtZone = determineCourtZone(landingPosition);
    const wasSuccessful = accuracyCm < 30;

    // Save shot to database
    const shot = await shotService.createShot({
      sessionId,
      shotNumber,
      timestamp: new Date(timestamp),
      landingPositionX: landingPosition.x,
      landingPositionY: landingPosition.y,
      targetPositionX: targetPosition.x,
      targetPositionY: targetPosition.y,
      accuracyCm,
      accuracyPercent,
      velocityKmh: velocity,
      detectionConfidence,
      wasSuccessful,
      courtZone,
    });

    // OPTIMIZATION 1: Incremental stats update (O(1) vs O(n))
    const updatedSession = await sessionService.incrementalUpdateStats(
      sessionId,
      accuracyPercent,
      velocity,
      wasSuccessful
    );

    // OPTIMIZATION 2: Immediate shot broadcast (real-time UX)
    socketHandler.emitShotData(sessionId, shot);

    // OPTIMIZATION 3: Debounced stats broadcast (reduce WebSocket overhead)
    this.scheduleDebouncedStatsBroadcast(sessionId, {
      total_shots: updatedSession.total_shots,
      successful_shots: updatedSession.successful_shots,
      average_accuracy_percent: updatedSession.average_accuracy_percent,
      average_shot_velocity_kmh: updatedSession.average_shot_velocity_kmh,
    });
  }

  /**
   * OPTIMIZATION: Debounce stats broadcasts to max 2/second
   *
   * Why: During rapid shot detection (100+ shots/min), broadcasting stats
   * after every shot creates unnecessary WebSocket traffic. Debouncing
   * reduces broadcasts while maintaining responsive UX.
   *
   * Trade-off: Stats UI lags up to 500ms behind, but shot visualization
   * remains real-time (shot data not debounced).
   */
  private scheduleDebouncedStatsBroadcast(
    sessionId: string,
    stats: {
      total_shots: number;
      successful_shots: number;
      average_accuracy_percent: number;
      average_shot_velocity_kmh: number;
    }
  ): void {
    // Cancel existing pending broadcast
    const existing = this.pendingStatsBroadcasts.get(sessionId);
    if (existing) {
      clearTimeout(existing.timeout);
    }

    // Schedule new broadcast
    const timeout = setTimeout(() => {
      socketHandler.emitSessionStats(sessionId, stats);
      this.pendingStatsBroadcasts.delete(sessionId);
    }, this.STATS_BROADCAST_DEBOUNCE_MS);

    this.pendingStatsBroadcasts.set(sessionId, { timeout, sessionId });
  }

  /**
   * Cancel pending stats broadcast for a session
   * Called when session stops to avoid broadcasting stale data
   */
  private cancelPendingStatsBroadcast(sessionId: string): void {
    const pending = this.pendingStatsBroadcasts.get(sessionId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingStatsBroadcasts.delete(sessionId);
    }
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async shutdown(): Promise<void> {
    // Clear all pending broadcasts
    for (const [sessionId] of this.pendingStatsBroadcasts) {
      this.cancelPendingStatsBroadcast(sessionId);
    }

    // Close RabbitMQ connection
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    console.log('🔌 RabbitMQ connection closed');
  }
}

export const brokerService = new BrokerService();
