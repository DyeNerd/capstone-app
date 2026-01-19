import { Page } from '@playwright/test';

interface SocketEvent {
  eventName: string;
  data: unknown;
  timestamp: number;
}

export class WebSocketHelper {
  /**
   * Setup Socket.IO event tracking in the browser context
   * This injects code to capture all socket events
   */
  async setupSocketListener(page: Page): Promise<void> {
    await page.addInitScript(() => {
      // Create a global array to store socket events
      (window as any).socketEvents = [] as any[];

      // Wait for socket.io to be available
      const checkSocketIO = setInterval(() => {
        if ((window as any).io && (window as any).io.Socket) {
          clearInterval(checkSocketIO);

          // Store original emit and on methods
          const originalOn = (window as any).io.Socket.prototype.on;
          const originalEmit = (window as any).io.Socket.prototype.emit;

          // Override socket.on() to capture incoming events
          (window as any).io.Socket.prototype.on = function(eventName: string, callback: Function) {
            const wrappedCallback = function(...args: any[]) {
              // Capture event
              (window as any).socketEvents.push({
                type: 'received',
                eventName,
                data: args[0],
                timestamp: Date.now(),
              });
              // Call original callback
              return callback.apply(this, args);
            };
            return originalOn.call(this, eventName, wrappedCallback);
          };

          // Override socket.emit() to capture outgoing events
          (window as any).io.Socket.prototype.emit = function(eventName: string, ...args: any[]) {
            // Capture event
            (window as any).socketEvents.push({
              type: 'sent',
              eventName,
              data: args[0],
              timestamp: Date.now(),
            });
            // Call original emit
            return originalEmit.apply(this, [eventName, ...args]);
          };
        }
      }, 100);

      // Clear check after 10 seconds if socket.io not found
      setTimeout(() => clearInterval(checkSocketIO), 10000);
    });

    console.log('✓ WebSocket event tracking initialized');
  }

  /**
   * Wait for a specific socket event to be received
   */
  async waitForEvent(
    page: Page,
    eventName: string,
    timeout = 5000
  ): Promise<SocketEvent | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const events = await this.getSocketEvents(page);
      const event = events.find(
        (e) => e.eventName === eventName && e.type === 'received'
      );

      if (event) {
        console.log(`✓ Received socket event: ${eventName}`);
        return event;
      }

      // Wait 100ms before checking again
      await page.waitForTimeout(100);
    }

    console.warn(`✗ Timeout waiting for socket event: ${eventName}`);
    return null;
  }

  /**
   * Wait for multiple events of the same type
   */
  async waitForEvents(
    page: Page,
    eventName: string,
    count: number,
    timeout = 10000
  ): Promise<SocketEvent[]> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const events = await this.getSocketEvents(page);
      const matchingEvents = events.filter(
        (e) => e.eventName === eventName && e.type === 'received'
      );

      if (matchingEvents.length >= count) {
        console.log(`✓ Received ${count} ${eventName} events`);
        return matchingEvents.slice(0, count);
      }

      // Wait 100ms before checking again
      await page.waitForTimeout(100);
    }

    const currentEvents = await this.getSocketEvents(page);
    const currentCount = currentEvents.filter(
      (e) => e.eventName === eventName && e.type === 'received'
    ).length;

    console.warn(
      `✗ Timeout waiting for ${count} ${eventName} events (got ${currentCount})`
    );
    return [];
  }

  /**
   * Get all captured socket events
   */
  async getSocketEvents(page: Page): Promise<SocketEvent[]> {
    const events = await page.evaluate(() => {
      return (window as any).socketEvents || [];
    });
    return events;
  }

  /**
   * Get events of a specific type
   */
  async getEventsByName(page: Page, eventName: string): Promise<SocketEvent[]> {
    const allEvents = await this.getSocketEvents(page);
    return allEvents.filter((e) => e.eventName === eventName);
  }

  /**
   * Clear all captured events
   */
  async clearEvents(page: Page): Promise<void> {
    await page.evaluate(() => {
      (window as any).socketEvents = [];
    });
    console.log('✓ Socket events cleared');
  }

  /**
   * Get event count for a specific event name
   */
  async getEventCount(page: Page, eventName: string): Promise<number> {
    const events = await this.getEventsByName(page, eventName);
    return events.length;
  }

  /**
   * Check if a specific event was received
   */
  async hasReceivedEvent(page: Page, eventName: string): Promise<boolean> {
    const count = await this.getEventCount(page, eventName);
    return count > 0;
  }
}
