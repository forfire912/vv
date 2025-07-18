import type { Node, Edge } from 'reactflow';

/**
 * 保存拓扑到本地存储
 * 将节点和边的状态保存到 localStorage。
 * @param nodes 节点数组
 * @param edges 边数组
 */
export function saveTopologyToLocalStorage(nodes: Node[], edges: Edge[]) {
  const state = { nodes, edges };
  localStorage.setItem('vlab_topology', JSON.stringify(state, null, 2));
}

/**
 * 导出拓扑为 JSON 文件
 * 构造版本号、组件列表和连接列表，并导出为 JSON 文件。
 * @param nodes 节点数组
 * @param edges 边数组
 */
export function exportTopologyJson(nodes: Node[], edges: Edge[]) {
  // 构造版本号
  const version = '1.0';

  // 构造组件列表：每个节点的 id、name、type
  const components = nodes.map(n => ({
    id: n.id,
    name: n.data.displayName || n.data.name,
    type: n.data.type
  }));

  // 重构：根据 edges 来生成连接列表
  const connection: ConnectionItem[] = edges
    .map(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      if (!sourceNode || !targetNode) return null;

      // 确定哪端是 CPU，哪端是外设
      let cpuNode: Node<any>, perNode: Node<any>;
      if (sourceNode.data.type === 'cpu' && targetNode.data.type !== 'cpu') {
        cpuNode = sourceNode;
        perNode = targetNode;
      } else if (targetNode.data.type === 'cpu' && sourceNode.data.type !== 'cpu') {
        cpuNode = targetNode;
        perNode = sourceNode;
      } else {
        return null;
      }

      // 外设上的接口配置（可能由属性面板设置）
      const cfg: any = perNode.data.config || {};
      // 接口 id：优先 selectedInterface，否则使用 CPU 模型的第一个接口 id
      const ifaceId =
        cfg.selectedInterface ??
        cpuNode.data.interfaces?.[0]?.id;
      // 新增：从接口定义取默认 addr
      // 同时按照 id 或 type 查找接口定义
      const ifaceDef = cpuNode.data.interfaces.find((i: any) =>
        i.id === ifaceId || i.type === ifaceId
      );
      const propsDef = ifaceDef?.props || {};

      // 构造 to 对象：使用接口的 type 作为 id，并始终输出参数
      const to: any = { id: ifaceDef?.type ?? ifaceId };
      // 如果接口有 pin_nums 字段，输出用户配置或默认最大值
      if (propsDef.pin_nums !== undefined) {
        to.pin_nums = cfg.pinNumber !== undefined
          ? cfg.pinNumber
          : propsDef.pin_nums;
      }
      // 如果接口有 pin_sels 字段，输出用户配置或默认第一个选项
      if (propsDef.pin_sels !== undefined) {
        to.pin_sels = cfg.pinSelection
          ? cfg.pinSelection
          : Array.isArray(propsDef.pin_sels) && propsDef.pin_sels.length > 0
            ? propsDef.pin_sels[0]
            : undefined;
      }

      return { from: { id: perNode.id }, to };
    })
    .filter((c): c is ConnectionItem => c !== null);

  const payload = { version, components, connection };

  // 导出 JSON 文件
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

type ConnectionItem = {
  from: { id: string };
  to: { id: any; [key: string]: any };
};