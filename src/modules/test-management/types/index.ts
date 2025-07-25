/**
 * 测试管理模块核心类型定义
 * 集成版本 - 与VlabViewer拓扑系统深度集成
 */

import { TopologyNode, TopologyConnection } from '../../../types/topology';

// ===== 基础测试用例类型 =====
export interface TestCase {
  // 基本信息
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  
  // VlabViewer集成信息
  associatedNodes: string[];                    // 关联的拓扑节点ID
  functionTreePath: string;                     // 功能树路径
  topologySnapshot?: TopologySnapshot;          // 拓扑快照
  requirements: string[];                       // 需求ID
  
  // 测试配置
  testConfiguration: {
    topology: TopologyReference;               // 拓扑引用
    stimuli: StimulusReference[];             // 激励引用
    environment: TestEnvironment;             // 测试环境
    expectedResults: ExpectedResults;         // 预期结果
  };
  
  // 执行信息
  execution: {
    status: TestExecutionStatus;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    attempts: number;
    lastExecutedBy?: string;
  };
  
  // 结果数据
  results?: TestResult;
  
  // 元数据
  metadata: {
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    version: string;
  };
}

// ===== 测试套件类型 =====
export interface TestSuite {
  // 基本信息
  id: string;
  name: string;
  description: string;
  
  // 层次结构
  parentId?: string;
  testCases: string[];                          // 测试用例ID列表
  subSuites: string[];                          // 子套件ID列表
  
  // VlabViewer集成
  functionTreeNodeId?: string;                  // 对应的功能树节点ID
  associatedTopologyNodes: string[];            // 关联的拓扑节点
  
  // 执行配置
  executionConfig: {
    parallel: boolean;                          // 并行执行
    timeout: number;                            // 套件超时(秒)
    setupScript?: string;                       // 前置脚本
    teardownScript?: string;                    // 清理脚本
    continueOnFailure: boolean;                 // 失败时是否继续
  };
  
  // 报告配置
  reportConfig: {
    formats: ReportFormat[];
    includeDetails: boolean;
    includeScreenshots: boolean;
    includeCoverage: boolean;
  };
  
  // 元数据
  metadata: {
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
  };
}

// ===== 测试结果类型 =====
export interface TestResult {
  // 基本信息
  testCaseId: string;
  executionId: string;
  timestamp: Date;
  duration: number;
  
  // 执行状态
  status: TestExecutionStatus;
  message?: string;
  error?: TestError;
  
  // 实际结果
  actualOutputs: any[];
  logMessages: LogMessage[];
  screenshots: string[];
  metrics: ExecutionMetrics;
  
  // 覆盖率数据
  coverage?: CoverageData;
  
  // VlabViewer集成数据
  topologyState?: TopologyState;                // 执行时的拓扑状态
  nodeResults?: NodeResult[];                   // 节点级别的结果
}

// ===== 覆盖率分析类型 =====
export interface CoverageData {
  // 文件覆盖率
  files: {
    [fileName: string]: FileCoverage;
  };
  
  // 总体统计
  summary: {
    linesCovered: number;
    linesTotal: number;
    branchesCovered: number;
    branchesTotal: number;
    functionsCovered: number;
    functionsTotal: number;
    coveragePercentage: number;
  };
  
  // 执行信息
  execution: {
    timestamp: Date;
    testSuite: string;
    duration: number;
    environment: string;
  };
  
  // VlabViewer集成
  topologyMapping?: {
    [nodeId: string]: NodeCoverage;            // 节点覆盖率映射
  };
}

export interface FileCoverage {
  lines: {
    [lineNumber: number]: {
      count: number;
      covered: boolean;
    };
  };
  
  branches: {
    [lineNumber: number]: {
      taken: number[];
      total: number;
    };
  };
  
  functions: {
    [functionName: string]: {
      count: number;
      line: number;
      covered: boolean;
    };
  };
}

// ===== VlabViewer集成类型 =====
export interface TopologySnapshot {
  id: string;
  timestamp: Date;
  topology: any;                                // 完整的拓扑配置
  nodes: TopologyNode[];
  connections: TopologyConnection[];
  metadata: {
    version: string;
    capturedBy: string;
    description: string;
  };
}

export interface TopologyReference {
  snapshotId?: string;                          // 快照ID
  nodeIds: string[];                            // 涉及的节点ID
  connectionIds: string[];                      // 涉及的连接ID
  dynamicCapture: boolean;                      // 是否动态捕获当前拓扑
}

export interface StimulusReference {
  stimulusId: string;                           // 激励ID
  parameters?: Record<string, any>;             // 参数覆盖
  enabled: boolean;                             // 是否启用
}

export interface NodeResult {
  nodeId: string;
  nodeName: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  metrics?: Record<string, any>;
  logs?: LogMessage[];
  coverage?: NodeCoverage;
}

export interface NodeCoverage {
  nodeId: string;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  hotspots: CoverageHotspot[];
}

// ===== 枚举类型 =====
export type TestExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'passed' 
  | 'failed' 
  | 'error' 
  | 'skipped' 
  | 'cancelled';

export type ReportFormat = 'html' | 'json' | 'xml' | 'word' | 'pdf' | 'csv';

// ===== 辅助类型 =====
export interface TestEnvironment {
  name: string;
  version: string;
  variables: Record<string, string>;
  constraints: TestConstraint[];
}

export interface ExpectedResults {
  outputs: ExpectedOutput[];
  behaviors: ExpectedBehavior[];
  performance: PerformanceMetrics;
  coverage?: CoverageTarget;
}

export interface ExpectedOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  tolerance?: number;
  comparison: 'equals' | 'contains' | 'matches' | 'greater' | 'less';
}

export interface ExpectedBehavior {
  name: string;
  description: string;
  criteria: BehaviorCriteria[];
}

export interface BehaviorCriteria {
  type: 'timing' | 'sequence' | 'state' | 'event';
  condition: string;
  expected: any;
}

export interface PerformanceMetrics {
  maxExecutionTime?: number;
  maxMemoryUsage?: number;
  maxCpuUsage?: number;
  throughput?: number;
  customMetrics?: Record<string, number>;
}

export interface CoverageTarget {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
}

export interface TestConstraint {
  type: 'hardware' | 'software' | 'network' | 'time';
  name: string;
  requirement: string;
}

export interface TestError {
  code: string;
  message: string;
  stack?: string;
  details?: Record<string, any>;
}

export interface LogMessage {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
  context?: Record<string, any>;
}

export interface ExecutionMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  customMetrics: Record<string, number>;
}

export interface TopologyState {
  timestamp: Date;
  nodeStates: Record<string, any>;
  connectionStates: Record<string, any>;
  globalState: Record<string, any>;
}

export interface CoverageHotspot {
  file: string;
  line: number;
  function: string;
  hitCount: number;
  complexity: number;
  risk: 'low' | 'medium' | 'high';
}
