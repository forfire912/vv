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

    // 添加状态追踪组件的渲染情况
    const [initialized, setInitialized] = React.useState(false);
    const prevPropsRef = React.useRef({ stimulus, initialValues });
    // 添加一个组件挂载状态追踪
    const isMountedRef = React.useRef(false);
    const initAttemptRef = React.useRef(0);

    // 组件挂载时设置标志
    React.useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            // 组件卸载时清除标志
            isMountedRef.current = false;
            initAttemptRef.current = 0;
            setInitialized(false);
        };
    }, []);

    // 组件挂载或 stimulus/initialValues 变化时，重置表单
    React.useEffect(() => {
        // 如果组件未挂载，不执行任何操作
        if (!isMountedRef.current) return;
        
        // 获取真正有效的初始数据
        const initData = stimulus || initialValues || {};
        const prevProps = prevPropsRef.current;
        
        // 增加尝试计数
        initAttemptRef.current += 1;
        
        console.log('StimulusEditPanel 渲染:', { 
            initialized, 
            initAttempt: initAttemptRef.current,
            hasData: Object.keys(initData).length > 0,
            hasTimestamp: !!initData._timestamp,
            hasKey: !!initData._key
        });
        
        // 更新引用，用于下次比较
        prevPropsRef.current = { stimulus, initialValues };
        
        // 重置并初始化表单
        form.resetFields();
        
        // 如果有初始值，设置到表单
        if (Object.keys(initData).length > 0) {
            // 使用多级嵌套的 setTimeout 确保在不同浏览器中也能正确设置表单值
            // 每次尝试的延迟时间递增，确保有足够的时间等待 DOM 更新
            const delay = Math.min(initAttemptRef.current * 30, 200);
            
            setTimeout(() => {
                if (!isMountedRef.current) return; // 再次检查组件是否已卸载
                
                try {
                    console.log(`设置表单值 (延迟 ${delay}ms):`, initData);
                    form.setFieldsValue(initData);
                    setInitialized(true);
                } catch (e) {
                    console.error('设置表单值失败:', e);
                    // 如果失败且尝试次数小于5次，再次尝试
                    if (initAttemptRef.current < 5 && isMountedRef.current) {
                        setTimeout(() => {
                            if (isMountedRef.current) {
                                try {
                                    console.log('重试设置表单值:', initData);
                                    form.setFieldsValue(initData);
                                    setInitialized(true);
                                } catch (e2) {
                                    console.error('重试设置表单值失败:', e2);
                                }
                            }
                        }, 100);
                    }
                }
            }, delay);
        } else {
            setInitialized(true);
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
        <Space>
          {onCancel && (
            <Button size="small" onClick={() => {
              form.resetFields();
              onCancel();
            }}>取消</Button>
          )}
          <Button type="primary" size="small" onClick={handleSave}>保存</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default StimulusEditPanel;