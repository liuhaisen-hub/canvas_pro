import { CustomEventListener } from './types'

export interface ListenerRecord<T> {
  name: keyof T & string
  callback: CustomEventListener<T[keyof T]>
}

export class NativeEvent<T> extends EventTarget {
  private recorder: ListenerRecord<T>[] = []

  // 触发事件
  $emit(name: keyof T & string, data: T[keyof T]) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: data
      })
    )
  }

  // 监听事件
  $on<E extends keyof T & string>(name: E, listener: CustomEventListener<T[E]>) {
    this.recorder.push({
      name,
      callback: listener as CustomEventListener<T[keyof T]>
    })
    return this.addEventListener(name, listener as EventListener)
  }

  // 移除所有事件
  $remove(name?: keyof T & string) {
    if (name) {
      this.recorder = this.recorder.filter(record => record.name !== name)
      this.removeEventListener(
        name,
        this.recorder.find(record => record.name === name)?.callback as EventListener
      )
    } else {
      this.recorder.forEach(record => {
        this.removeEventListener(record.name, record.callback as EventListener)
      })
      this.recorder = []
    }
  }
}
