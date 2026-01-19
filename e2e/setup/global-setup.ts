import { DockerHelper } from '../helpers/docker.helper';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

async function globalSetup() {
  console.log('\n========================================');
  console.log('🚀 Starting E2E Test Environment Setup');
  console.log('========================================\n');

  const docker = new DockerHelper();

  try {
    // Step 1: Start Docker containers
    console.log('Step 1: Starting Docker containers...');
    await docker.startContainers();
    console.log('');

    // Step 2: Wait for PostgreSQL
    console.log('Step 2: Waiting for PostgreSQL...');
    await docker.waitForHealthy(
      'PostgreSQL',
      'postgres',  // Use Docker health check, not HTTP
      30
    ).catch(() => {
      // Fallback: Just wait a bit if health check fails
      console.log('PostgreSQL health check timeout, waiting 10s...');
      return new Promise(resolve => setTimeout(resolve, 10000));
    });
    console.log('');

    // Step 3: Wait for Redis
    console.log('Step 3: Waiting for Redis...');
    await docker.waitForHealthy(
      'Redis',
      'redis',  // Use Docker health check, not HTTP
      30
    ).catch(() => {
      console.log('Redis health check timeout, waiting 5s...');
      return new Promise(resolve => setTimeout(resolve, 5000));
    });
    console.log('');

    // Step 4: Wait for RabbitMQ
    console.log('Step 4: Waiting for RabbitMQ...');
    await docker.waitForHealthy(
      'RabbitMQ',
      'http://localhost:15673',
      30
    );
    console.log('');

    // Step 5: Wait for Backend API
    console.log('Step 5: Waiting for Backend API...');
    await docker.waitForHealthy(
      'Backend API',
      'http://localhost:5001/health',
      45  // API takes longer to start
    );
    console.log('');

    console.log('========================================');
    console.log('✅ E2E Test Environment Ready!');
    console.log('========================================\n');
    console.log('Services running:');
    console.log('  - PostgreSQL: localhost:5433');
    console.log('  - Redis: localhost:6380');
    console.log('  - RabbitMQ: localhost:5673 (Management: localhost:15673)');
    console.log('  - Backend API: localhost:5001');
    console.log('  - Frontend will start on: localhost:3001\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ E2E Test Environment Setup Failed!');
    console.error('========================================\n');
    console.error('Error:', error);

    // Try to get container logs for debugging
    console.log('\nFetching container logs for debugging...\n');
    try {
      const apiLogs = await docker.getContainerLogs('api');
      if (apiLogs) {
        console.log('--- Backend API Logs ---');
        console.log(apiLogs.slice(-2000));  // Last 2000 characters
      }
    } catch (logError) {
      console.error('Could not fetch logs:', logError);
    }

    // Clean up on failure
    console.log('\nCleaning up containers...');
    await docker.stopContainers().catch(() => {});

    throw error;
  }
}

export default globalSetup;
