export type textLineWidth = 'center' | 'left' | 'right'
export type textLineHeight = 'center' | 'top' | 'bottom'
export type CustomEventListener<T> = (this: EventTarget, ev: CustomEvent<T>) => void
