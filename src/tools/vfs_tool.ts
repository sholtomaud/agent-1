import { create, RealFSProvider } from '@platformatic/vfs';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

export const VFSArgsSchema = z.object({
  action: z.enum(['readFile', 'writeFile', 'readdir', 'mkdir', 'unlink', 'exists']),
  path: z.string(),
  content: z.string().optional(),
});

export class VFSTool {
  private vfs: any;
  private root: string;

  constructor(mountPath: string = '/sandbox') {
    // We use a temporary real directory to allow child processes (TestRunner) to see the files,
    // but we use RealFSProvider to sandbox the agent's access.
    this.root = path.join(process.cwd(), '.agent_sandbox');
    if (!fs.existsSync(this.root)) {
      fs.mkdirSync(this.root, { recursive: true });
    }

    const provider = new RealFSProvider(this.root);
    this.vfs = create(provider, {
      overlay: true,
      virtualCwd: true,
    });
    this.vfs.mount(mountPath);
  }

  async execute(args: z.infer<typeof VFSArgsSchema>): Promise<any> {
    const { action, path: filePath, content } = args;

    try {
      switch (action) {
        case 'readFile':
          return await this.vfs.promises.readFile(filePath, 'utf8');
        case 'writeFile':
          await this.vfs.promises.writeFile(filePath, content || '');
          return { success: true };
        case 'readdir':
          return await this.vfs.promises.readdir(filePath);
        case 'mkdir':
          await this.vfs.promises.mkdir(filePath, { recursive: true });
          return { success: true };
        case 'unlink':
          await this.vfs.promises.unlink(filePath);
          return { success: true };
        case 'exists':
          return this.vfs.existsSync(filePath);
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  close() {
    this.vfs.unmount();
    // We might NOT want to delete everything immediately if the user wants to see it,
    // but for "sandbox" it might be expected.
  }
}
