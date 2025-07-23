import React, { useState } from 'react';
import { Table, Input, Select, Button, Space } from 'antd';

export interface Stimulus {
  [key: string]: any;
}

const targets = [
  { label: '处理器', value: 'cpu' },
];

const columns = [
  { title: '激励名称', dataIndex: 'name', key: 'name' },
  { title: '作用对象', dataIndex: 'target', key: 'target' },
  { title: '激励描述', dataIndex: 'description', key: 'description' },
];

interface StimulusPanelProps {
  data?: Stimulus[];
  nodeNames?: string[];
  onAdd?: () => void;
  onEdit?: (stimulus: Stimulus) => void;
  onDelete?: (key: string) => void;
  targetFilter?: string;
  onTargetFilterChange?: (target: string | undefined) => void;
  theme?: 'light' | 'dark' | 'colorful';
}

const StimulusPanel: React.FC<StimulusPanelProps> = ({ data = [], nodeNames = [], onAdd, onEdit, onDelete, targetFilter, onTargetFilterChange, theme = 'light' }) => {
  const [search, setSearch] = useState('');

  // 确保 data 是数组并包含有效数据
  const validData = Array.isArray(data) ? data : [];
  
  // 调试输出，查看数据内容
  console.log('StimulusPanel data:', validData);

  const filteredData = validData.filter(item => {
    if (!item) return false; // 排除无效项
    
    // 对目标过滤的处理，检查 target 和 targetName 两个可能的字段
    const matchTarget = !targetFilter || 
      item.target === targetFilter || 
      item.targetName === targetFilter;
    
    // 对搜索的处理
    const matchSearch = !search || 
      (item.name && item.name.includes(search)) || 
      (item.description && item.description.includes(search));
    
    return matchTarget && matchSearch;
  });
  
  // 调试输出过滤结果
  console.log('过滤条件:', { targetFilter, search });
  console.log('过滤后激励数据:', filteredData);

  // 操作列
  const actionColumn = {
    title: '操作',
    key: 'action',
    render: (_: any, record: Stimulus) => (
      <Space>
        <Button size="small" onClick={() => onEdit && onEdit(record)}>编辑</Button>
        <Button size="small" danger onClick={() => onDelete && onDelete(record.key)}>删除</Button>
      </Space>
    ),
  };

  return (
    <div className="stimulus-panel-container" style={{ padding: '8px' }}>
      <Space style={{ marginBottom: 8 }}>
        <Select
          allowClear
          placeholder="作用目标"
          style={{ width: 120 }}
          options={nodeNames.map(n => ({ label: n, value: n }))}
          showSearch
          value={targetFilter === undefined ? null : targetFilter}
          onChange={value => onTargetFilterChange?.(value === undefined ? undefined : value)}
        />
        <Input
          placeholder="名称/描述搜索"
          style={{ width: 180 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button type="primary" onClick={() => onAdd && onAdd()}>增加</Button>
      </Space>
      {/* 显示数据条数信息 */}
      <div style={{ marginBottom: 4 }}>总计 {validData.length} 条数据，过滤后 {filteredData.length} 条</div>
      <Table
        columns={[...columns, actionColumn]}
        dataSource={filteredData}
        pagination={false}
        size="small"
        rowKey="key"
        expandable={{
          expandedRowRender: record => (
            <div style={{ padding: '12px' }}>
              <p>Key: {record.key}</p>
              <p>时间类型: {record.timeType}</p>
              <p>位置类型: {record.placeType}</p>
              <p>激励次数: {record.count}</p>
              <p>其他数据: {JSON.stringify(record)}</p>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default StimulusPanel;
