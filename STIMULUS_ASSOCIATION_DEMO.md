/**
 * 激励关联功能演示文档
 * 演示如何在测试用例中按组件过滤和关联激励
 */

# 激励关联功能演示

## 用户需求实现
> **用户需求**: "任何测试例都可按组件过滤关联所有测试激励"

### 核心功能
✅ **按组件过滤激励** - 可以根据测试用例关联的组件自动过滤相关激励
✅ **多组件支持** - 支持测试用例关联多个组件，显示所有相关激励
✅ **激励多选** - 可以选择多个激励应用到同一个测试用例
✅ **参数自定义** - 每个激励支持参数配置和自定义

## 使用流程

### 1. 创建/编辑测试用例
在TestCaseEditor中：
- 填写基本信息（名称、描述等）
- 选择关联的拓扑组件节点
- 配置测试激励

### 2. 激励选择和过滤
StimulusSelector自动：
- 根据关联组件过滤显示相关激励
- 支持按分类进一步筛选
- 提供搜索功能快速定位

### 3. 激励配置
- 选择需要的激励添加到测试用例
- 配置每个激励的参数
- 启用/禁用特定激励

## 数据结构示例

### 激励数据
```typescript
{
  id: 'stimulus-1',
  name: '按钮点击激励',
  category: '用户交互',
  associatedComponents: ['button', 'clickable-element'],
  parameters: [
    {
      name: 'clickType',
      type: 'select',
      options: ['single', 'double', 'long-press'],
      defaultValue: 'single'
    }
  ]
}
```

### 测试用例关联
```typescript
{
  name: '登录按钮测试',
  associatedNodes: ['login-button', 'username-input'],
  stimuli: [
    {
      stimulusId: 'stimulus-1',
      parameters: { clickType: 'single' },
      enabled: true
    },
    {
      stimulusId: 'stimulus-2', 
      parameters: { inputValue: 'testuser' },
      enabled: true
    }
  ]
}
```

## 技术实现

### 组件过滤逻辑
```typescript
// 根据关联组件过滤激励
const filteredStimuli = mockStimuli.filter(stimulus =>
  stimulus.associatedComponents.some(comp =>
    associatedComponents.includes(comp)
  )
);
```

### 激励关联管理
- **StimulusSelector**: 激励选择和参数配置界面
- **stimulusData.ts**: 激励数据管理和过滤函数
- **TestCaseEditor**: 集成激励选择到测试用例编辑流程

## 验证结果

✅ **功能完整性**: 用户可以按组件过滤并关联激励
✅ **界面友好性**: 直观的选择和配置界面
✅ **数据一致性**: 类型安全的数据结构和接口
✅ **扩展性**: 易于添加新的激励类型和组件

## 下一步优化建议

1. **实时预览**: 添加激励效果的实时预览功能
2. **模板保存**: 支持将激励配置保存为模板复用
3. **批量操作**: 支持批量启用/禁用激励
4. **依赖检查**: 检查激励之间的依赖关系和冲突

---
*功能实现完成时间: 2024-01-10*
*满足用户核心需求: 任何测试例都可按组件过滤关联所有测试激励* ✅
