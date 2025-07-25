/**
 * VlabViewer 事件总线系统
 * 实现模块间的解耦通信
 */

export type EventCallback<T = any> = (data: T) => void;
export type UnsubscribeFn = () => void;

/**
 * 事件总线接口
 */
export interface EventBus {
  subscribe<T>(event: string, callback: EventCallback<T>): UnsubscribeFn;
  unsubscribe(event: string, callback: EventCallback): void;
  emit<T>(event: string, data?: T): void;
  once<T>(event: string, callback: EventCallback<T>): UnsubscribeFn;
  clear(event?: string): void;
  getListeners(event: string): EventCallback[];
}

/**
 * 事件总线实现
 */
export class VlabEventBus implements EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private onceListeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * 订阅事件
   */
  subscribe<T>(event: string, callback: EventCallback<T>): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    return () => this.unsubscribe(event, callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
    
    const onceEventListeners = this.onceListeners.get(event);
    if (onceEventListeners) {
      onceEventListeners.delete(callback);
      
      if (onceEventListeners.size === 0) {
        this.onceListeners.delete(event);
      }
    }
  }

  /**
   * 发射事件
   */
  emit<T>(event: string, data?: T): void {
    // 处理普通监听器
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }

    // 处理一次性监听器
    const onceEventListeners = this.onceListeners.get(event);
    if (onceEventListeners) {
      const callbacks = Array.from(onceEventListeners);
      this.onceListeners.delete(event);
      
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in once event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * 订阅一次性事件
   */
  once<T>(event: string, callback: EventCallback<T>): UnsubscribeFn {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    
    this.onceListeners.get(event)!.add(callback);
    
    return () => this.unsubscribe(event, callback);
  }

  /**
   * 清空监听器
   */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * 获取事件监听器
   */
  getListeners(event: string): EventCallback[] {
    const listeners = this.listeners.get(event) || new Set();
    const onceListeners = this.onceListeners.get(event) || new Set();
    
    return [...Array.from(listeners), ...Array.from(onceListeners)];
  }

  /**
   * 获取所有事件名称
   */
  getEventNames(): string[] {
    const events = new Set([
      ...this.listeners.keys(),
      ...this.onceListeners.keys()
    ]);
    return Array.from(events);
  }

  /**
   * 获取监听器数量
   */
  getListenerCount(event?: string): number {
    if (event) {
      const listeners = this.listeners.get(event)?.size || 0;
      const onceListeners = this.onceListeners.get(event)?.size || 0;
      return listeners + onceListeners;
    } else {
      let total = 0;
      this.listeners.forEach(set => total += set.size);
      this.onceListeners.forEach(set => total += set.size);
      return total;
    }
  }
}

// ===== 预定义事件类型 =====

/**
 * 拓扑相关事件
 */
export interface TopologyEvents {
  'topology:loaded': { topology: any };
  'topology:saved': { topology: any };
  'topology:changed': { topology: any; changes: any[] };
  'topology:validated': { topology: any; result: any };
  
  'node:added': { node: any };
  'node:updated': { node: any; changes: any };
  'node:removed': { nodeId: string };
  'node:selected': { nodeId: string };
  'node:deselected': { nodeId: string };
  
  'connection:added': { connection: any };
  'connection:updated': { connection: any; changes: any };
  'connection:removed': { connectionId: string };
  
  'snapshot:created': { snapshot: any };
  'snapshot:restored': { snapshot: any };
}

/**
 * 测试相关事件
 */
export interface TestEvents {
  'test:created': { testCase: any };
  'test:updated': { testCase: any; changes: any };
  'test:deleted': { testCaseId: string };
  'test:started': { testCase: any; executionId: string };
  'test:completed': { result: any };
  'test:failed': { testCase: any; error: any };
  'test:cancelled': { testCaseId: string; executionId: string };
  'test:execution:started': { testCase: any; executionId: string };
  'test:execution:completed': { result: any };
  'test:execution:failed': { testCase: any; error: any };
  
  'suite:created': { testSuite: any };
  'suite:updated': { testSuite: any; changes: any };
  'suite:deleted': { testSuiteId: string };
  'suite:executed': { testSuite: any; results: any[] };
  'test:suite:execution:started': { testSuite: any; executionId: string };
  'test:suite:execution:completed': { results: any[] };
  'test:suite:execution:failed': { testSuite: any; error: any };
  
  'coverage:generated': { coverage: any };
  'report:generated': { report: any; format: string };
}

/**
 * 激励相关事件
 */
export interface StimulusEvents {
  'stimulus:created': { stimulus: any };
  'stimulus:updated': { stimulus: any; changes: any };
  'stimulus:deleted': { stimulusId: string };
  'stimulus:executed': { stimulus: any; result: any };
  'stimulus:failed': { stimulus: any; error: any };
  
  'template:loaded': { template: any };
  'template:applied': { template: any; parameters: any };
}

/**
 * UI相关事件
 */
export interface UIEvents {
  'ui:panel-opened': { panelId: string };
  'ui:panel-closed': { panelId: string };
  'ui:panel-resized': { panelId: string; size: any };
  'ui:tab-changed': { tabId: string; panelId: string };
  'ui:modal-opened': { modalId: string };
  'ui:modal-closed': { modalId: string };
  'ui:notification': { type: string; message: string };
}

/**
 * 应用级事件
 */
export interface AppEvents {
  'app:initialized': {};
  'app:ready': {};
  'app:shutdown': {};
  'app:error': { error: any };
  
  'project:opened': { project: any };
  'project:saved': { project: any };
  'project:closed': { projectId: string };
  
  'user:login': { user: any };
  'user:logout': { userId: string };
}

// 合并所有事件类型
export interface AllEvents extends 
  TopologyEvents,
  TestEvents, 
  StimulusEvents,
  UIEvents,
  AppEvents {}

// 类型安全的事件总线
export class TypedEventBus {
  private eventBus = new VlabEventBus();

  subscribe<K extends keyof AllEvents>(
    event: K,
    callback: (data: AllEvents[K]) => void
  ): UnsubscribeFn {
    return this.eventBus.subscribe(event, callback);
  }

  emit<K extends keyof AllEvents>(
    event: K,
    data: AllEvents[K]
  ): void {
    this.eventBus.emit(event, data);
  }

  once<K extends keyof AllEvents>(
    event: K,
    callback: (data: AllEvents[K]) => void
  ): UnsubscribeFn {
    return this.eventBus.once(event, callback);
  }

  unsubscribe<K extends keyof AllEvents>(
    event: K,
    callback: (data: AllEvents[K]) => void
  ): void {
    this.eventBus.unsubscribe(event, callback);
  }

  clear(event?: keyof AllEvents): void {
    this.eventBus.clear(event);
  }

  getListenerCount(event?: keyof AllEvents): number {
    return this.eventBus.getListenerCount(event);
  }
}

// 全局事件总线实例
export const globalEventBus = new TypedEventBus();

// 导出便捷函数
export const { subscribe, emit, once, unsubscribe, clear } = globalEventBus;
