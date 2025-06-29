import { ILayer } from '@/layer'
import { IWebGL2DRender } from '@/renderer'
import { NativeEvent } from '@/common'
import { mat4, vec2 } from 'gl-matrix'
export interface CreateCanvasProOptions {
  width: number
  height: number
  camera: ICamera | null
}
export interface CanvasEvent {
  onresize: {
    width: number
    height: number
  }
}
export interface CameraEvent {
  onCameraChange: {
    matrix: mat4
  }
}
export interface ICanvas extends NativeEvent<CanvasEvent> {
  dpr: number
  renderer: IWebGL2DRender | undefined
  rect: DOMRect | undefined
  append(layer: ILayer, zIndex: number): void
  resize(): void
  compose(): void
  getTransformedPt(x: number, y: number): number[]
  deleteLayer(layer: ILayer): void
  mount?(element: Exclude<HTMLElement, HTMLCanvasElement>): void
  getContext(): IWebGL2DRender | RenderingContext
  get width(): number
  get height(): number
  get mvMatrix(): mat4
  get clientWidth(): number
  get clientHeight(): number
  get parent(): HTMLElement
}
export interface ICamera extends NativeEvent<CameraEvent> {
  active(viewWidth: number, viewHeight: number): void
  // 平移相机
  pan(tx: number, ty: number): void

  // 绕Z轴旋转（适用于2D）
  rotate(angle: number, centerX?: number, centerY?: number): void

  // 缩放（以视口中心为基准）
  zoom(scale: number, centerX?: number, centerY?: number): void
  // 实现 lookAt 方法
  lookAt(targetX: number, targetY: number): void
  getViewMatrix(): mat4
  getProjectionMatrix(): mat4
  updateViewport(width: number, height: number): void
  // 获取相机在浏览器坐标系中的平移量
  getBrowserTranslation(): vec2
  // 如果视口在浏览器中的位置不是 (0, 0)，可以使用以下方法
  getBrowserTranslationWithViewport(viewportX: number, viewportY: number): vec2
  getScale(): { x: number; y: number }
}
