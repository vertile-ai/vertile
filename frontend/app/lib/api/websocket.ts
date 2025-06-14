/**
 * WebSocket API utility for workflow execution
 */

export class WorkflowWebSocket {
  private socket: WebSocket | null = null;
  private messageHandlers: Record<string, ((data: any) => void)[]> = {};
  private workflowId: string;
  private url: string;

  constructor(workflowId: string) {
    this.workflowId = workflowId;

    // Determine WebSocket URL based on environment
    const protocol = window?.location?.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = new URL(process.env.PYTHON_URL || 'http://localhost:8031');
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
        this.socket.onopen = () => {
          console.log(`✅ [WebSocket] Connected to ${this.url}`);
          resolve(this.socket!);
        };

        // Set up message handler to route to custom event system
        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log(`📨 [WebSocket] Message received:`, message);

            // Route to specific event handlers
            if (message.event && this.messageHandlers[message.event]) {
              this.messageHandlers[message.event].forEach((handler) => {
                handler(message.data);
              });
            }

            // Also emit 'message' event for raw message handling
            if (this.messageHandlers['message']) {
              this.messageHandlers['message'].forEach((handler) => {
                handler(message);
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error(`❌ [WebSocket] Connection error:`, error);
          if (this.messageHandlers['error']) {
            this.messageHandlers['error'].forEach((handler) => {
              handler(error);
            });
          }
          reject(error);
        };

        this.socket.onclose = () => {
          console.log(`🔌 [WebSocket] Connection closed`);
          this.socket = null;
        };

        // Set a timeout for connection
        setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            this.socket.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  on(event: string, handler: (data: any) => void) {
    console.log(`🎧 [WebSocket] Registering handler for event: ${event}`, {
      workflowId: this.workflowId,
      currentHandlerCount: this.messageHandlers[event]?.length || 0,
    });

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
