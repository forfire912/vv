/**
 * 测试执行引擎 - 负责实际执行测试用例和测试套件
 */

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  steps: TestStep[];
  expectedResults: string;
  associatedNodes: string[];
  topologySnapshot?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestStep {
  id: string;
  description: string;
  action: 'click' | 'input' | 'verify' | 'wait' | 'custom';
  target?: string;
  value?: string;
  expected?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestExecution {
  id: string;
  name: string;
  type: 'single' | 'suite';
  testCaseId?: string;
  testSuiteId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  results?: TestStepResult[];
  logs?: ExecutionLog[];
  error?: string;
}

export interface TestStepResult {
  stepId: string;
  stepName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
  actualResult?: string;
  expectedResult?: string;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: any;
}

export interface ExecutionContext {
  topology?: any;
  environment?: Record<string, any>;
  variables?: Record<string, any>;
}

export interface ExecutionEngine {
  executeTestCase(testCase: TestCase, context?: ExecutionContext): Promise<TestExecution>;
  executeTestSuite(testSuite: TestSuite, testCases: TestCase[], context?: ExecutionContext): Promise<TestExecution>;
  stopExecution(executionId: string): Promise<void>;
  getExecutionStatus(executionId: string): TestExecution | null;
}

class VlabTestExecutionEngine implements ExecutionEngine {
  private executions = new Map<string, TestExecution>();
  private executionControllers = new Map<string, AbortController>();
  private onExecutionUpdate?: (execution: TestExecution) => void;

  constructor(onExecutionUpdate?: (execution: TestExecution) => void) {
    this.onExecutionUpdate = onExecutionUpdate;
  }

  /**
   * 执行单个测试用例
   */
  async executeTestCase(testCase: TestCase, context?: ExecutionContext): Promise<TestExecution> {
    const execution: TestExecution = {
      id: Date.now().toString(),
      name: testCase.name,
      type: 'single',
      testCaseId: testCase.id,
      status: 'running',
      progress: 0,
      currentStep: '准备执行测试用例...',
      startTime: new Date(),
      results: [],
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: `开始执行测试用例: ${testCase.name}`
        }
      ]
    };

    this.executions.set(execution.id, execution);
    const controller = new AbortController();
    this.executionControllers.set(execution.id, controller);

    try {
      await this.runTestCaseSteps(execution, testCase, context, controller.signal);
      
      // 执行完成
      execution.status = 'completed';
      execution.progress = 100;
      execution.currentStep = '测试执行完成';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - (execution.startTime?.getTime() || 0);
      
      execution.logs?.push({
        timestamp: new Date(),
        level: 'info',
        message: `测试用例执行完成: ${testCase.name}`
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        execution.status = 'cancelled';
        execution.currentStep = '测试执行已取消';
      } else {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : String(error);
        execution.currentStep = '测试执行失败';
      }
      
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - (execution.startTime?.getTime() || 0);
      
      execution.logs?.push({
        timestamp: new Date(),
        level: 'error',
        message: `测试用例执行${execution.status === 'cancelled' ? '取消' : '失败'}: ${execution.error || '未知错误'}`
      });
    } finally {
      this.executionControllers.delete(execution.id);
      this.updateExecution(execution);
    }

    return execution;
  }

  /**
   * 执行测试套件
   */
  async executeTestSuite(testSuite: TestSuite, testCases: TestCase[], context?: ExecutionContext): Promise<TestExecution> {
    const execution: TestExecution = {
      id: Date.now().toString(),
      name: testSuite.name,
      type: 'suite',
      testSuiteId: testSuite.id,
      status: 'running',
      progress: 0,
      currentStep: '准备执行测试套件...',
      startTime: new Date(),
      results: [],
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: `开始执行测试套件: ${testSuite.name}`
        }
      ]
    };

    this.executions.set(execution.id, execution);
    const controller = new AbortController();
    this.executionControllers.set(execution.id, controller);

    try {
      const suiteCases = testCases.filter(tc => testSuite.testCases.includes(tc.id));
      const totalSteps = suiteCases.reduce((sum, tc) => sum + tc.steps.length, 0);
      let completedSteps = 0;

      for (let i = 0; i < suiteCases.length; i++) {
        if (controller.signal.aborted) {
          throw new Error('测试套件执行被取消');
        }

        const testCase = suiteCases[i];
        execution.currentStep = `执行测试用例: ${testCase.name} (${i + 1}/${suiteCases.length})`;
        this.updateExecution(execution);

        // 执行测试用例的所有步骤
        for (const step of testCase.steps) {
          if (controller.signal.aborted) {
            throw new Error('测试套件执行被取消');
          }

          const stepResult = await this.executeStep(step, testCase, context, controller.signal);
          execution.results?.push(stepResult);
          
          completedSteps++;
          execution.progress = (completedSteps / totalSteps) * 100;
          this.updateExecution(execution);
        }

        execution.logs?.push({
          timestamp: new Date(),
          level: 'info',
          message: `测试用例完成: ${testCase.name}`
        });
      }

      // 套件执行完成
      execution.status = 'completed';
      execution.progress = 100;
      execution.currentStep = '测试套件执行完成';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - (execution.startTime?.getTime() || 0);
      
      execution.logs?.push({
        timestamp: new Date(),
        level: 'info',
        message: `测试套件执行完成: ${testSuite.name}`
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        execution.status = 'cancelled';
        execution.currentStep = '测试套件执行已取消';
      } else {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : String(error);
        execution.currentStep = '测试套件执行失败';
      }
      
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - (execution.startTime?.getTime() || 0);
      
      execution.logs?.push({
        timestamp: new Date(),
        level: 'error',
        message: `测试套件执行${execution.status === 'cancelled' ? '取消' : '失败'}: ${execution.error || '未知错误'}`
      });
    } finally {
      this.executionControllers.delete(execution.id);
      this.updateExecution(execution);
    }

    return execution;
  }

  /**
   * 停止测试执行
   */
  async stopExecution(executionId: string): Promise<void> {
    const controller = this.executionControllers.get(executionId);
    if (controller) {
      controller.abort();
    }

    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.currentStep = '测试执行已停止';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - (execution.startTime?.getTime() || 0);
      
      execution.logs?.push({
        timestamp: new Date(),
        level: 'warn',
        message: '测试执行被用户停止'
      });

      this.updateExecution(execution);
    }
  }

  /**
   * 获取执行状态
   */
  getExecutionStatus(executionId: string): TestExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * 获取所有执行记录
   */
  getAllExecutions(): TestExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * 运行测试用例步骤
   */
  private async runTestCaseSteps(
    execution: TestExecution, 
    testCase: TestCase, 
    context?: ExecutionContext,
    signal?: AbortSignal
  ): Promise<void> {
    const totalSteps = testCase.steps.length;
    
    for (let i = 0; i < testCase.steps.length; i++) {
      if (signal?.aborted) {
        throw new Error('测试执行被取消');
      }

      const step = testCase.steps[i];
      execution.currentStep = `执行步骤 ${i + 1}/${totalSteps}: ${step.description}`;
      execution.progress = (i / totalSteps) * 100;
      this.updateExecution(execution);

      const stepResult = await this.executeStep(step, testCase, context, signal);
      execution.results?.push(stepResult);
      
      execution.logs?.push({
        timestamp: new Date(),
        level: stepResult.status === 'passed' ? 'info' : 'error',
        message: `步骤${stepResult.status === 'passed' ? '通过' : '失败'}: ${step.description}`,
        details: stepResult
      });
    }
  }

  /**
   * 执行单个测试步骤
   */
  private async executeStep(
    step: TestStep, 
    testCase: TestCase, 
    context?: ExecutionContext,
    signal?: AbortSignal
  ): Promise<TestStepResult> {
    const startTime = Date.now();
    
    try {
      if (signal?.aborted) {
        throw new Error('步骤执行被取消');
      }

      // 模拟步骤执行时间
      await this.delay(500 + Math.random() * 1500);

      // 模拟步骤执行逻辑
      const result = await this.simulateStepExecution(step, context);
      
      const duration = Date.now() - startTime;
      
      return {
        stepId: step.id,
        stepName: step.description,
        status: result.success ? 'passed' : 'failed',
        duration,
        actualResult: result.actualResult,
        expectedResult: step.expected,
        error: result.error
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        stepId: step.id,
        stepName: step.description,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error),
        expectedResult: step.expected
      };
    }
  }

  /**
   * 模拟步骤执行
   */
  private async simulateStepExecution(step: TestStep, context?: ExecutionContext): Promise<{
    success: boolean;
    actualResult?: string;
    error?: string;
  }> {
    // 模拟不同类型的步骤执行
    switch (step.action) {
      case 'click':
        if (step.target) {
          return {
            success: Math.random() > 0.1, // 90% 成功率
            actualResult: `点击了元素: ${step.target}`
          };
        }
        return {
          success: false,
          error: '未指定点击目标'
        };

      case 'input':
        if (step.target && step.value) {
          return {
            success: Math.random() > 0.05, // 95% 成功率
            actualResult: `在 ${step.target} 中输入了: ${step.value}`
          };
        }
        return {
          success: false,
          error: '未指定输入目标或值'
        };

      case 'verify':
        if (step.target && step.expected) {
          const success = Math.random() > 0.2; // 80% 成功率
          return {
            success,
            actualResult: success ? step.expected : '验证失败',
            error: success ? undefined : `期望 "${step.expected}"，但实际结果不匹配`
          };
        }
        return {
          success: false,
          error: '未指定验证目标或期望值'
        };

      case 'wait':
        const waitTime = parseInt(step.value || '1000');
        await this.delay(waitTime);
        return {
          success: true,
          actualResult: `等待了 ${waitTime}ms`
        };

      case 'custom':
        // 自定义步骤逻辑
        return {
          success: Math.random() > 0.15, // 85% 成功率
          actualResult: `执行了自定义操作: ${step.description}`
        };

      default:
        return {
          success: false,
          error: `不支持的操作类型: ${step.action}`
        };
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新执行状态
   */
  private updateExecution(execution: TestExecution): void {
    this.executions.set(execution.id, execution);
    if (this.onExecutionUpdate) {
      this.onExecutionUpdate(execution);
    }
  }
}

// 导出执行引擎实例
export const testExecutionEngine = new VlabTestExecutionEngine();

// 导出执行引擎类
export { VlabTestExecutionEngine };
