import amqp, { ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import { BROKER_CONFIG } from '../config/broker';
import { ShotDataFromCV, SessionStartEvent, SessionStopEvent } from '../types';
import { shotService } from './shot.service';
import { sessionService } from './session.service';
import { templateService } from './template.service';
import { socketHandler } from '../websocket/socket.handler';
import { calculateAccuracy, determineCourtZone, calculateAccuracyPercent, isPointInBox, calculateScore } from '../utils/court.utils';

class BrokerService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  // OPTIMIZATION: Debounce stats broadcasts to reduce WebSocket overhead
  private pendingStatsBroadcasts: Map<string, { timeout: NodeJS.Timeout; sessionId: string }> = new Map();
  private readonly STATS_BROADCAST_DEBOUNCE_MS = 500; // Max 2 broadcasts/second

  async initialize() {
    try {
      this.connection = await amqp.connect(BROKER_CONFIG.url);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create channel');
      }

      // Declare exchange
      await this.channel.assertExchange(BROKER_CONFIG.exchange, 'topic', { durable: true });

      // Declare queue for shot data (consumed by this backend)
      await this.channel.assertQueue(BROKER_CONFIG.queues.shotData, { durable: true });
      await this.channel.bindQueue(
        BROKER_CONFIG.queues.shotData,
        BROKER_CONFIG.exchange,
        BROKER_CONFIG.routingKeys.shotData
      );

      // Declare queue for session control (consumed by CV component)
      await this.channel.assertQueue(BROKER_CONFIG.queues.sessionControl, { durable: true });
      await this.channel.bindQueue(
        BROKER_CONFIG.queues.sessionControl,
        BROKER_CONFIG.exchange,
        BROKER_CONFIG.routingKeys.sessionStart
      );
      await this.channel.bindQueue(
        BROKER_CONFIG.queues.sessionControl,
        BROKER_CONFIG.exchange,
        BROKER_CONFIG.routingKeys.sessionStop
      );

      console.log('✅ RabbitMQ connected and configured');

      // Start consuming shot data
      this.consumeShotData();
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error);
      // Don't exit, allow app to work without broker
    }
  }

  async publishSessionStart(data: SessionStartEvent) {
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

  async publishSessionStop(data: SessionStopEvent) {
    if (!this.channel) {
      console.warn('⚠️  Broker not available, skipping session stop publish');
      return;
    }

    const routingKey = BROKER_CONFIG.routingKeys.sessionStop;
    const message = JSON.stringify(data);

    this.channel.publish(BROKER_CONFIG.exchange, routingKey, Buffer.from(message), {
      persistent: true,
    });

    // OPTIMIZATION: Clear any pending stats broadcasts for this session
    this.cancelPendingStatsBroadcast(data.sessionId);

    console.log(`[BROKER] Published session stop: ${data.sessionId}`);
  }

  private async consumeShotData() {
    if (!this.channel) return;

    this.channel.consume(
      BROKER_CONFIG.queues.shotData,
      async (msg: ConsumeMessage | null) => {
        if (msg) {
          try {
            const shotData: ShotDataFromCV = JSON.parse(msg.content.toString());
            console.log(`[BROKER] Received shot data:`, shotData);

            await this.processShotData(shotData);

            this.channel!.ack(msg);
          } catch (error) {
            console.error('[BROKER] Error processing shot data:', error);
            this.channel!.nack(msg, false, true);
          }
        }
      },
      { noAck: false }
    );
  }

  private async processShotData(shotData: ShotDataFromCV) {
    const { sessionId, shotNumber, timestamp, landingPosition, velocity, detectionConfidence } = shotData;

    // Get session to retrieve template_id
    const session = await sessionService.getSessionById(sessionId, []);
    const templateId = session.template_id;

    // Get target position from template (cycling through positions)
    let targetPosition = { x: 0, y: 0 };
    let inBox: boolean | undefined;
    let targetPositionIndex: number | undefined;

    if (templateId) {
      const templateTarget = templateService.getTargetForShot(templateId, shotNumber);
      if (templateTarget) {
        // Use template's dot as target position (coordinates in cm)
        // Convert cm to meters for accuracy calculation (divide by 100)
        targetPosition = {
          x: templateTarget.dot.x / 100,
          y: templateTarget.dot.y / 100,
        };
        targetPositionIndex = templateTarget.positionIndex;

        // Check if landing is in box (landing position from CV is in cm)
        inBox = isPointInBox(landingPosition, templateTarget.box);
      }
    }

    // Convert landing position from cm to meters for accuracy calculation
    const landingInMeters = {
      x: landingPosition.x / 100,
      y: landingPosition.y / 100,
    };

    // Calculate accuracy (in cm, using meter positions)
    const accuracyCm = calculateAccuracy(targetPosition, landingInMeters);
    const accuracyPercent = calculateAccuracyPercent(accuracyCm);
    const courtZone = determineCourtZone(landingInMeters);
    const wasSuccessful = accuracyCm < 30;
    const score = calculateScore(accuracyCm, inBox ?? null);

    // Save shot to database (store positions in meters for consistency)
    const shot = await shotService.createShot({
      sessionId,
      shotNumber,
      timestamp: new Date(timestamp),
      landingPositionX: landingInMeters.x,
      landingPositionY: landingInMeters.y,
      targetPositionX: targetPosition.x,
      targetPositionY: targetPosition.y,
      accuracyCm,
      accuracyPercent,
      velocityKmh: velocity,
      detectionConfidence,
      wasSuccessful,
      courtZone,
      inBox,
      targetPositionIndex,
      score,
    });

    // OPTIMIZATION 1: Incremental stats update (O(1) vs O(n))
    const updatedSession = await sessionService.incrementalUpdateStats(
      sessionId,
      accuracyPercent,
      velocity ?? 0,
      wasSuccessful,
      score
    );

    // OPTIMIZATION 2: Immediate shot broadcast (real-time UX)
    socketHandler.emitShotData(sessionId, shot);

    // OPTIMIZATION 3: Debounced stats broadcast (reduce WebSocket overhead)
    this.scheduleDebouncedStatsBroadcast(sessionId, {
      total_shots: updatedSession.total_shots || 0,
      successful_shots: updatedSession.successful_shots || 0,
      average_accuracy_percent: Number(updatedSession.average_accuracy_percent || 0),
      average_shot_velocity_kmh: Number(updatedSession.average_shot_velocity_kmh || 0),
      average_score: Number(updatedSession.average_score || 0),
    });
  }

  /**
   * OPTIMIZATION: Debounce stats broadcasts to max 2/second
   * Reduces WebSocket overhead while maintaining near real-time updates
   */
  private scheduleDebouncedStatsBroadcast(
    sessionId: string,
    stats: {
      total_shots: number;
      successful_shots: number;
      average_accuracy_percent: number;
      average_shot_velocity_kmh: number;
      average_score: number;
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
   * Called when session stops to clean up resources
   */
  private cancelPendingStatsBroadcast(sessionId: string): void {
    const pending = this.pendingStatsBroadcasts.get(sessionId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingStatsBroadcasts.delete(sessionId);
    }
  }
}

export const brokerService = new BrokerService();

