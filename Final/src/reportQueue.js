// Educational stand-in for RabbitMQ, Redis/BullMQ, SQS, or Kafka.
// It is intentionally in-process and not durable: queued messages are lost when Node stops.
class ReportQueue {
  constructor() {
    this.messages = [];
    this.processor = null;
    this.processing = false;
  }

  async send(message) {
    this.messages.push(message);
    void this.drain();
  }

  process(handler) {
    this.processor = handler;
    void this.drain();
  }

  async drain() {
    if (this.processing || !this.processor) return;
    this.processing = true;
    try {
      while (this.messages.length > 0) {
        const message = this.messages.shift();
        try {
          await this.processor(message);
        } catch (error) {
          // A failed message must not take down the HTTP server or block later work.
          console.error('Report queue processor failed:', error.message);
        }
      }
    } finally {
      this.processing = false;
      if (this.messages.length > 0) void this.drain();
    }
  }
}

export const reportQueue = new ReportQueue();
export { ReportQueue };
