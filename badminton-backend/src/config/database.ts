import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Athlete } from '../models/Athlete';
import { TrainingSession } from '../models/TrainingSession';
import { Shot } from '../models/Shot';
import { Rally } from '../models/Rally';
import { RallyEvent } from '../models/RallyEvent';

const entities = [User, Athlete, TrainingSession, Shot, Rally, RallyEvent];

function createDataSource(): DataSource {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://badminton_user:badminton_pass@localhost:5432/badminton_training';
  const isProduction = process.env.NODE_ENV === 'production';

  return new DataSource({
    type: 'postgres',
    url: dbUrl,
    synchronize: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    logging: process.env.NODE_ENV === 'development',
    entities,
    migrations: [],
    subscribers: [],
    ...(isProduction && { ssl: { rejectUnauthorized: false } }),
  });
}

// Eager init for backward compatibility (tests mock this)
export let AppDataSource: DataSource = createDataSource();

export const initializeDatabase = async () => {
  try {
    // Re-create DataSource so it picks up env vars that may have loaded after module init
    AppDataSource = createDataSource();
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
