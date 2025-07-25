/**
 * VlabViewer 模块化架构核心接口定义
 * 定义各模块间的通信接口和规范
 */

// ===== 核心模块接口 =====

/**
 * 模块基础接口
 */
export interface ModuleBase {
  name: string;
  version: string;
  dependencies: string[];
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  getAPI(): any;
}

/**
 * 拓扑引擎API接口
 */
export interface TopologyEngineAPI {
  // 节点管理
  getNodes(): TopologyNode[];
  getNode(id: string): TopologyNode | undefined;
  addNode(node: TopologyNode): void;
  updateNode(id: string, updates: Partial<TopologyNode>): void;
  removeNode(id: string): void;
  
  // 连接管理
  getConnections(): TopologyConnection[];
  getConnection(id: string): TopologyConnection | undefined;
  addConnection(connection: TopologyConnection): void;
  removeConnection(id: string): void;
  
  // 拓扑操作
  getTopology(): Topology;
  setTopology(topology: Topology): void;
  validateTopology(topology: Topology): ValidationResult;
  
  // 快照功能
  createSnapshot(): TopologySnapshot;
  restoreSnapshot(snapshot: TopologySnapshot): Promise<void>;
  
  // 事件订阅
  onNodeChanged(callback: (node: TopologyNode) => void): () => void;
  onConnectionChanged(callback: (connection: TopologyConnection) => void): () => void;
  onTopologyChanged(callback: (topology: Topology) => void): () => void;
}

/**
 * 测试引擎API接口
 */
export interface TestEngineAPI {
  // 测试用例管理
  getTestCases(): TestCase[];
  getTestCase(id: string): TestCase | undefined;
  createTestCase(testCase: Omit<TestCase, 'id' | 'metadata'>): TestCase;
  updateTestCase(id: string, updates: Partial<TestCase>): void;
  deleteTestCase(id: string): void;
  
  // 测试套件管理
  getTestSuites(): TestSuite[];
  getTestSuite(id: string): TestSuite | undefined;
  createTestSuite(testSuite: Omit<TestSuite, 'id' | 'metadata'>): TestSuite;
  updateTestSuite(id: string, updates: Partial<TestSuite>): void;
  deleteTestSuite(id: string): void;
  
  // 测试执行
  executeTest(testCaseId: string): Promise<TestResult>;
  executeTestSuite(testSuiteId: string): Promise<TestSuiteResult>;
  cancelExecution(executionId: string): void;
  
  // 测试结果
  getTestResults(testCaseId?: string): TestResult[];
  getTestResult(executionId: string): TestResult | undefined;
  
  // 覆盖率分析
  generateCoverage(testResults: TestResult[]): CoverageData;
  getCoverageReport(format: ReportFormat): Promise<string | Buffer>;
  
  // 事件订阅
  onTestStarted(callback: (testCase: TestCase) => void): () => void;
  onTestCompleted(callback: (result: TestResult) => void): () => void;
  onTestFailed(callback: (error: TestError) => void): () => void;
}

/**
 * 激励引擎API接口
 */
export interface StimulusEngineAPI {
  // 激励管理
  getStimuli(): Stimulus[];
  getStimulus(id: string): Stimulus | undefined;
  createStimulus(stimulus: Omit<Stimulus, 'id'>): Stimulus;
  updateStimulus(id: string, updates: Partial<Stimulus>): void;
  deleteStimulus(id: string): void;
  
  // 激励执行
  executeStimulus(stimulusId: string, parameters?: Record<string, any>): Promise<void>;
  
  // 模板管理
  getTemplates(): StimulusTemplate[];
  getTemplate(id: string): StimulusTemplate | undefined;
  
  // 事件订阅
  onStimulusExecuted(callback: (stimulus: Stimulus) => void): () => void;
}

// ===== 数据类型定义 =====

export interface TopologyNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  properties: Record<string, any>;
  interfaces: NodeInterface[];
}

export interface TopologyConnection {
  id: string;
  source: { nodeId: string; interfaceId: string };
  target: { nodeId: string; interfaceId: string };
  properties: Record<string, any>;
}

