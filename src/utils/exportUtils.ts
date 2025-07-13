import type { Node, Edge } from 'reactflow';

// 保存到本地（localStorage）
export function saveTopologyToLocalStorage(nodes: Node[], edges: Edge[]) {
  const state = { nodes, edges };
  localStorage.setItem('vlab_topology', JSON.stringify(state, null, 2));
}

// 导出 JSON 文件
export function exportTopologyJson(nodes: Node[], edges: Edge[]) {
  const payload = { nodes, edges };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'topology.json';
  a.click();
  URL.revokeObjectURL(url);
}

// 导出 REPL 配置文件（可根据实际需求扩展）
export function exportTopologyRepl(nodes: Node[], edges: Edge[]) {
  let lines: string[] = [];
  lines.push('using sysbus');
  // 可进一步处理节点与连线，按需求生成REPL内容
  // ...
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'topology.repl';
  a.click();
  URL.revokeObjectURL(url);
}