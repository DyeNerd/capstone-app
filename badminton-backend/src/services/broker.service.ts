import amqp from 'amqplib';
import { BROKER_CONFIG } from '../config/broker';
import { ShotDataFromCV, SessionStartEvent, SessionStopEvent } from '../types';
import { shotService } from './shot.service';
import { sessionService } from './session.service';
import { socketHandler } from '../websocket/socket.handler';
import { calculateAccuracy, determineCourtZone, calculateAccuracyPercent } from '../utils/court.utils';

class BrokerService {
  private connection: any = null;
  private channel: any = null;

  async initialize() {
    try {
      this.connection = await amqp.connect(BROKER_CONFIG.url);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create channel');
      }

      // Declare exchange
      await this.channel.assertExchange(BROKER_CONFIG.exchange, 'topic', { durable: true });

      // Declare queue for shot data
      await this.channel.assertQueue(BROKER_CONFIG.queues.shotData, { durable: true });
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

    console.log(`[BROKER] Published session stop: ${data.sessionId}`);
  }

  private async consumeShotData() {
    if (!this.channel) return;

    this.channel.consume(
      BROKER_CONFIG.queues.shotData,
      async (msg: any) => {
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
    const { sessionId, shotNumber, timestamp, targetPosition, landingPosition, velocity, detectionConfidence } =
      shotData;

    // Calculate accuracy
    const accuracyCm = calculateAccuracy(targetPosition, landingPosition);
    const accuracyPercent = calculateAccuracyPercent(accuracyCm);
    const courtZone = determineCourtZone(landingPosition);

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
      wasSuccessful: accuracyCm < 30,
      courtZone,
    });

    // Update session statistics
    const updatedSession = await sessionService.updateSessionStats(sessionId);

    // Broadcast shot data to WebSocket clients
    socketHandler.emitShotData(sessionId, shot);
    
    // Broadcast updated session stats to WebSocket clients
    socketHandler.emitSessionStats(sessionId, {
      total_shots: updatedSession.total_shots,
      successful_shots: updatedSession.successful_shots,
      average_accuracy_percent: updatedSession.average_accuracy_percent,
      average_shot_velocity_kmh: updatedSession.average_shot_velocity_kmh,
    });
  }
}

export const brokerService = new BrokerService();

