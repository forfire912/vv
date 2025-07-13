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

// 保存到 localStorage（按名称）
export function saveTopologyByName(name: string, nodes: Node[], edges: Edge[]) {
  localStorage.setItem(`vlab_${name}`, JSON.stringify({ nodes, edges }));
}

// 读取指定名称的拓扑
export function loadTopologyByName(name: string): { nodes: Node[]; edges: Edge[] } | null {
  const item = localStorage.getItem(`vlab_${name}`);
  return item ? JSON.parse(item) : null;
}

// 列出所有已保存的拓扑名称
export function getSavedTopologyNames(): string[] {
  return Object.keys(localStorage)
    .filter(key =>
      key.startsWith('vlab_')
      && key !== 'vlab_topology'   // 排除默认存储项
    )
    .map(key => key.replace('vlab_', ''));
}

// 删除指定名称的拓扑
export function deleteTopologyByName(name: string) {
  localStorage.removeItem(`vlab_${name}`);
}