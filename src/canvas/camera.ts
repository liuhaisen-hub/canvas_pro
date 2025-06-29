// import { NativeEvent } from '@threemu2d/'
import { CameraEvent, ICamera } from './types'
import { NativeEvent } from '@/common'
import { mat4, ReadonlyVec3, vec2, vec3 } from 'gl-matrix'
/**
 * 矩阵层级关系：
  投影矩阵（Projection）：由相机维护，处理窗口尺寸变化
  视图矩阵（View）：由相机维护，处理全局平移/旋转/缩放
  模型矩阵（Model）：
  图层级：由layerTransformMatrix维护
  图形级：由每个图形的transformMatrix维护
  最终矩阵 = Projection × View × LayerTransform × GraphicTransform
  投影矩阵 × 视图矩阵 × 图层矩阵 × 图形矩阵
 */
export class Camera extends NativeEvent<CameraEvent> implements ICamera {
  private viewMatrix: mat4 = mat4.create()
  private projectionMatrix: mat4 = mat4.create()
  private width: number = 0
  private height: number = 0
  private translation: vec2 = vec2.create() // 记录平移量
  private scaleX: number = 1.0 // 当前缩放比例
  private scaleY: number = 1.0
  private is_active: boolean = false
  constructor(viewWidth?: number, viewHeight?: number) {
    super()
    viewWidth && viewHeight && this.setup(viewWidth, viewHeight)
  }
  private setup(viewWidth: number, viewHeight: number) {
    this.width = viewWidth
    this.height = viewHeight
    mat4.ortho(this.projectionMatrix, 0, viewWidth, viewHeight, 0, -1, 1)
    mat4.identity(this.viewMatrix)
    this.is_active = true
  }
  active(viewWidth: number, viewHeight: number) {
    this.setup(viewWidth, viewHeight)
  }
  // 平移相机
  pan(tx: number, ty: number) {
    if (!this.is_active) throw Error('camera is not active')
    mat4.translate(this.viewMatrix, this.viewMatrix, [tx, ty, 0])
    vec2.add(this.translation, this.translation, [0, ty]) // 累加平移量
    this.$emit('onCameraChange', { matrix: this.viewMatrix })
  }

  // 绕Z轴旋转（适用于2D）
  rotate(angle: number, centerX?: number, centerY?: number) {
    if (!this.is_active) throw Error('camera is not active')
    const center: ReadonlyVec3 =
      !centerX && !centerY
        ? [this.width / 2, this.height / 2, 0]
        : [...this.getTransformedPt(centerX!, centerY!), 0]
    mat4.translate(this.viewMatrix, this.viewMatrix, center)
    mat4.rotateZ(this.viewMatrix, this.viewMatrix, angle)
    mat4.translate(this.viewMatrix, this.viewMatrix, [-center[0], -center[1], 0])
    this.$emit('onCameraChange', { matrix: this.viewMatrix })
  }

  // 缩放（以视口中心为基准）
  zoom(scaleX: number, scaleY: number, centerX?: number, centerY?: number) {
    if (!this.is_active) throw Error('camera is not active')
    const center: ReadonlyVec3 =
      !centerX && !centerY
        ? [this.width / 2, this.height / 2, 0]
        : [...this.getTransformedPt(centerX!, centerY!), 0]
    mat4.translate(this.viewMatrix, this.viewMatrix, center)
    mat4.scale(this.viewMatrix, this.viewMatrix, [scaleX, scaleY, 1])
    mat4.translate(this.viewMatrix, this.viewMatrix, [-center[0], -center[1], 0])
    // 更新缩放比例
    this.scaleX *= scaleX
    this.scaleY *= scaleY
    this.$emit('onCameraChange', { matrix: this.viewMatrix })
  }
  // 实现 lookAt 方法
  lookAt(targetX: number, targetY: number) {
    if (!this.is_active) throw Error('camera is not active')
    const tp = this.getTransformedPt(targetX, targetY)
    // 计算目标点到视口中心的偏移量
    const centerX = this.width / 2
    const centerY = this.height / 2
    const offsetX = centerX - tp[0]
    const offsetY = centerY - tp[1]

    // 重置视图矩阵
    mat4.identity(this.viewMatrix)

    // 将目标点移动到视口中心
    mat4.translate(this.viewMatrix, this.viewMatrix, [offsetX, offsetY, 0])
    this.$emit('onCameraChange', { matrix: this.viewMatrix })
  }
  getViewMatrix() {
    return this.viewMatrix
  }
  getProjectionMatrix() {
    return this.projectionMatrix
  }
  updateViewport(width: number, height: number) {
    this.width = width
    this.height = height
    mat4.ortho(this.projectionMatrix, 0, width, height, 0, -1, 1)
  }
  getTransformedPt(x: number, y: number): [number, number] {
    const tPt = vec3.fromValues(x, y, 0.0)
    vec3.transformMat4(tPt, tPt, this.viewMatrix)
    return [tPt[0], tPt[1]]
  }
  // 获取相机在浏览器坐标系中的平移量
  getBrowserTranslation(): vec2 {
    // 假设视口在浏览器中的位置是 (0, 0)，如果是其他位置需要调整
    return this.translation
  }
  // 如果视口在浏览器中的位置不是 (0, 0)，可以使用以下方法
  getBrowserTranslationWithViewport(viewportX: number, viewportY: number): vec2 {
    return [this.translation[0] + viewportX, this.translation[1] + viewportY]
  }
  getScale() {
    return {
      x: this.scaleX,
      y: this.scaleY
    }
  }
}
