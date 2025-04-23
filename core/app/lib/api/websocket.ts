/**
 * WebSocket API utility for workflow execution
 */

export class WorkflowWebSocket {
  private socket: WebSocket | null = null;
  private messageHandlers: Record<string, ((data: any) => void)[]> = {};
  private workflowId: string;
  private url: string;
  private autoReconnect: boolean;
  private reconnectInterval: number = 3000; // 3 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(workflowId: string, options?: { autoReconnect?: boolean }) {
    this.workflowId = workflowId;
    this.autoReconnect = options?.autoReconnect ?? true;

    // Determine WebSocket URL based on environment
    const protocol = window?.location?.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = new URL(process.env.PYCORE_URL || 'http://localhost:8000');
    this.url = `${protocol}//${host.host}/ws/workflow/${workflowId}`;
  }

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.socket) {
          this.socket.close();
        }

        // Create new WebSocket connection
        console.log(`Connecting to ${this.url}`);
        this.socket = new WebSocket(this.url);

        // Set up event handlers
        this.socket.onopen = () => {
          console.log(`WebSocket connected for workflow ${this.workflowId}`);
          this.reconnectAttempts = 0;
          resolve(this.socket!);
        };

        this.socket.onclose = (event) => {
          console.log(
            `WebSocket disconnected for workflow ${this.workflowId}:`,
            event
          );
          this.socket = null;

          if (
            this.autoReconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.reconnectTimer = setTimeout(() => {
              this.reconnectAttempts++;
              console.log(
                `Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
              );
              this.connect().catch((err) => {
                console.error('Reconnection failed:', err);
              });
            }, this.reconnectInterval);
          }
        };

        this.socket.onerror = (error) => {
          console.error(
            `WebSocket error for workflow ${this.workflowId}:`,
            error
          );
          reject(error);
        };

        // Handle incoming messages
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { event: eventType, data } = message;

            // Call all event handlers registered for this event type
            if (this.messageHandlers[eventType]) {
              this.messageHandlers[eventType].forEach((handler) =>
                handler(data)
              );
            }

            // Call general message handlers
            if (this.messageHandlers['message']) {
              this.messageHandlers['message'].forEach((handler) =>
                handler(message)
              );
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.messageHandlers[event]) {
      this.messageHandlers[event] = [];
    }
    this.messageHandlers[event].push(handler);

    // Return a function to remove this handler
    return () => {
      this.messageHandlers[event] = this.messageHandlers[event].filter(
        (h) => h !== handler
      );
    };
  }

  off(event: string, handler: (data: any) => void) {
    if (this.messageHandlers[event]) {
      this.messageHandlers[event] = this.messageHandlers[event].filter(
        (h) => h !== handler
      );
    }
  }

  send(eventType: string, data: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    console.log(`Sending message: ${eventType}`, data);
    const message = JSON.stringify({
      event: eventType,
      data,
    });

    this.socket.send(message);
  }

  executeWorkflow(nodes: any[], edges: any[]) {
    this.send('execute-workflow', {
      workflow_id: this.workflowId,
      nodes,
      edges,
    });
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}
