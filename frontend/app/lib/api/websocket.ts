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
          console.log(`🔥 [WebSocket] Raw message received:`, {
            workflowId: this.workflowId,
            rawData: event.data,
            timestamp: new Date().toISOString(),
          });

          try {
            const message = JSON.parse(event.data);
            console.log(`📦 [WebSocket] Parsed message:`, {
              workflowId: this.workflowId,
              message,
              eventType: message.event,
              data: message.data,
              timestamp: new Date().toISOString(),
            });

            const { event: eventType, data } = message;

            // Call all event handlers registered for this event type
            if (this.messageHandlers[eventType]) {
              console.log(
                `🎯 [WebSocket] Calling ${this.messageHandlers[eventType].length} handlers for event: ${eventType}`
              );
              this.messageHandlers[eventType].forEach((handler, index) => {
                console.log(
                  `🔧 [WebSocket] Calling handler ${index} for event: ${eventType}`
                );
                handler(data);
              });
            } else {
              console.warn(
                `⚠️ [WebSocket] No handlers registered for event: ${eventType}`
              );
            }

            // Call general message handlers
            if (this.messageHandlers['message']) {
              console.log(
                `📢 [WebSocket] Calling ${this.messageHandlers['message'].length} general message handlers`
              );
              this.messageHandlers['message'].forEach((handler, index) => {
                console.log(`🔧 [WebSocket] Calling general handler ${index}`);
                handler(message);
              });
            } else {
              console.warn(
                `⚠️ [WebSocket] No general message handlers registered`
              );
            }
          } catch (error) {
            console.error('❌ [WebSocket] Error parsing WebSocket message:', {
              error,
              rawData: event.data,
              workflowId: this.workflowId,
            });
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
    console.log(`🎧 [WebSocket] Registering handler for event: ${event}`, {
      workflowId: this.workflowId,
      currentHandlerCount: this.messageHandlers[event]?.length || 0,
    });

    if (!this.messageHandlers[event]) {
      this.messageHandlers[event] = [];
    }
    this.messageHandlers[event].push(handler);

    console.log(`✅ [WebSocket] Handler registered for event: ${event}`, {
      workflowId: this.workflowId,
      totalHandlers: this.messageHandlers[event].length,
      allRegisteredEvents: Object.keys(this.messageHandlers),
    });

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
