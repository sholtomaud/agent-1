import { execSync } from 'node:child_process';
import { z } from 'zod';
import path from 'node:path';

export const TestRunnerArgsSchema = z.object({
  testPath: z.string(),
  args: z.array(z.string()).optional(),
});

export class TestRunnerTool {
  async execute(args: z.infer<typeof TestRunnerArgsSchema>): Promise<any> {
    const { testPath } = args;

    // We translate the virtual path to the real path for the child process.
    // VFSTool mounts /sandbox to .agent_sandbox.
    const realRoot = path.join(process.cwd(), '.agent_sandbox');
    const relativePath = testPath.startsWith('/sandbox/') ? testPath.slice(9) : testPath;
    const realPath = path.join(realRoot, relativePath);

    const command = `node --experimental-strip-types --test ${realPath}`;

    try {
      const stdout = execSync(command, {
        env: { ...process.env, NODE_TEST_CONTEXT: undefined },
        encoding: 'utf8'
      });
      return {
        success: true,
        stdout,
        stderr: '',
      };
    } catch (error: any) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        error: error.message,
      };
    }
  }
}
