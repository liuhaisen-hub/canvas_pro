import { IWebGL2DRender, WebGL2DRender } from '@/renderer'

import { getDevicePixelRatio, isFunction, NativeEvent, setStyle } from '@/common'
import { CanvasEvent, CreateCanvasProOptions, ICanvas } from './types'
import { ILayer } from '@/layer'
import { vec3 } from 'gl-matrix'
import { LayerManager } from './manager'
import { createCamera } from '@/modules'

/**
 * 对整个canvas的抽象
 */
export class CanvasImpl extends NativeEvent<CanvasEvent> implements ICanvas {
  private targetWidth: number = 0
  private targetHeight: number = 0
  private viewWidth: number = 0
  private viewHeight: number = 0
  dpr: number = 0
  renderer: IWebGL2DRender
  container: HTMLElement | undefined = undefined
  protected mainCanvas: HTMLCanvasElement | null = null
  protected layerManager: LayerManager
  rect: DOMRect | undefined = undefined
  constructor(
    domElement: HTMLElement,
    options: CreateCanvasProOptions = {
      width: 350,
      height: 350,
      camera: null
    }
  ) {
    super()
    this.dpr = getDevicePixelRatio()
    this.setup(domElement, options)
    const gl = this.mainCanvas!.getContext('webgl2') as WebGL2RenderingContext
    this.renderer = new WebGL2DRender(gl)
    const camera = options.camera ?? createCamera()
    this.layerManager = new LayerManager(this.renderer, this.viewWidth, this.viewHeight, camera)
  }
  /**************************************************
   * setup
   **************************************************/
  private setup(element: HTMLElement, options: CreateCanvasProOptions) {
    if (element instanceof HTMLCanvasElement) return this.setupWithCanvasElement(element, options)
    return this.setupWithContainerElement(element, options)
  }
  private setupWithCanvasElement(canvas: HTMLCanvasElement, options: CreateCanvasProOptions) {
    // target等于自己本身
    this.targetWidth = options.width
    this.targetHeight = options.height
    this.viewWidth = this.targetWidth * this.dpr
    this.viewHeight = this.targetHeight * this.dpr
    canvas.width = this.viewWidth
    canvas.height = this.viewHeight
    canvas.dataset.type = 'main_canvas'
    this.mainCanvas = canvas
  }
  private setupWithContainerElement(element: HTMLElement, options: CreateCanvasProOptions) {
    this.targetWidth = element.offsetWidth ?? options.width
    this.targetHeight = element.offsetHeight ?? options.height
    this.mainCanvas = document.createElement('canvas')
    this.viewWidth = this.targetWidth * this.dpr
    this.viewHeight = this.targetHeight * this.dpr
    this.mainCanvas.width = this.viewWidth
    this.mainCanvas.height = this.viewHeight
    this.mainCanvas.dataset.type = 'main_canvas'
    this.rect = this.mainCanvas.getBoundingClientRect()
    setStyle(this.mainCanvas, {
      width: this.targetWidth + 'px',
      height: this.targetHeight + 'px'
    })
    element.appendChild(this.mainCanvas)
    this.container = element
  }
  private resizeCanvas() {
    const element = this.container || this.mainCanvas
    this.targetWidth = element!.offsetWidth
    this.targetHeight = element!.offsetHeight
    this.viewWidth = this.targetWidth * this.dpr
    this.viewHeight = this.targetHeight * this.dpr
    this.mainCanvas!.width = this.viewWidth
    this.mainCanvas!.height = this.viewHeight
  }
  /**************************************************
   * Layer API
   **************************************************/
  append(layer: ILayer, zIndex: number = 1) {
    this.layerManager.append(layer, zIndex)
  }
  deleteLayer(layer: ILayer) {
    this.layerManager.delete(layer)
  }
  compose() {
    this.layerManager.compose()
  }
  resize() {
    this.resizeCanvas()
    this.renderer!.resize()
    this.layerManager.resize(this.viewWidth, this.viewHeight)
    this.$emit('onresize', {
      width: this.viewWidth,
      height: this.viewHeight
    })
  }
  /**************************************************
   * method
   **************************************************/
  // 逆矩阵获转换世界坐标
  getTransformedPt(x: number, y: number) {
    const tPt = vec3.fromValues(x, y, 0.0)
    vec3.transformMat4(tPt, tPt, this.renderer!.mvMatrix!)
    return [tPt[0], tPt[1]]
  }
  getContext() {
    return this.renderer
  }
  get width() {
    return this.viewWidth
  }
  get height() {
    return this.viewHeight
  }
  get mvMatrix() {
    return this.renderer!.mvMatrix!
  }
  get clientWidth() {
    return this.targetWidth
  }
  get clientHeight() {
    return this.targetHeight
  }
  get parent() {
    return this.container || (this.mainCanvas!.parentNode as HTMLElement)
  }
  set width(val: number) {
    this.mainCanvas!.width = val * this.dpr
    this.mainCanvas!.style.width = val + 'px'
  }
  set height(val: number) {
    this.mainCanvas!.height = val * this.dpr
    this.mainCanvas!.style.height = val + 'px'
  }
}
