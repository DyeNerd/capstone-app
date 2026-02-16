import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

interface CVMockOptions {
  count?: number;
  interval?: number;
  template?: string;  // Template ID for 100% accurate shots (e.g., 'template-001')
}

export class CVMockHelper {
  private scriptPath: string;

  constructor() {
    // Path to mock_cv_component.py in backend scripts
    this.scriptPath = path.resolve(
      __dirname,
      '../../badminton-backend/scripts/mock_cv_component.py'
    );
  }

  /**
   * Send multiple shots to a training session
   * @param sessionId - The session ID to send shots to
   * @param options - count: number of shots, interval: ms between shots, template: template ID for 100% accuracy
   */
  async sendShots(
    sessionId: string,
    options: CVMockOptions = {}
  ): Promise<void> {
    const { count = 10, interval = 100, template } = options;

    console.log(
      `Starting CV mock: ${count} shots with ${interval}ms interval for session ${sessionId}`
    );
    if (template) {
      console.log(`Using template: ${template} (100% accurate shots on target dots)`);
    }

    // Get RabbitMQ URL from environment (for E2E tests)
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://badminton:badminton123@localhost:5672';
    console.log(`Using RabbitMQ URL: ${rabbitmqUrl}`);

    // Build command arguments
    const args = [
      this.scriptPath,
      sessionId,
      '--count',
      String(count),
      '--interval-ms',
      String(interval),
    ];

    // Add template argument if specified
    if (template) {
      args.push('--template', template);
    }

    return new Promise<void>((resolve, reject) => {
      const python: ChildProcess = spawn('python3', args, {
        env: {
          ...process.env,
          RABBITMQ_URL: rabbitmqUrl,
        },
      });

      let stdout = '';
      let stderr = '';

      python.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`CV Mock: ${output.trim()}`);
      });

      python.stderr?.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        console.error(`CV Mock Error: ${error.trim()}`);
      });

      python.on('close', (code) => {
        if (code === 0) {
          console.log(`✓ CV mock completed successfully (${count} shots sent)`);
          resolve();
        } else {
          console.error(`✗ CV mock failed with exit code ${code}`);
          console.error('STDOUT:', stdout);
          console.error('STDERR:', stderr);
          reject(
            new Error(
              `Python script exited with code ${code}\nSTDERR: ${stderr}`
            )
          );
        }
      });

      python.on('error', (error) => {
        console.error('✗ Failed to spawn Python process:', error);
        reject(error);
      });
    });
  }

  /**
   * Send a custom number of shots synchronously (waits for completion)
   */
  async sendShotsSync(sessionId: string, count: number): Promise<void> {
    return this.sendShots(sessionId, { count, interval: 100 });
  }

  /**
   * Send shots quickly for fast testing (10ms intervals)
   */
  async sendShotsFast(sessionId: string, count: number): Promise<void> {
    return this.sendShots(sessionId, { count, interval: 10 });
  }

  /**
   * Send 100% accurate shots using template-001
   * All shots land exactly on target dots for perfect accuracy and in-box rate
   */
  async sendAccurateShots(
    sessionId: string,
    count: number,
    interval: number = 50
  ): Promise<void> {
    return this.sendShots(sessionId, {
      count,
      interval,
      template: 'template-001',
    });
  }

  /**
   * Send a single shot
   */
  async sendSingleShot(sessionId: string): Promise<void> {
    return this.sendShots(sessionId, { count: 1, interval: 0 });
  }

  /**
   * Verify the Python script exists
   */
  async verifyScriptExists(): Promise<boolean> {
    const fs = require('fs');
    return fs.existsSync(this.scriptPath);
  }
}
