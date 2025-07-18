import type { Node, Edge } from 'reactflow';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

/**
 * 撤销重做管理器
 * 管理拓扑的历史状态，支持撤销和重做操作。
 */
export class UndoRedoManager {
  private history: HistoryState[] = [];
  private pointer = -1;

  /**
   * 添加状态到历史记录
   * 截断未来 redo 记录，并将当前状态添加到历史记录。
   * @param nodes 节点数组
   * @param edges 边数组
   */
  addState(nodes: Node[], edges: Edge[]) {
    // 截断未来 redo 记录
    if (this.pointer < this.history.length - 1) {
      this.history = this.history.slice(0, this.pointer + 1);
    }
    this.history.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    this.pointer++;
  }

  /**
   * 撤销操作
   * 返回上一个历史状态。
   * @returns 历史状态或 null
   */
  undo(): HistoryState | null {
    if (this.pointer > 0) {
      this.pointer--;
      return this.history[this.pointer];
    }
    return null;
  }

  /**
   * 重做操作
   * 返回下一个历史状态。
   * @returns 历史状态或 null
   */
  redo(): HistoryState | null {
    if (this.pointer < this.history.length - 1) {
      this.pointer++;
      return this.history[this.pointer];
    }
    return null;
  }

  get canUndo() { return this.pointer > 0; }
  get canRedo() { return this.pointer < this.history.length - 1; }
}