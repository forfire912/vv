/**
 * 增强版测试报告面板 - 提供详细的测试执行报告和统计分析
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TestExecution, TestCase, TestStepResult } from '../core/executionEngine';

interface TestReport {
  id: string;
  name: string;
  generatedAt: Date;
  executions: TestExecution[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    passRate: number;
    totalDuration: number;
    averageDuration: number;
  };
  categories: {
    [key: string]: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
    };
  };
}

interface TestReportPanelEnhancedProps {
  executions?: TestExecution[];
  testCases?: TestCase[];
}

const TestReportPanelEnhanced: React.FC<TestReportPanelEnhancedProps> = ({
  executions = [],
  testCases = []
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '1d' | '1w' | '1m' | 'all'>('1d');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reportView, setReportView] = useState<'summary' | 'detailed' | 'trends'>('summary');
  const [selectedExecutionId, setSelectedExecutionId] = useState<string>('');

  // 根据时间范围过滤执行记录
  const filteredExecutions = useMemo(() => {
    if (selectedTimeRange === 'all') return executions;
    
    const now = new Date();
    let cutoffTime: Date;
    
    switch (selectedTimeRange) {
      case '1h':
        cutoffTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '1d':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1w':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffTime = new Date(0);
    }
    
    return executions.filter(exec => exec.startTime && exec.startTime >= cutoffTime);
  }, [executions, selectedTimeRange]);

  // 生成测试报告
  const testReport = useMemo((): TestReport => {
    const completedExecutions = filteredExecutions.filter(exec => 
      exec.status === 'completed' || exec.status === 'failed'
    );
    
    const allResults = completedExecutions.flatMap(exec => exec.results || []);
    
    const totalTests = allResults.length;
    const passedTests = allResults.filter(r => r && r.status === 'passed').length;
    const failedTests = allResults.filter(r => r && r.status === 'failed').length;
    const skippedTests = allResults.filter(r => r && r.status === 'skipped').length;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    const totalDuration = completedExecutions.reduce((sum, exec) => 
      sum + (exec.endTime && exec.startTime ? exec.endTime.getTime() - exec.startTime.getTime() : 0), 0
    );
    const averageDuration = completedExecutions.length > 0 ? totalDuration / completedExecutions.length : 0;
    
    // 按类别统计
    const categories: { [key: string]: any } = {};
    allResults.forEach(result => {
      if (!result) return;
      
      const testCase = testCases.find(tc => tc.id === result.stepId);
      const category = testCase?.category || 'uncategorized';
      
      if (!categories[category]) {
        categories[category] = { total: 0, passed: 0, failed: 0, skipped: 0 };
      }
      
      categories[category].total++;
      if (result.status) {
        categories[category][result.status]++;
      }
    });
    
    return {
      id: `report-${Date.now()}`,
      name: `测试报告 - ${new Date().toLocaleString()}`,
      generatedAt: new Date(),
      executions: completedExecutions,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        passRate,
        totalDuration,
        averageDuration
      },
      categories
    };
  }, [filteredExecutions, testCases]);

  // 导出报告
  const exportReport = (format: 'json' | 'csv' | 'html') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-report-${timestamp}`;
    
    switch (format) {
      case 'json':
        const jsonData = JSON.stringify(testReport, null, 2);
        downloadFile(jsonData, `${filename}.json`, 'application/json');
        break;
        
      case 'csv':
        const csvData = generateCSVReport(testReport);
        downloadFile(csvData, `${filename}.csv`, 'text/csv');
        break;
        
      case 'html':
        const htmlData = generateHTMLReport(testReport);
        downloadFile(htmlData, `${filename}.html`, 'text/html');
        break;
    }
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCSVReport = (report: TestReport): string => {
    const headers = ['Execution ID', 'Step ID', 'Status', 'Duration (ms)', 'Start Time', 'Error Message'];
    const rows = report.executions.flatMap(exec =>
      (exec.results || []).map(result => [
        exec.id,
        result.stepId || '',
        result.status || '',
        result.duration || 0,
        exec.startTime?.toISOString() || '',
        result.error || ''
      ])
    );
    
    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const generateHTMLReport = (report: TestReport): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${report.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #007ACC; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007ACC; }
        .metric-label { color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .passed { color: #4CAF50; }
        .failed { color: #f44336; }
        .skipped { color: #ff9800; }
    </style>
</head>
<body>
    <h1>${report.name}</h1>
    <div class="summary">
        <h2>测试摘要</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${report.summary.totalTests}</div>
                <div class="metric-label">总测试数</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.passRate.toFixed(1)}%</div>
                <div class="metric-label">通过率</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(report.summary.averageDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">平均执行时间</div>
            </div>
        </div>
    </div>
    
    <h2>详细结果</h2>
    <table>
        <thead>
            <tr>
                <th>执行ID</th>
                <th>步骤ID</th>
                <th>状态</th>
                <th>持续时间</th>
                <th>开始时间</th>
            </tr>
        </thead>
        <tbody>
            ${report.executions.flatMap(exec =>
              (exec.results || []).map(result => `
                <tr>
                    <td>${exec.id}</td>
                    <td>${result.stepId || ''}</td>
                    <td class="${result.status || ''}">${result.status || ''}</td>
                    <td>${result.duration || 0}ms</td>
                    <td>${exec.startTime?.toLocaleString() || ''}</td>
                </tr>
              `).join('')
            ).join('')}
        </tbody>
    </table>
</body>
</html>`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return '#4CAF50';
      case 'failed': return '#f44336';
      case 'skipped': return '#ff9800';
      case 'running': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const formatDuration = (milliseconds: number) => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}min`;
  };

  return (
    <div style={{
      padding: '8px',
      backgroundColor: 'var(--vscode-editor-background)',
      color: 'var(--vscode-foreground)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        padding: '8px',
        backgroundColor: 'var(--vscode-input-background)',
        borderRadius: '2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0 }}>测试报告</h3>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'var(--vscode-editor-background)',
              color: 'var(--vscode-foreground)',
              border: '1px solid var(--vscode-input-border)',
              borderRadius: '2px',
              fontSize: '12px'
            }}
          >
            <option value="1h">最近1小时</option>
            <option value="1d">最近1天</option>
            <option value="1w">最近1周</option>
            <option value="1m">最近1月</option>
            <option value="all">全部时间</option>
          </select>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setReportView('summary')}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: reportView === 'summary' 
                  ? 'var(--vscode-button-background)' 
                  : 'var(--vscode-button-secondaryBackground)',
                color: reportView === 'summary' 
                  ? 'var(--vscode-button-foreground)' 
                  : 'var(--vscode-button-secondaryForeground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              摘要
            </button>
            <button
              onClick={() => setReportView('detailed')}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: reportView === 'detailed' 
                  ? 'var(--vscode-button-background)' 
                  : 'var(--vscode-button-secondaryBackground)',
                color: reportView === 'detailed' 
                  ? 'var(--vscode-button-foreground)' 
                  : 'var(--vscode-button-secondaryForeground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              详细
            </button>
            <button
              onClick={() => setReportView('trends')}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: reportView === 'trends' 
                  ? 'var(--vscode-button-background)' 
                  : 'var(--vscode-button-secondaryBackground)',
                color: reportView === 'trends' 
                  ? 'var(--vscode-button-foreground)' 
                  : 'var(--vscode-button-secondaryForeground)',
                border: '1px solid var(--vscode-button-border)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              趋势
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => exportReport('json')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            导出JSON
          </button>
          <button
            onClick={() => exportReport('csv')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            导出CSV
          </button>
          <button
            onClick={() => exportReport('html')}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: 'var(--vscode-button-secondaryBackground)',
              color: 'var(--vscode-button-secondaryForeground)',
              border: '1px solid var(--vscode-button-border)',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            导出HTML
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {reportView === 'summary' && (
          <div>
            {/* 总体统计 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--vscode-input-background)',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px',
                borderLeft: '4px solid #4CAF50'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {testReport.summary.totalTests}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                  总测试数
                </div>
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--vscode-input-background)',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px',
                borderLeft: '4px solid #2196F3'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                  {testReport.summary.passRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                  通过率
                </div>
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--vscode-input-background)',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px',
                borderLeft: '4px solid #ff9800'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                  {formatDuration(testReport.summary.averageDuration)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                  平均执行时间
                </div>
              </div>
              
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--vscode-input-background)',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px',
                borderLeft: '4px solid #9C27B0'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {testReport.executions.length}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                  执行次数
                </div>
              </div>
            </div>

            {/* 状态分布 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--vscode-input-background)',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px'
              }}>
                <h4 style={{ margin: '0 0 12px 0' }}>测试状态分布</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#4CAF50' }}>通过</span>
                    <span>{testReport.summary.passedTests}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#f44336' }}>失败</span>
                    <span>{testReport.summary.failedTests}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#ff9800' }}>跳过</span>
                    <span>{testReport.summary.skippedTests}</span>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px',
                backgroundColor: 'var(--vscode-input-background)',
                border: '1px solid var(--vscode-panel-border)',
                borderRadius: '4px'
              }}>
                <h4 style={{ margin: '0 0 12px 0' }}>分类统计</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(testReport.categories).map(([category, stats]) => (
                    <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{category}</span>
                      <span style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
                        {stats.passed}/{stats.total} ({stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 最近执行 */}
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--vscode-input-background)',
              border: '1px solid var(--vscode-panel-border)',
              borderRadius: '4px'
            }}>
              <h4 style={{ margin: '0 0 12px 0' }}>最近执行</h4>
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {testReport.executions.slice(0, 10).map(execution => (
                  <div
                    key={execution.id}
                    style={{
                      padding: '8px',
                      marginBottom: '4px',
                      border: '1px solid var(--vscode-panel-border)',
                      borderRadius: '2px',
                      backgroundColor: 'var(--vscode-editor-background)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedExecutionId(execution.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{execution.name}</span>
                      <span style={{
                        fontSize: '11px',
                        color: getStatusColor(execution.status),
                        fontWeight: 'bold'
                      }}>
                        {execution.status}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--vscode-descriptionForeground)',
                      marginTop: '2px'
                    }}>
                      {execution.startTime?.toLocaleString() || '未知时间'} - {formatDuration(
                        execution.endTime && execution.startTime ? execution.endTime.getTime() - execution.startTime.getTime() : 0
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reportView === 'detailed' && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <select
                value={selectedExecutionId}
                onChange={(e) => setSelectedExecutionId(e.target.value)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: 'var(--vscode-editor-background)',
                  color: 'var(--vscode-foreground)',
                  border: '1px solid var(--vscode-input-border)',
                  borderRadius: '2px',
                  fontSize: '12px',
                  width: '100%'
                }}
              >
                <option value="">选择执行记录查看详情</option>
                {testReport.executions.map(execution => (
                  <option key={execution.id} value={execution.id}>
                    {execution.name} - {execution.startTime?.toLocaleString() || '未知时间'}
                  </option>
                ))}
              </select>
            </div>

            {selectedExecutionId && (
              (() => {
                const selectedExecution = testReport.executions.find(e => e.id === selectedExecutionId);
                if (!selectedExecution) return null;

                return (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'var(--vscode-input-background)',
                    border: '1px solid var(--vscode-panel-border)',
                    borderRadius: '4px'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0' }}>{selectedExecution.name}</h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>状态</div>
                        <div style={{ color: getStatusColor(selectedExecution.status), fontWeight: 'bold' }}>
                          {selectedExecution.status}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>开始时间</div>
                        <div>{selectedExecution.startTime?.toLocaleString() || '未知'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>结束时间</div>
                        <div>{selectedExecution.endTime?.toLocaleString() || '未结束'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>持续时间</div>
                        <div>{formatDuration(
                          selectedExecution.endTime && selectedExecution.startTime
                            ? selectedExecution.endTime.getTime() - selectedExecution.startTime.getTime() 
                            : 0
                        )}</div>
                      </div>
                    </div>

                    <h5 style={{ margin: '16px 0 8px 0' }}>测试结果</h5>
                    <div style={{ 
                      maxHeight: '400px', 
                      overflow: 'auto',
                      border: '1px solid var(--vscode-panel-border)',
                      borderRadius: '2px'
                    }}>
                      {(selectedExecution.results || []).map((result, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px',
                            borderBottom: index < (selectedExecution.results || []).length - 1 
                              ? '1px solid var(--vscode-panel-border)' 
                              : 'none',
                            backgroundColor: 'var(--vscode-editor-background)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold' }}>{result.stepId || '未知步骤'}</span>
                            <span style={{
                              color: getStatusColor(result.status || ''),
                              fontWeight: 'bold',
                              fontSize: '12px'
                            }}>
                              {result.status || '未知状态'}
                            </span>
                          </div>
                          
                          {result.error && (
                            <div style={{
                              marginTop: '4px',
                              padding: '4px',
                              backgroundColor: 'var(--vscode-errorBackground)',
                              color: 'var(--vscode-errorForeground)',
                              borderRadius: '2px',
                              fontSize: '11px'
                            }}>
                              {result.error}
                            </div>
                          )}
                          
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--vscode-descriptionForeground)',
                            marginTop: '4px'
                          }}>
                            持续时间: {formatDuration(result.duration || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {reportView === 'trends' && (
          <div>
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--vscode-descriptionForeground)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <h3>趋势分析</h3>
              <p>趋势分析功能正在开发中...</p>
              <p style={{ fontSize: '12px' }}>
                将包含：通过率趋势图、执行时间趋势、失败率分析等功能
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestReportPanelEnhanced;
