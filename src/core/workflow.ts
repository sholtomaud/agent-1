import { AgentRuntime } from './runtime.ts';

export type TDDPhase =
  | 'Decompose'
  | 'DefineTests'
  | 'DefineCode'
  | 'RunTests'
  | 'CheckErrors'
  | 'FixResearch'
  | 'Complete';

export const TDDPhase = {
  Decompose: 'Decompose' as TDDPhase,
  DefineTests: 'DefineTests' as TDDPhase,
  DefineCode: 'DefineCode' as TDDPhase,
  RunTests: 'RunTests' as TDDPhase,
  CheckErrors: 'CheckErrors' as TDDPhase,
  FixResearch: 'FixResearch' as TDDPhase,
  Complete: 'Complete' as TDDPhase,
};

export interface TDDMetadata {
  issue_id: string;
  feature_name: string;
}

export class TDDWorkflow {
  private runtime: AgentRuntime;
  private currentPhase: TDDPhase = TDDPhase.Decompose;
  private metadata: TDDMetadata;

  constructor(runtime: AgentRuntime, metadata: TDDMetadata) {
    this.runtime = runtime;
    this.metadata = metadata;
  }

  async run(task: string): Promise<string> {
    let resultSummary: any = {};
    let phaseCount = 0;
    const maxPhases = 20; // Safety break

    while (this.currentPhase !== TDDPhase.Complete && phaseCount < maxPhases) {
      console.log(`--- Starting Phase: ${this.currentPhase} ---`);

      const phasePrompt = this.getPhasePrompt(this.currentPhase, task, resultSummary);
      const phaseResult = await this.runtime.run(phasePrompt);

      // Record phase result in audit log (AgentRuntime logs tool calls, but here we log phase completion)
      this.runtime.auditLog.log(phaseCount, 'phase_complete', phaseResult, {
        phase: this.currentPhase,
        issue_id: this.metadata.issue_id,
        feature_name: this.metadata.feature_name,
        phase_result: phaseResult
      });

      resultSummary[this.currentPhase] = phaseResult;

      this.currentPhase = this.transition(this.currentPhase, phaseResult);
      phaseCount++;
    }

    return `TDD Workflow Complete. Result Summary: ${JSON.stringify(resultSummary)}`;
  }

  private transition(current: TDDPhase, result: string): TDDPhase {
    switch (current) {
      case TDDPhase.Decompose:
        return TDDPhase.DefineTests;
      case TDDPhase.DefineTests:
        return TDDPhase.DefineCode;
      case TDDPhase.DefineCode:
        return TDDPhase.RunTests;
      case TDDPhase.RunTests:
        if (result.toLowerCase().includes('failed') || result.toLowerCase().includes('error')) {
          return TDDPhase.CheckErrors;
        }
        return TDDPhase.Complete;
      case TDDPhase.CheckErrors:
        return TDDPhase.FixResearch;
      case TDDPhase.FixResearch:
        return TDDPhase.DefineCode; // Loop back
      default:
        return TDDPhase.Complete;
    }
  }

  private getPhasePrompt(phase: TDDPhase, task: string, history: any): string {
    const context = JSON.stringify(history);
    switch (phase) {
      case TDDPhase.Decompose:
        return `Task: ${task}\nPhase: Decompose. Please break down the task into smaller sub-tasks.`;
      case TDDPhase.DefineTests:
        return `Context: ${context}\nPhase: Define Tests. Based on the decomposition, write test cases using node:test. Use the vfs_tool to write them to disk.`;
      case TDDPhase.DefineCode:
        return `Context: ${context}\nPhase: Define Code. Implement the functionality to pass the defined tests. Use vfs_tool to write the code.`;
      case TDDPhase.RunTests:
        return `Context: ${context}\nPhase: Run Tests. Use the test_runner_tool to run the defined tests. Report the output.`;
      case TDDPhase.CheckErrors:
        return `Context: ${context}\nPhase: Check Errors. Analyze the test failure output. Identify why it failed.`;
      case TDDPhase.FixResearch:
        return `Context: ${context}\nPhase: Fix/Research. Formulate a plan to fix the error. Research if needed (internal knowledge).`;
      default:
        return `Unknown phase.`;
    }
  }
}
