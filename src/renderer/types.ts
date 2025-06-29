import { ShaderProgramImpl, UserShaderKeySymbol } from '@/shader'
import { CanvasPattern } from './pattern'
import { mat4, vec3 } from 'gl-matrix'

export interface IWebGL {
  activeShaderProgram: ShaderProgramImpl | null
  vertexBuffer: WebGLBuffer
  pMatrix: mat4 | undefined
  invMvMatrix: mat4 | undefined
  mvMatrix: mat4 | undefined
  shaderProgramMap: Record<UserShaderKeySymbol, ShaderProgramImpl | null>
  gl: WebGL2RenderingContext
  // shader method
  applyShader(val: ApplyShaderSymbol, alpha?: number): void
  configColorShader(val: string, alpha: number): void
  configParttenShader(val: CanvasPattern, alpha: number): void
  configureVertexAttributes(): void
  setShaderProgram(key: UserShaderKeySymbol): void

  // Pixel data methods 纹理操作
  createTexture(
    source: HTMLCanvasElement | HTMLImageElement | ImageBitmap | OffscreenCanvas
  ): WebGLTexture
  drawTexture(texture: WebGLTexture, x: number, y: number, width: number, height: number): void
  release(): void
  createFramebufferObject(
    width: number,
    height: number
  ): { framebuffer: WebGLFramebuffer; texture: WebGLTexture }

  // 属性操作
  applyCompositingState(): void
  setBackgrondTransparent(): void

  // 矩阵操作
  initializeMatrix(pMatrix: mat4): void
  updateViewPort(newWidth?: number, newHeight?: number): void
  getInvMatrix(): mat4
  updateMatrixUniforms(): void
  getTransformedPt(x: number, y: number): number[]
  getUntransformedPt(x: number, y: number): number[]

  // 离屏和矩阵操作
  renderToOffscreen(
    framebuffer: WebGLFramebuffer,
    width: number,
    height: number,
    drawFunction: () => void
  ): void
  clearOffScrenn(framebuffer: WebGLFramebuffer, width: number, height: number): void
  renderToScreen(framebuffer: WebGLFramebuffer, texture: WebGLTexture): void
  save(): void
  resotre(): void
  clearTexture(texture: WebGLTexture, width: number, height: number): void
}

export interface IWebGL2DRender extends IWebGL {
  defaultFramebuffer: WebGLFramebuffer | undefined
  defaultTexture: WebGLTexture | undefined
  resize(): void
  // rect method
  fillRect(x: number, y: number, w: number, h: number, color?: string, alpha?: number): void
  fillText(
    x: number,
    y: number,
    w: number,
    content: string,
    color?: string,
    font?: string,
    textAlign?: CanvasTextAlign,
    textBaseline?: CanvasTextBaseline
  ): void
  strokeRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color?: string,
    lineWidth?: number,
    alpha?: number
  ): void
  clearRect(x: number, y: number, w: number, h: number): void

  // path method
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  stroke(
    color?: string,
    lineWidth?: number,
    alpha?: number,
    pattern?: Partial<PathPatternOptions> | null
  ): void
  strokeArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean,
    color?: string,
    lineWidth?: number,
    alpha?: number
  ): void
  fillArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean,
    color?: string,
    alpha?: number
  ): void

  // curve method
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean,
    numSegments?: number,
    color?: string,
    alpha?: number
  ): void
  arcTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
    color?: string,
    alpha?: number
  ): void
  quadraticCurveTo(
    cpx: number,
    cpy: number,
    x: number,
    y: number,
    color?: string,
    alpha?: number
  ): void
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number,
    color?: string,
    alpha?: number
  ): void
  fillTriangle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color?: string,
    alpha?: number
  ): void
  strokeTriangle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color?: string,
    lineWidth?: number,
    alpha?: number
  ): void

  // 图层变换
  scale(x: number, y: number, auto?: boolean): void
  rotate(angle: number): void
  translate(x: number, y: number): void
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void

  // scissor method
  scissor(
    framebuffer: WebGLFramebuffer,
    width: number,
    height: number,
    drawFunction: () => void
  ): void

  // helper method
  updateTextureRegion(
    texture: WebGLTexture,
    x: number,
    y: number,
    data: Uint8Array,
    width: number,
    height: number
  ): void
  // Pixel data methods 图片相关操作
  putImageData(
    imagedata: ImageData,
    dx: number,
    dy: number,
    dirtyX?: number,
    dirtyY?: number,
    dirtyWidth?: number,
    dirtyHeight?: number
  ): void
  drawImageData(vertices: number[], asset: Asset, type?: 'put' | 'draw'): void
  drawImage(asset: Asset, dx: number, dy: number): void
  drawImage(asset: Asset, dx: number, dy: number, dw: number, dh: number): void
  drawImage(
    asset: Asset,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ): void
  /**************************************************
   * static method
   **************************************************/
  get lineWidth(): number
  get fillStyle(): string
  get font(): string
  get textAlign(): string
  get textBaseline(): string
  set fillStyle(val: string)
  set strokeStyle(val: string)
  set lineWidth(val: string)
  set textBaseline(val: CanvasTextBaseline)
  set textAlign(val: CanvasTextAlign)
}
export type IWebGL2DRenderKey = keyof IWebGL2DRender
export interface Asset {
  width: number
  height: number
  data: Uint8Array | WebGLTexture
  nodeName?: string
}
// 线段处理器
export type PathPatternOptions = {
  miterLimit: number
  thickness: number
  lineJoin: 'miter' | 'bevel' | 'round'
  lineCap: 'butt' | 'square' | 'round'
}
export type PatternShaderRepeatSymbol =
  | 'no-repeat'
  | 'repeat-x'
  | 'repeat-y'
  | 'repeat'
  | 'src-rect'
export type ApplyShaderSymbol = string | ShaderProgramImpl | CanvasPattern
//  定义一个泛型类型，用于表示固定长度的数组
type FixedLengthArray<T, N extends number> = N extends 0
  ? []
  : T extends Float32Array
  ? Float32Array & { length: N }
  : T[] & { length: N }

export interface CameraInterface {
  move: (dx: number, dy: number) => void
  zoom: (scaleFactor: number) => void
  getViewMatrix: () => mat4
}
export interface ArcParams {
  startIdx: number
  endIdx: number
  center: vec3
  radius: number
}
export enum TreeStatus {
  ready = 0,
  dirty = 1,
  render = 2
}
export interface Tree<T> {
  status: TreeStatus
  store: T[]
}
export interface FobObject {
  framebuffer: WebGLFramebuffer
  texture: WebGLTexture
}

export interface StyleState {
  fillStyle: string
  strokeStyle: string
  font: string
  lineWidth: number
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  alpha: number
  anticlockwise: boolean
}
