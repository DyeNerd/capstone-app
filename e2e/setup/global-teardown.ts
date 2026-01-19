import { DockerHelper } from '../helpers/docker.helper';

async function globalTeardown() {
  console.log('\n========================================');
  console.log('🧹 Starting E2E Test Environment Cleanup');
  console.log('========================================\n');

  const docker = new DockerHelper();

  try {
    // Stop and remove all containers, networks, and volumes
    console.log('Stopping Docker containers and removing volumes...');
    await docker.stopContainers();

    console.log('\n========================================');
    console.log('✅ E2E Test Environment Cleanup Complete!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ E2E Test Environment Cleanup Failed!');
    console.error('========================================\n');
    console.error('Error:', error);
    console.error('\nYou may need to manually clean up Docker containers:');
    console.error('  docker-compose -f docker-compose.test.yml down -v\n');
  }
}

export default globalTeardown;
