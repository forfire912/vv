import React, { useState } from 'react';
import { Form, Input, Select, Button, InputNumber, Space } from 'antd';

const timeTypeOptions = [
  { label: '特定时间触发', value: 'time' },
  { label: '程序执行地址', value: 'exec_addr' },
  { label: '程序读取地址', value: 'read_addr' },
  { label: '程序修改地址', value: 'write_addr' },
];
const placeTypeOptions = [
  { label: '内存地址', value: 'mem_addr' },
  { label: '数据协议', value: 'protocol' },
];

interface StimulusEditPanelProps {
  stimulus?: any;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  nodeNames?: string[];
  initialValues?: any;
  theme?: 'light' | 'dark' | 'colorful';
}

const StimulusEditPanel: React.FC<StimulusEditPanelProps> = ({ stimulus, onSave, onCancel, nodeNames = [], initialValues, theme = 'light' }) => {
    const [form] = Form.useForm();

    // 组件挂载或 stimulus/initialValues 变化时，重置表单
    React.useEffect(() => {
        // 设置表单初始值的优先级：stimulus > initialValues
        const initData = stimulus || initialValues || {};
        
        // 调试输出初始数据
        console.log('StimulusEditPanel 初始数据:', initData);
        
        // 重置表单并设置初始值
        form.resetFields();
        if (Object.keys(initData).length > 0) {
            form.setFieldsValue(initData);
        }
    }, [stimulus, initialValues, form]);

    const handleSave = () => {
        form.validateFields().then(values => {
            if (onSave) {
                // 保存时也传递原始激励数据的关键信息
                if (stimulus) {
                    values.key = stimulus.key; // 保留原始 key
                }
                onSave(values);
            }
            // 保存成功后清空表单，确保可以新增多个激励
            form.resetFields();
        });
    };

    // 根据 theme 设置样式
    const themeStyles: Record<string, React.CSSProperties> = {
        light: { background: '#fff', color: '#222' },
        dark: { background: '#222', color: '#eee' },
        colorful: { background: 'linear-gradient(90deg,#e3ffe8,#fffbe3,#e3f0ff)', color: '#222' }
    };

    return (
        <Form
            form={form}
            layout="horizontal"
            style={{ maxWidth: 520, margin: '0 auto', padding: 8, ...themeStyles[theme] }}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            colon={false}
        >
      {/* 第一组：前三个属性 */}
      <Form.Item label="激励名称" name="name" rules={[{ required: true, message: '请输入激励名称' }]} style={{ marginBottom: 4 }}>
        <Input size="small" />
      </Form.Item>
      <Form.Item label="激励描述" name="description" style={{ marginBottom: 4 }}>
        <Input.TextArea rows={1} size="small" />
      </Form.Item>
      <Form.Item label="激励作用对象" name="targetName" rules={[{ required: true, message: '请选择激励作用对象' }]} style={{ marginBottom: 4 }}>
        <Select options={nodeNames.map(n => ({ label: n, value: n }))} showSearch size="small" />
      </Form.Item>
      <div style={{ borderTop: '1px dashed #bbb', margin: '8px 0' }} />
      {/* 第二组：激励时间类型和数值、激励地点类型和数值 */}
      <Form.Item label="激励时间类型" name="timeType" rules={[{ required: true }]} style={{ marginBottom: 4 }}>
        <Select options={timeTypeOptions} size="small" />
      </Form.Item>
      <Form.Item shouldUpdate={(prev, curr) => prev.timeType !== curr.timeType} noStyle>
        {({ getFieldValue }) => {
          const type = getFieldValue('timeType');
          const label = type === 'time' ? '指令地址' : '存储地址';
          return <Form.Item label={label} name="timeValue" rules={[{ required: true }]} style={{ marginBottom: 4 }}><Input size="small" style={{ width: '100%' }} /></Form.Item>;
        }}
      </Form.Item>
      <Form.Item label="激励位置类型" name="placeType" rules={[{ required: true }]} style={{ marginBottom: 4 }}>
        <Select options={placeTypeOptions} size="small" />
      </Form.Item>
      <Form.Item shouldUpdate={(prev, curr) => prev.placeType !== curr.placeType} noStyle>
        {({ getFieldValue }) => {
          const type = getFieldValue('placeType');
          if (type === 'mem_addr') {
            return <Space style={{ width: '100%' }}>
              <Form.Item label="起始地址" name="placeStartAddr" rules={[{ required: true }]} style={{ marginBottom: 4 }}><Input size="small" /></Form.Item>
              <Form.Item label="结束地址" name="placeEndAddr" rules={[{ required: true }]} style={{ marginBottom: 4 }}><Input size="small" /></Form.Item>
            </Space>;
          } else if (type === 'protocol') {
            return <Form.Item label="数据协议参数（预留）" name="protocolValue" style={{ marginBottom: 4 }}><Input size="small" /></Form.Item>;
          }
          return null;
        }}
      </Form.Item>
      <div style={{ borderTop: '1px dashed #bbb', margin: '8px 0' }} />
      {/* 第三组：激励次数、激励时间间隔、激励数据 */}
      <Form.Item label="激励次数" name="count" rules={[{ required: true }]} style={{ marginBottom: 4 }}>
        <InputNumber min={1} size="small" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="激励时间间隔" name="interval" rules={[{ required: true }]} style={{ marginBottom: 4 }}>
        <InputNumber min={0} size="small" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item label="激励数据" name="data" rules={[{ required: true }]} style={{ marginBottom: 4 }}>
        <Input.TextArea rows={1} size="small" />
      </Form.Item>
      <div style={{ borderTop: '1px dashed #bbb', margin: '8px 0' }} />
      {/* 其余属性（如有）可继续分组或单独展示 */}
      <Form.Item wrapperCol={{ span: 24 }} style={{ textAlign: 'right', marginBottom: 0 }}>
        <Button type="primary" size="small" onClick={handleSave}>保存</Button>
      </Form.Item>
    </Form>
  );
};

export default StimulusEditPanel;