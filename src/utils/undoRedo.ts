import type { Node, Edge } from 'reactflow';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export class UndoRedoManager {
  private history: HistoryState[] = [];
  private pointer = -1;

  addState(nodes: Node[], edges: Edge[]) {
    // 截断未来 redo 记录
    if (this.pointer < this.history.length - 1) {
      this.history = this.history.slice(0, this.pointer + 1);
    }
    this.history.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    this.pointer++;
  }

  undo(): HistoryState | null {
    if (this.pointer > 0) {
      this.pointer--;
      return this.history[this.pointer];
    }
    return null;
  }

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