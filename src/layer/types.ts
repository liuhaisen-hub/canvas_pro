import { IWebGL2DRender } from '@/renderer'
import { TextureAttribute } from '@/shape'
import { NativeEvent } from '@/common'
import { mat4 } from 'gl-matrix'
export type RenderFunction<T = void | TextureAttribute[] | TextureAttribute> = (
  ctx: IWebGL2DRender
) => T
export interface LayerEvent {
  matrixChange: {
    matrix: mat4
    layer: ILayer
  }
  resize: {
    layer: ILayer
    newWidth: number
    newHeight: number
  }
  beforeUpdate: {
    layer: ILayer
  }
  update: {
    layer: ILayer
  }
  befoerDraw: {
    layer: ILayer
  }
  render: {
    layer: ILayer
  }
  release: {
    layer: ILayer
  }
}
export type LayerType = 'default' | 'texture'
export interface ILayer extends NativeEvent<LayerEvent> {
  id: string
  layerTransformMatrix: mat4
  dirty: boolean
  framebuffer: WebGLFramebuffer | undefined
  texture: WebGLTexture | undefined
  is_active: boolean
  zIndex: number
  layerType: LayerType
  name: string
  width: number
  height: number
  renderer: IWebGL2DRender | undefined
  // 激活图层
  active(renderer: IWebGL2DRender): void
  resize(newWidth: number, newHeight: number): void
  // 释放所有资源
  release(): void
  // 重置资源
  reset(): void
  // 平移图层
  translate(tx: number, ty: number): void
  // 缩放图层
  scale(sx: number, sy: number, centerX?: number, centerY?: number): void
  render(callback: RenderFunction): void
  render(texture: TextureAttribute | TextureAttribute[]): void
  draw(): void
  update(): void
}
