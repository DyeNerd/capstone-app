import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Athlete } from '../models/Athlete';
import { TrainingSession } from '../models/TrainingSession';
import { Shot } from '../models/Shot';
import { Rally } from '../models/Rally';
import { RallyEvent } from '../models/RallyEvent';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://badminton_user:badminton_pass@localhost:5432/badminton_training',
  synchronize: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Athlete, TrainingSession, Shot, Rally, RallyEvent],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

