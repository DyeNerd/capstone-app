import { createClient } from 'redis';

export let redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

export const initializeRedis = async () => {
  try {
    // Re-create client so it picks up env vars that may have loaded after module init
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    redisClient.on('error', (err: Error) => console.error('❌ Redis Client Error', err));
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
};
