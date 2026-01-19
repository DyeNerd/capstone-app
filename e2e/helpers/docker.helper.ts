import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

export class DockerHelper {
  private composeFile = 'docker-compose.test.yml';
  private projectDir: string;

  constructor() {
    this.projectDir = process.cwd();
  }

  async startContainers(): Promise<void> {
    console.log('Starting Docker containers...');
    try {
      const { stdout, stderr } = await execAsync(
        `docker-compose -f ${this.composeFile} up -d --build`,
        { cwd: this.projectDir }
      );
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✓ Docker containers started');
    } catch (error) {
      console.error('Failed to start Docker containers:', error);
      throw error;
    }
  }

  async stopContainers(): Promise<void> {
    console.log('Stopping Docker containers...');
    try {
      const { stdout, stderr } = await execAsync(
        `docker-compose -f ${this.composeFile} down -v`,
        { cwd: this.projectDir }
      );
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      console.log('✓ Docker containers stopped and volumes removed');
    } catch (error) {
      console.error('Failed to stop Docker containers:', error);
      throw error;
    }
  }

  async waitForHealthy(service: string, url: string, maxAttempts = 30): Promise<void> {
    console.log(`Waiting for ${service} to be healthy...`);

    // For HTTP services (RabbitMQ management, Backend API), use HTTP health check
    const isHttpService = url.includes('http');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (isHttpService) {
          // Use HTTP health check for services with HTTP endpoints
          await axios.get(url, { timeout: 3000 });
        } else {
          // For non-HTTP services (PostgreSQL, Redis), check Docker health status
          const isHealthy = await this.checkContainerHealth(service);
          if (!isHealthy) {
            throw new Error(`${service} not healthy yet`);
          }
        }
        console.log(`✓ ${service} is healthy`);
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          console.error(`✗ ${service} failed to become healthy after ${maxAttempts} attempts`);
          throw new Error(`${service} health check timeout`);
        }
        await this.sleep(2000);  // Wait 2 seconds between attempts
      }
    }
  }

  async checkContainerHealth(service: string): Promise<boolean> {
    try {
      // Map service names to container names
      const containerMap: Record<string, string> = {
        'PostgreSQL': 'postgres',
        'Redis': 'redis',
        'RabbitMQ': 'rabbitmq',
        'Backend API': 'api',
      };

      const containerService = containerMap[service] || service;

      const { stdout } = await execAsync(
        `docker-compose -f ${this.composeFile} ps ${containerService} --format json`,
        { cwd: this.projectDir }
      );

      if (!stdout) return false;

      // Parse JSON output and check health status
      const container = JSON.parse(stdout);
      const status = container.Health || container.State;

      return status === 'healthy' || (container.State === 'running' && !container.Health);
    } catch (error) {
      return false;
    }
  }

  async getContainerLogs(service: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `docker-compose -f ${this.composeFile} logs ${service}`,
        { cwd: this.projectDir }
      );
      return stdout;
    } catch (error) {
      console.error(`Failed to get logs for ${service}:`, error);
      return '';
    }
  }

  async checkContainerStatus(service: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker-compose -f ${this.composeFile} ps ${service}`,
        { cwd: this.projectDir }
      );
      return stdout.includes('Up') || stdout.includes('healthy');
    } catch (error) {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
