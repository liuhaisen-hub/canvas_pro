import { IWebGL2DRender } from '@/renderer'
import { ILayer, LayerEvent } from '@/layer'
import { ICamera } from './types'
import { mat4 } from 'gl-matrix'

export class LayerManager {
  private layers: Set<ILayer> = new Set()
  protected effectCount: number = 0
  constructor(
    public renderer: IWebGL2DRender,
    public viewWidth: number,
    public viewHeight: number,
    public camera: ICamera
  ) {
    camera.active(viewWidth, viewHeight)
    this.camera.$on('onCameraChange', this.onCameraChange.bind(this))
  }
  /**************************************************
   * API
   **************************************************/
  has(layer: ILayer) {
    return this.layers.has(layer)
  }
  append(layer: ILayer, zIndex: number) {
    if (this.has(layer)) return
    this.layers.add(layer)
    this.activeLayer(layer, zIndex)
    layer.$on('matrixChange', this.handleLayerMatrixChange.bind(this))
    layer.$on('resize', this.handleLayerResize.bind(this))
    layer.$on('update', this.handleLayerUpdate.bind(this))
  }
  delete(layer?: ILayer) {
    if (layer) {
      this.layers.delete(layer)
    }
    this.layers.clear()
    this.layers = new Set()
  }
  resize(newWidth: number, newHeight: number) {
    this.viewWidth = newWidth
    this.viewHeight = newHeight
    this.camera?.updateViewport(this.viewWidth, this.viewHeight)
    this.updateLayer()
  }
  compose() {
    // 排序
    const layerJob = this.prepareCompose()
    for (let i = 0; i < layerJob.length; i++) {
      const layer = layerJob[i]
      layer.draw()
    }
  }
  // 释放所有资源
  release() {
    this.layers.forEach(layer => {
      layer.release()
      // 移除所有事件监听
      layer.$remove()
    })
    this.delete()
    this.layers.clear()
    this.layers = new Set()
  }
  /**************************************************
   * layer handler
   **************************************************/
  private activeLayer(layer: ILayer, zIndex: number = 1) {
    layer.zIndex = zIndex
    layer.active(this.renderer!)
  }
  private onMatrixChange(layer?: ILayer) {
    this.updateLayer(layer)
  }
  private handleLayerMatrixChange(event: CustomEvent<LayerEvent['matrixChange']>) {
    const { matrix, layer } = event.detail
    // 先保存当前矩阵
    this.renderer.save()
    // 更新矩阵
    this.updateViewMatrix(matrix)
    this.onMatrixChange(layer)
    // 恢复矩阵
    this.renderer.resotre()
  }
  private handleLayerResize(event: CustomEvent<LayerEvent['resize']>) {
    const { newWidth, newHeight, layer } = event.detail
    if (layer.layerType === 'default') {
      this.renderer!.gl.deleteFramebuffer(layer.framebuffer!)
      this.renderer!.gl.deleteTexture(layer.texture!)
      layer.release()
      const { framebuffer, texture } = this.renderer!.createFramebufferObject(newWidth, newHeight)
      layer.framebuffer = framebuffer
      layer.texture = texture
    } else {
      this.renderer!.gl.deleteTexture(layer.texture!)
      layer.release()
    }
  }
  private handleLayerUpdate(event: CustomEvent<LayerEvent['update']>) {
    this.effectCount--
    if (this.effectCount === 0) this.compose()
    if (this.effectCount < 0) this.effectCount = 0
  }
  private onCameraChange() {
    // 先保存当前矩阵
    this.renderer!.save()
    // 更新矩阵
    this.updateViewMatrix()
    this.onMatrixChange()
    // 恢复矩阵
    this.renderer!.resotre()
  }
  private updateViewMatrix(layerTransformMatrix?: mat4) {
    // 计算最终矩阵：Projection × View × LayerTransform × GraphicTransform
    const viewMatrix = this.camera.getViewMatrix() // 获取全局相机的视图矩阵
    if (layerTransformMatrix) {
      // 结合全局视图矩阵和图层自身的变换矩阵
      mat4.multiply(this.renderer.mvMatrix!, viewMatrix, layerTransformMatrix)
      this.renderer.updateMatrixUniforms()
    } else {
      const finileMatrix = mat4.create()
      mat4.multiply(finileMatrix, this.renderer!.mvMatrix!, viewMatrix)
      this.renderer!.mvMatrix = finileMatrix
      this.renderer!.updateMatrixUniforms()
    }
  }
  private prepareCompose() {
    // 从大到小排序
    return [...this.layers].sort((a: ILayer, b: ILayer) => a.zIndex - b.zIndex)
  }
  private updateLayer(updateLayer?: ILayer) {
    if (!updateLayer) {
      // 如果不是单个更新，则整个任务的数量等于整体的大小
      this.effectCount = this.layers.size
      this.layers.forEach(layer => {
        layer.update()
      })
    } else {
      this.effectCount++
      updateLayer.update()
    }
  }
}