export interface NodeInterface {
  id: string;
  name: string;
  type: string;
  direction: 'input' | 'output' | 'bidirectional';
}

export interface Topology {
  id: string;
  name: string;
  nodes: TopologyNode[];
  connections: TopologyConnection[];
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface TopologySnapshot {
  id: string;
  timestamp: Date;
  topology: Topology;
  metadata: {
    description: string;
    capturedBy: string;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  location?: string;
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
}

// ===== 测试相关类型 =====

export interface TestCase {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  
  // VlabViewer集成
  associatedNodes: string[];
  functionTreePath: string;
  topologySnapshot?: TopologySnapshot;
  
  // 测试配置
  testConfiguration: {
    topology: TopologyReference;
    stimuli: StimulusReference[];
    environment: TestEnvironment;
    expectedResults: ExpectedResults;
  };
  
  // 执行信息
  execution: {
    status: TestExecutionStatus;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    lastExecuted?: Date;
    attempts: number;
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

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  testCases: string[];
  subSuites: string[];
  
  // VlabViewer集成
  functionTreeNodeId?: string;
  associatedTopologyNodes: string[];
  
  // 执行配置
  executionConfig: {
    parallel: boolean;
    timeout: number;
    setupScript?: string;
    teardownScript?: string;
    continueOnFailure: boolean;
  };
  
  // 元数据
  metadata: {
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
  };
}

export interface TestResult {
  id: string;
  testCaseId: string;
  executionId: string;
  timestamp: Date;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: TestExecutionStatus;
  message?: string;
  error?: TestError;
  actualOutputs: any[];
  outputs?: any[];
  artifacts?: any[];
  logMessages: LogMessage[];
  metrics: ExecutionMetrics;
  coverage?: CoverageData;
  topologyState?: TopologyState;
  nodeResults?: NodeResult[];
}

export interface TestSuiteResult {
  testSuiteId: string;
  executionId: string;
  timestamp: Date;
  duration: number;
  status: TestExecutionStatus;
  testResults: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    errors: number;
  };
}

// ===== 激励相关类型 =====

export interface Stimulus {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters: Record<string, any>;
  targetNodes: string[];
  triggers: StimulusTrigger[];
}

export interface StimulusTrigger {
  type: 'time' | 'event' | 'condition';
  configuration: Record<string, any>;
}

export interface StimulusTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters: TemplateParameter[];
  template: string;
}

export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  defaultValue: any;
  options?: any[];
  required: boolean;
  description: string;
}

// ===== 辅助类型 =====

export type TestExecutionStatus = 
  | 'pending' 
  | 'running' 
  | 'passed' 
  | 'failed' 
  | 'error' 
  | 'skipped' 
  | 'cancelled';

export type ReportFormat = 'html' | 'json' | 'xml' | 'word' | 'pdf' | 'csv';

export interface TopologyReference {
  snapshotId?: string;
  nodeIds: string[];
  connectionIds: string[];
  dynamicCapture: boolean;
}

export interface StimulusReference {
  stimulusId: string;
  parameters?: Record<string, any>;
  enabled: boolean;
}

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
  type: string;
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

export interface CoverageData {
  files: Record<string, FileCoverage>;
  summary: CoverageSummary;
  execution: CoverageExecution;
  topologyMapping?: Record<string, NodeCoverage>;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
}

export interface FileCoverage {
  lines: Record<number, { count: number; covered: boolean }>;
  branches: Record<number, { taken: number[]; total: number }>;
  functions: Record<string, { count: number; line: number; covered: boolean }>;
}

export interface CoverageSummary {
  linesCovered: number;
  linesTotal: number;
  branchesCovered: number;
  branchesTotal: number;
  functionsCovered: number;
  functionsTotal: number;
  coveragePercentage: number;
}

export interface CoverageExecution {
  timestamp: Date;
  testSuite: string;
  duration: number;
  environment: string;
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

export interface CoverageHotspot {
  file: string;
  line: number;
  function: string;
  hitCount: number;
  complexity: number;
  risk: 'low' | 'medium' | 'high';
}
