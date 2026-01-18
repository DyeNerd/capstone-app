export const BROKER_CONFIG = {
  url: process.env.RABBITMQ_URL || 'amqp://badminton:badminton123@localhost:5672',
  exchange: 'badminton_training',
  queues: {
    shotData: 'shot_data_queue',
    sessionControl: 'session_control_queue'
  },
  routingKeys: {
    sessionStart: 'session.start',
    sessionStop: 'session.stop',
    shotData: 'shot.data.*'
  }
};

