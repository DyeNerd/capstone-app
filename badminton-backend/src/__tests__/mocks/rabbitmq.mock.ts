export const mockRabbitMQChannel = {
  assertExchange: jest.fn().mockResolvedValue(undefined),
  assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
  bindQueue: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockReturnValue(true),
  consume: jest.fn().mockResolvedValue({ consumerTag: 'test-consumer' }),
  ack: jest.fn(),
  nack: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
};

export const mockRabbitMQConnection = {
  createChannel: jest.fn().mockResolvedValue(mockRabbitMQChannel),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

export const mockAmqplib = {
  connect: jest.fn().mockResolvedValue(mockRabbitMQConnection),
};

export const createMockRabbitMQService = () => ({
  publishSessionStart: jest.fn().mockResolvedValue(undefined),
  publishSessionStop: jest.fn().mockResolvedValue(undefined),
  startShotDataConsumer: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});
