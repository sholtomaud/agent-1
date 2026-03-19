import { spawn } from 'node:child_process';

export class MCPClient {
  private proc: any;
  private id = 0;
  private pendingCalls = new Map<number, { resolve: (val: any) => void, reject: (err: any) => void, timeout: NodeJS.Timeout }>();
  private defaultTimeout: number;

  constructor(command: string, args: string[], defaultTimeout: number = 2000) {
    this.defaultTimeout = defaultTimeout;
    this.proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.proc.stdout.on('data', (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id !== undefined && this.pendingCalls.has(msg.id)) {
          const { resolve, timeout } = this.pendingCalls.get(msg.id)!;
          clearTimeout(timeout);
          this.pendingCalls.delete(msg.id);
          resolve(msg);
        }
      } catch (e) {
        // Log error parsing MCP response
      }
    });

    this.proc.stderr.on('data', (data: any) => {
      // Log MCP Tool error
    });
  }

  call(method: string, params: any): Promise<any> {
    const currentId = this.id++;

    return new Promise((resolve, reject) => {
      const msg = {
        jsonrpc: '2.0',
        id: currentId,
        method,
        params
      };

      const timeout = setTimeout(() => {
        this.pendingCalls.delete(currentId);
        reject(new Error('MCP call timed out'));
      }, this.defaultTimeout);

      this.pendingCalls.set(currentId, { resolve, reject, timeout });
      this.proc.stdin.write(JSON.stringify(msg));
    });
  }

  close() {
    this.proc.kill();
  }
}
