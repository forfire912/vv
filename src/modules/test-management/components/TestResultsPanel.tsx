/**
 * 测试结果面板组件
 * 显示和分析测试执行结果
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTestStore } from '../../core/stateManager';
import type { TestCase, TestResult } from '../../core/interfaces';

interface TestResultsPanelProps {
  testResults: TestResult[];
  testCases: TestCase[];
  onTabChange: (tab: string) => void;
}

type FilterType = 'all' | 'passed' | 'failed' | 'running';
type SortType = 'date' | 'duration' | 'name' | 'status';

export const TestResultsPanel: React.FC<TestResultsPanelProps> = ({
  testResults,
  testCases,
  onTabChange
}) => {
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 过滤和排序结果
  const filteredAndSortedResults = useMemo(() => {
    let filtered = testResults;
    
    // 按状态过滤
    if (filter !== 'all') {
      filtered = filtered.filter(result => result.status === filter);
    }
    
    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(result => {
        const testCase = testCases.find(tc => tc.id === result.testCaseId);
        return testCase?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               testCase?.description.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        case 'name':
          const testCaseA = testCases.find(tc => tc.id === a.testCaseId);
          const testCaseB = testCases.find(tc => tc.id === b.testCaseId);
          return (testCaseA?.name || '').localeCompare(testCaseB?.name || '');
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [testResults, testCases, filter, sortBy, searchTerm]);
  
  // 计算统计信息
  const stats = useMemo(() => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const running = testResults.filter(r => r.status === 'running').length;
    
    const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;
    
    const passRate = total > 0 ? (passed / total) * 100 : 0;
    
    return {
      total,
      passed,
      failed,
      running,
      passRate,
      averageDuration
    };
  }, [testResults]);
  
  const formatDuration = useCallback((duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`;
    } else {
      return `${(duration / 1000).toFixed(2)}s`;
    }
  }, []);
  
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '🔄';
      default:
        return '⚪';
    }
  }, []);
  
  const getStatusClass = useCallback((status: string) => {
    switch (status) {
      case 'passed':
        return 'status-passed';
      case 'failed':
        return 'status-failed';
      case 'running':
        return 'status-running';
      default:
        return 'status-unknown';
    }
  }, []);
  
  return (
    <div className="test-results-panel">
      {/* 统计信息 */}
      <div className="results-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">总计</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          
          <div className="stat-card success">
            <div className="stat-label">通过</div>
            <div className="stat-value">{stats.passed}</div>
          </div>
          
          <div className="stat-card error">
            <div className="stat-label">失败</div>
            <div className="stat-value">{stats.failed}</div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-label">执行中</div>
            <div className="stat-value">{stats.running}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">通过率</div>
            <div className={`stat-value ${stats.passRate >= 80 ? 'success' : stats.passRate >= 60 ? 'warning' : 'error'}`}>
              {stats.passRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">平均耗时</div>
            <div className="stat-value">{formatDuration(stats.averageDuration)}</div>
          </div>
        </div>
      </div>
      
      {/* 过滤和搜索工具栏 */}
      <div className="results-toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="搜索测试结果..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="filter-select"
          >
            <option value="all">所有结果 ({stats.total})</option>
            <option value="passed">通过 ({stats.passed})</option>
            <option value="failed">失败 ({stats.failed})</option>
            <option value="running">执行中 ({stats.running})</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="sort-select"
          >
            <option value="date">按日期排序</option>
            <option value="duration">按耗时排序</option>
            <option value="name">按名称排序</option>
            <option value="status">按状态排序</option>
          </select>
        </div>
        
        <div className="toolbar-right">
          <button
            onClick={() => onTabChange('execution')}
            className="btn btn-primary"
          >
            执行更多测试
          </button>
        </div>
      </div>
      
      {/* 结果列表 */}
      <div className="results-list">
        {filteredAndSortedResults.length === 0 ? (
          <div className="empty-state">
            <p>没有找到匹配的测试结果</p>
            <button
              onClick={() => onTabChange('execution')}
              className="btn btn-primary"
            >
              执行测试
            </button>
          </div>
        ) : (
          filteredAndSortedResults.map(result => {
            const testCase = testCases.find(tc => tc.id === result.testCaseId);
            
            return (
              <div
                key={result.id}
                className={`result-item ${selectedResult === result.id ? 'selected' : ''} ${getStatusClass(result.status)}`}
                onClick={() => setSelectedResult(result.id)}
              >
                <div className="result-header">
                  <div className="result-status">
                    {getStatusIcon(result.status)}
                  </div>
                  
                  <div className="result-info">
                    <h4 className="result-title">
                      {testCase?.name || '未知测试用例'}
                    </h4>
                    <p className="result-description">
                      {testCase?.description}
                    </p>
                  </div>
                  
                  <div className="result-meta">
                    <div className="meta-item">
                      <span className="label">状态:</span>
                      <span className={`value ${getStatusClass(result.status)}`}>
                        {result.status}
                      </span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="label">耗时:</span>
                      <span className="value">
                        {result.duration ? formatDuration(result.duration) : '-'}
                      </span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="label">执行时间:</span>
                      <span className="value">
                        {new Date(result.startTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 覆盖率信息 */}
                {result.coverage && (
                  <div className="coverage-info">
                    <div className="coverage-item">
                      <span className="coverage-label">行覆盖率:</span>
                      <div className="coverage-bar">
                        <div 
                          className="coverage-fill"
                          style={{ width: `${result.coverage.lineCoverage}%` }}
                        ></div>
                        <span className="coverage-text">
                          {result.coverage.lineCoverage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="coverage-item">
                      <span className="coverage-label">分支覆盖率:</span>
                      <div className="coverage-bar">
                        <div 
                          className="coverage-fill"
                          style={{ width: `${result.coverage.branchCoverage}%` }}
                        ></div>
                        <span className="coverage-text">
                          {result.coverage.branchCoverage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="coverage-item">
                      <span className="coverage-label">函数覆盖率:</span>
                      <div className="coverage-bar">
                        <div 
                          className="coverage-fill"
                          style={{ width: `${result.coverage.functionCoverage}%` }}
                        ></div>
                        <span className="coverage-text">
                          {result.coverage.functionCoverage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 错误信息 */}
                {result.error && (
                  <div className="error-info">
                    <div className="error-message">
                      <strong>错误:</strong> {result.error.message}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* 详细结果视图 */}
      {selectedResult && (
        <TestResultDetail
          resultId={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
};

/**
 * 测试结果详细信息组件
 */
const TestResultDetail: React.FC<{
  resultId: string;
  onClose: () => void;
}> = ({ resultId, onClose }) => {
  const { result, testCase } = useTestStore(state => {
    const testResult = state.testResults.find((r: TestResult) => r.id === resultId);
    const testCase = testResult ? state.testCases.find((tc: TestCase) => tc.id === testResult.testCaseId) : null;
    
    return {
      result: testResult,
      testCase
    };
  });
  
  if (!result) {
    return <div>测试结果未找到</div>;
  }
  
  const formatDuration = (duration: number) => {
    if (duration < 1000) {
      return `${duration}ms`;
    } else {
      return `${(duration / 1000).toFixed(2)}s`;
    }
  };
  
  return (
    <div className="test-result-detail-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>测试结果详情</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="modal-body">
          {/* 基本信息 */}
          <div className="detail-section">
            <h4>基本信息</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">测试用例:</span>
                <span className="value">{testCase?.name || '未知'}</span>
              </div>
              
              <div className="info-item">
                <span className="label">状态:</span>
                <span className={`value status-${result.status}`}>
                  {result.status}
                </span>
              </div>
              
              <div className="info-item">
                <span className="label">开始时间:</span>
                <span className="value">
                  {new Date(result.startTime).toLocaleString()}
                </span>
              </div>
              
              <div className="info-item">
                <span className="label">结束时间:</span>
                <span className="value">
                  {result.endTime ? new Date(result.endTime).toLocaleString() : '-'}
                </span>
              </div>
              
              <div className="info-item">
                <span className="label">执行耗时:</span>
                <span className="value">
                  {result.duration ? formatDuration(result.duration) : '-'}
                </span>
              </div>
              
              <div className="info-item">
                <span className="label">执行ID:</span>
                <span className="value">{result.executionId}</span>
              </div>
            </div>
          </div>
          
          {/* 覆盖率详情 */}
          {result.coverage && (
            <div className="detail-section">
              <h4>代码覆盖率</h4>
              <div className="coverage-details">
                <div className="coverage-metric">
                  <span className="metric-label">行覆盖率:</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ width: `${result.coverage.lineCoverage}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">
                    {result.coverage.lineCoverage.toFixed(2)}%
                  </span>
                </div>
                
                <div className="coverage-metric">
                  <span className="metric-label">分支覆盖率:</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ width: `${result.coverage.branchCoverage}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">
                    {result.coverage.branchCoverage.toFixed(2)}%
                  </span>
                </div>
                
                <div className="coverage-metric">
                  <span className="metric-label">函数覆盖率:</span>
                  <div className="metric-bar">
                    <div 
                      className="metric-fill"
                      style={{ width: `${result.coverage.functionCoverage}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">
                    {result.coverage.functionCoverage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* 错误信息 */}
          {result.error && (
            <div className="detail-section">
              <h4>错误信息</h4>
              <div className="error-details">
                <div className="error-message">
                  <strong>错误类型:</strong> {result.error.type}
                </div>
                <div className="error-message">
                  <strong>错误信息:</strong> {result.error.message}
                </div>
                {result.error.stack && (
                  <div className="error-stack">
                    <strong>堆栈跟踪:</strong>
                    <pre>{result.error.stack}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 输出信息 */}
          {result.outputs && result.outputs.length > 0 && (
            <div className="detail-section">
              <h4>输出信息</h4>
              <div className="outputs-list">
                {result.outputs.map((output, index) => (
                  <div key={index} className="output-item">
                    <div className="output-header">
                      <span className="output-type">{output.type}</span>
                      <span className="output-timestamp">
                        {new Date(output.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="output-content">
                      {typeof output.content === 'string' ? (
                        <pre>{output.content}</pre>
                      ) : (
                        <pre>{JSON.stringify(output.content, null, 2)}</pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 附件 */}
          {result.artifacts && result.artifacts.length > 0 && (
            <div className="detail-section">
              <h4>附件</h4>
              <div className="artifacts-list">
                {result.artifacts.map((artifact, index) => (
                  <div key={index} className="artifact-item">
                    <span className="artifact-name">{artifact.name}</span>
                    <span className="artifact-type">{artifact.type}</span>
                    <span className="artifact-size">
                      {(artifact.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
