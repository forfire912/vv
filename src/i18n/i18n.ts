// 简单国际化对象，可扩展
const messages = {
  zh: {
    save: '保存',
    exportJson: '导出JSON',
    exportRepl: '导出REPL',
    undo: '撤销',
    redo: '重做',
    processor: '处理器',
    peripheral: '外设',
    notConnected: '未连接',
    select: '未选择',
    busPort: '总线端口',
    commParams: '通信参数',
  },
  en: {
    save: 'Save',
    exportJson: 'Export JSON',
    exportRepl: 'Export REPL',
    undo: 'Undo',
    redo: 'Redo',
    processor: 'Processor',
    peripheral: 'Peripheral',
    notConnected: 'Not connected',
    select: 'Select',
    busPort: 'Bus Port',
    commParams: 'Communication Parameters',
  },
};

export function t(key: keyof typeof messages['zh'], lang: 'zh' | 'en' = 'zh') {
  return messages[lang][key] || key;
}