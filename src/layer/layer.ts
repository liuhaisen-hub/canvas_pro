import { generateTimstrap, isArray, isFunction, NativeEvent } from '@/common'
import { ILayer, LayerEvent, LayerType, RenderFunction } from './types'
import { mat4 } from 'gl-matrix'
import { IWebGL2DRender } from '@/renderer'
import { TextureAttribute } from '@/shape'

/**
 * 对于2d文字，layer就是一个canvas2d绘制出来的texture
 * 对于一个3dto2d 或者3d图形的集合， layer是一个farmaebuffer, 或者是一个texture
 * 最后再合成到主屏幕上
 */
export class DefalutLayer extends NativeEvent<LayerEvent> implements ILayer {
  id: string
  layerTransformMatrix: mat4
  dirty: boolean = false
  framebuffer: WebGLFramebuffer | undefined
  texture: WebGLTexture | undefined
  is_active: boolean = false
  zIndex: number = 1
  renderer: IWebGL2DRender | undefined
  private store: TextureAttribute[] = []
  protected effects: Array<RenderFunction> = []
  constructor(
    public width: number,
    public height: number,
    public name: string,
    public layerType: LayerType
  ) {
    super()
    this.id = name + generateTimstrap()
    this.layerTransformMatrix = mat4.create() // 图层自身的变换矩阵
    mat4.identity(this.layerTransformMatrix) // 初始化为单位矩阵
  }
  resize(newWidth: number, newHeight: number) {
    this.width = newWidth
    this.height = newHeight
    this.$emit('resize', {
      layer: this,
      newWidth,
      newHeight
    })
  }
  active(renderer: IWebGL2DRender) {
    this.renderer = renderer
    const { framebuffer, texture } = renderer.createFramebufferObject(this.width, this.height)
    this.framebuffer = framebuffer
    this.texture = texture
    this.is_active = true
  }
  // 释放所有资源
  release() {
    this.reset()
    this.effects = []
    this.renderer = undefined
    this.framebuffer = undefined
    this.texture = undefined
    this.$emit('release', { layer: this })
    this.$remove()
  }
  // 重置资源
  reset() {
    this.renderer?.clearOffScrenn(this.framebuffer!, this.width, this.height)
    this.renderer?.gl.deleteTexture(this.texture!)
    this.renderer?.gl.deleteFramebuffer(this.framebuffer!)
    this.framebuffer = undefined
    this.texture = undefined
    const { framebuffer, texture } = this.renderer!.createFramebufferObject(this.width, this.height)
    this.framebuffer = framebuffer
    this.texture = texture
    // 重置时，会清空Store，所有不是effects下绘制的图形都会被清空
    if (this.store.length !== 0) {
      this.store.forEach(({ texture }) => {
        this.renderer?.gl.deleteTexture(texture)
      })
      this.store.length = 0
      this.store = []
    }
  }
  // 缩放 平移
  translate(tx: number, ty: number) {
    mat4.translate(this.layerTransformMatrix, this.layerTransformMatrix, [tx, ty, 0])
    this.$emit('matrixChange', {
      matrix: this.layerTransformMatrix,
      layer: this
    })
  }
  scale(sx: number, sy: number, centerX?: number, centerY?: number) {
    centerX = centerX ? centerX : this.width / 2
    centerY = centerY ? centerY : this.height / 2
    mat4.translate(this.layerTransformMatrix, this.layerTransformMatrix, [centerX, centerY, 0])
    mat4.scale(this.layerTransformMatrix, this.layerTransformMatrix, [sx, sy, 1])
    mat4.translate(this.layerTransformMatrix, this.layerTransformMatrix, [-centerX, -centerY, 0])
    this.$emit('matrixChange', {
      matrix: this.layerTransformMatrix,
      layer: this
    })
  }
  render() {
    if (!this.active)
      throw TypeError('The layer must be append to the canvas container before it is used.')
    if (arguments.length === 0) throw Error('')
    if (isFunction(arguments[0])) return this.useEffects(arguments[0] as RenderFunction)
    return this.recordStore(arguments[0] as TextureAttribute[] | TextureAttribute)
  }
  private useEffects(fun: RenderFunction, is_record: boolean = true) {
    const _fun = fun
    const result = _fun(this.renderer!)
    if (!result) {
      // 空值函数
      this.renderer!.renderToOffscreen(this.framebuffer!, this.width, this.height, () => {
        fun(this.renderer!)
      })
    } else {
      this.recordStore(result)
    }
    // 是否记录对应的函数
    is_record && this.effects.push(fun)
  }
  private recordStore(textures: TextureAttribute | TextureAttribute[]) {
    if (isArray(textures)) {
      this.store.push(...textures)
    } else {
      this.store.push(textures)
    }
  }
  update() {
    this.$emit('beforeUpdate', { layer: this })
    this.reset()
    this.effects.forEach(drawFun => {
      this.useEffects(drawFun, false)
    })
    this.dirty = true
    this.$emit('update', { layer: this })
  }
  draw() {
    if (!this.renderer || !this.framebuffer || !this.texture) return
    this.$emit('befoerDraw', { layer: this })
    this.renderer.renderToScreen(this.framebuffer, this.texture)
    if (this.store.length > 0) {
      for (let i = 0; i < this.store.length; i++) {
        const { texture, x, y, width, height } = this.store[i]
        this.renderer!.drawTexture(texture, x, y, width, height)
      }
    }
    // 已经渲染到主屏幕
    this.dirty = false
  }
}
