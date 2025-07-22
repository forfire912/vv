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

  const filteredData = data.filter(item => {
    const matchTarget = !targetFilter || item.target === targetFilter;
    const matchSearch = !search || item.name.includes(search) || item.description.includes(search);
    return matchTarget && matchSearch;
  });

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

  // 根据 theme 设置样式
  const themeStyles: Record<string, React.CSSProperties> = {
    light: { background: '#fff', color: '#222' },
    dark: { background: '#222', color: '#eee' },
    colorful: { background: 'linear-gradient(90deg,#e3ffe8,#fffbe3,#e3f0ff)', color: '#222' }
  };
  return (
    <div style={{ ...themeStyles[theme], padding: '8px' }}>
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
      <Table
        columns={[...columns, actionColumn]}
        dataSource={filteredData}
        pagination={false}
        size="small"
        rowKey="key"
      />
    </div>
  );
};

export default StimulusPanel;
