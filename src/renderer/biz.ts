import { mat4 } from 'gl-matrix'
import { ArcParams, Asset, IWebGL2DRender, PathPatternOptions, StyleState } from './types'
import { WebGLImpl } from './webgl'
import { createPattern, isValidCanvasImageSource } from '@/common'

/**
 * 对业务层进行抽象
 */
export class WebGL2DRender extends WebGLImpl implements IWebGL2DRender {
  private subpaths: Array<number[] & { closed?: boolean }> = []
  private subpathsModified: boolean = false
  private styleState: StyleState = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    font: '10px sans-serif',
    lineWidth: 1,
    textAlign: 'center',
    textBaseline: 'alphabetic',
    alpha: 1.0,
    anticlockwise: false
  }
  private currentSubpath: Array<number> & { closed?: boolean; _arcs?: ArcParams[] } = []
  defaultFramebuffer: WebGLFramebuffer
  defaultTexture: WebGLTexture
  constructor(gl: WebGL2RenderingContext) {
    super(gl)
    const { framebuffer, texture } = this.createFramebufferObject(
      this.gl.canvas.width,
      this.gl.canvas.height
    )
    this.defaultFramebuffer = framebuffer
    this.defaultTexture = texture
  }
  resize() {
    this.updateViewPort()
  }
  clean() {
    this.clearOffScrenn(this.defaultFramebuffer, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.deleteFramebuffer(this.defaultFramebuffer)
    this.gl.deleteTexture(this.defaultTexture)
    const { framebuffer, texture } = this.createFramebufferObject(
      this.gl.canvas.width,
      this.gl.canvas.height
    )
    this.defaultFramebuffer = framebuffer
    this.defaultTexture = texture
  }
  /**************************************************
   * rect method
   **************************************************/
  fillRect(x: number, y: number, w: number, h: number, color?: string, alpha?: number) {
    const vertices = [x, y, x, y + h, x + w, y, x + w, y + h]
    color = color || this.styleState.fillStyle
    alpha = alpha || this.styleState.alpha
    this.applyShader(color, alpha)
    if (this.activeShaderProgram === null) return
    // this.gl.uniform1i(this.activeShaderProgram.uniforms['uSkipMVTransform'], 1)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'] as GLint,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, vertices.length / 2)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
  }
  strokeRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color?: string,
    lineWidth?: number,
    alpha?: number
  ) {
    color = color || this.styleState.strokeStyle
    alpha = alpha || this.styleState.alpha
    lineWidth = lineWidth || this.styleState.lineWidth
    this.gl.lineWidth(lineWidth)
    const topLeft = this.getTransformedPt(x, y)
    const bottomRight = this.getTransformedPt(x + w, y + h)
    const halfLineWidth = lineWidth / 2 // 线宽的一半
    // 定义矩形的 4 个角点
    const x1 = topLeft[0] - halfLineWidth
    const y1 = topLeft[1] - halfLineWidth
    const x2 = bottomRight[0] + halfLineWidth
    const y2 = bottomRight[1] + halfLineWidth
    // 生成矩形边框的顶点数据
    const vertices = [
      // 上边
      x1,
      y1,
      x2,
      y1,
      x1,
      y1 + lineWidth,
      x2,
      y1,
      x1,
      y1 + lineWidth,
      x2,
      y1 + lineWidth,

      // 右边
      x2,
      y1,
      x2,
      y2,
      x2 - lineWidth,
      y1,
      x2,
      y2,
      x2 - lineWidth,
      y1,
      x2 - lineWidth,
      y2,

      // 下边
      x1,
      y2,
      x2,
      y2,
      x1,
      y2 - lineWidth,
      x2,
      y2,
      x1,
      y2 - lineWidth,
      x2,
      y2 - lineWidth,

      // 左边
      x1,
      y1,
      x1,
      y2,
      x1 + lineWidth,
      y1,
      x1,
      y2,
      x1 + lineWidth,
      y1,
      x1 + lineWidth,
      y2
    ]
    this.applyShader(color, alpha)

    if (this.activeShaderProgram === null) {
      return
    }
    // 绑定顶点数据并绘制
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )
    this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null)
  }
  clearRect(x: number, y: number, w: number, h: number) {
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ZERO)
    this.fillRect(x, y, w, h, 'rgba(0,0,0,0)', 1.0)
  }
  beginPath() {
    if (arguments.length !== 0) throw new TypeError()
    this.subpaths = [[]]
    this.subpathsModified = true
    this.currentSubpath = this.subpaths[0]
    this.currentSubpath.closed = false
  }
  closePath() {
    if (arguments.length !== 0) throw new TypeError()
    if (this.currentSubpath.length >= 2) {
      this.currentSubpath.closed = true
      const baseIdx = this.currentSubpath.length - 2
      this.currentSubpath = []
      this.currentSubpath.closed = false
      this.subpathsModified = true
      this.subpaths.push(this.currentSubpath)
      this.currentSubpath.push(this.currentSubpath[baseIdx])
      this.currentSubpath.push(this.currentSubpath[baseIdx + 1])
    }
  }
  moveTo(x: number, y: number) {
    if (arguments.length !== 2) throw new TypeError()

    if (!isFinite(x) || !isFinite(y)) {
      return
    }

    this.currentSubpath = []
    this.currentSubpath.closed = false
    this.subpathsModified = true
    const tPt = this.getTransformedPt(x, y)
    this.currentSubpath.push(tPt[0])
    this.currentSubpath.push(tPt[1])
    this.subpaths.push(this.currentSubpath)
  }
  lineTo(x: number, y: number) {
    if (arguments.length !== 2) throw new TypeError()

    // if (!isFinite(x) || !isFinite(y)) {
    //   y.valueOf() // Call to make 2d.path.lineTo.nonfinite.details happy
    //   return
    // }
    if (!this.ensureStartPath(x, y)) {
      return
    }

    const tPt = this.getTransformedPt(x, y)
    this.currentSubpath.push(tPt[0])
    this.currentSubpath.push(tPt[1])
    this.subpathsModified = true
  }
  stroke(
    color?: string,
    lineWidth?: number,
    alpha?: number,
    pattern: Partial<PathPatternOptions> | null = null
  ) {
    if (this.subpaths.length === 0) return
    color = color || this.styleState.strokeStyle
    lineWidth = lineWidth || this.styleState.lineWidth
    const vertices =
      pattern === null ? this.makeStroke(lineWidth) : this.makePatternStroke(lineWidth, pattern)
    this.applyShader(color, alpha)
    if (this.activeShaderProgram === null) return

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )

    this.gl.drawArrays(this.gl.TRIANGLES, 0, vertices.length / 2)
  }
  //anticlockwise 顺时针和逆时针
  strokeArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise: boolean = false,
    color?: string,
    lineWidth?: number,
    alpha?: number
  ) {
    if (radius < 0) throw new DOMException('Radius cannot be negative', 'IndexSizeError')
    color = color || this.styleState.strokeStyle
    lineWidth = lineWidth || this.styleState.lineWidth
    alpha = alpha || this.styleState.alpha
    // 转换角度方向
    if (anticlockwise && startAngle < endAngle) {
      endAngle -= 2 * Math.PI
    } else if (!anticlockwise && startAngle > endAngle) {
      endAngle += 2 * Math.PI
    }

    const numSegments = Math.max(30, Math.ceil(Math.abs(endAngle - startAngle) * radius)) // 根据半径和角度差计算分段数量
    const angleStep = (endAngle - startAngle) / numSegments

    const vertices = []

    for (let i = 0; i <= numSegments; i++) {
      const angle = startAngle + i * angleStep
      vertices.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
    }

    this.applyShader(color, alpha)
    if (this.activeShaderProgram === null) return

    this.gl.lineWidth(lineWidth)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )

    this.gl.drawArrays(this.gl.LINE_STRIP, 0, vertices.length / 2)
  }
  fillArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise: boolean = false,
    color?: string,
    alpha?: number
  ) {
    if (radius < 0) throw new DOMException('Radius cannot be negative', 'IndexSizeError')
    color = color || this.styleState.strokeStyle

    alpha = alpha || this.styleState.alpha
    // 转换角度方向
    if (anticlockwise && startAngle < endAngle) {
      endAngle -= 2 * Math.PI
    } else if (!anticlockwise && startAngle > endAngle) {
      endAngle += 2 * Math.PI
    }

    const numSegments = Math.max(30, Math.ceil(Math.abs(endAngle - startAngle) * radius)) // 根据半径和角度差计算分段数量
    const angleStep = (endAngle - startAngle) / numSegments

    const vertices = []
    vertices.push(x, y) // 圆心作为三角形扇的中心点

    for (let i = 0; i <= numSegments; i++) {
      const angle = startAngle + i * angleStep
      vertices.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
    }

    this.applyShader(color, alpha)
    if (this.activeShaderProgram === null) return

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )

    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, vertices.length / 2)
  }
  /**************************************************
   * Features with slower performance or use webWorker
   **************************************************/
  fillText(
    x: number,
    y: number,
    w: number,
    content: string,
    color?: string,
    font?: string,
    textAlign?: CanvasTextAlign,
    textBaseline?: CanvasTextBaseline
  ) {
    const canvas = new OffscreenCanvas(this.gl.canvas.width, this.gl.canvas.height)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = color || this.styleState.fillStyle
    ctx.textAlign = textAlign || this.styleState.textAlign
    ctx.textBaseline = textBaseline || this.styleState.textBaseline
    ctx.font = font || this.styleState.font
    ctx.fillText(content, x, y, w)
    const imageBitmap = canvas.transferToImageBitmap()
    const texture = this.createTexture(imageBitmap)
    this.drawTexture(texture, 0, 0, this.gl.canvas.width, this.gl.canvas.height)
  }

  /**************************************************
   * curve method
   **************************************************/
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise: boolean = false,
    numSegments: number = 100,
    color?: string,
    alpha?: number
  ) {
    if (radius < 0) {
      throw new DOMException('Bad radius', 'IndexSizeError')
    }

    if (radius === 0) {
      this.lineTo(x, y)
      return
    }

    if (startAngle === endAngle) {
      return
    }
    color = color || this.styleState.fillStyle
    alpha = alpha || this.styleState.alpha
    const center = { x, y }

    if (startAngle > endAngle) {
      endAngle =
        (endAngle % (2 * Math.PI)) +
        Math.trunc(startAngle / (2 * Math.PI)) * 2 * Math.PI +
        2 * Math.PI
    }

    if (endAngle > startAngle + 2 * Math.PI) {
      endAngle = startAngle + 2 * Math.PI
    }

    const positions = []
    for (let i = 0; i <= numSegments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / numSegments)
      positions.push(center.x + Math.cos(angle) * radius, center.y + Math.sin(angle) * radius)
    }

    this.applyShader(color, alpha)
    if (this.activeShaderProgram === null) return

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )
    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, positions.length / 2)
  }
  arcTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
    color?: string,
    alpha?: number
  ) {
    if (arguments.length !== 5) throw new TypeError('arcTo requires 5 arguments')
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2) || !isFinite(radius))
      return
    if (radius < 0) throw new DOMException('Radius cannot be negative', 'IndexSizeError')
    color = color || this.styleState.fillStyle
    alpha = alpha || this.styleState.alpha
    // 获取当前路径的最后一个点作为起点
    const startPt = this.getTransformedPt(
      this.currentSubpath[this.currentSubpath.length - 2],
      this.currentSubpath[this.currentSubpath.length - 1]
    )

    // 转换终点
    const endPt = this.getTransformedPt(x2, y2)

    // 计算向量 ST 和单位向量
    const dx = endPt[0] - startPt[0]
    const dy = endPt[1] - startPt[1]
    const length = Math.sqrt(dx * dx + dy * dy)
    const nx = -dy / length
    const ny = dx / length

    // 计算切点 P1 和 P2
    const P1 = [startPt[0] + radius * nx, startPt[1] + radius * ny]
    const P2 = [endPt[0] + radius * nx, endPt[1] + radius * ny]

    // 计算圆心 C
    const Cx = (P1[0] + P2[0]) / 2
    const Cy = (P1[1] + P2[1]) / 2

    // 计算起始角度和结束角度
    const startAngle = Math.atan2(P1[1] - Cy, P1[0] - Cx)
    const endAngle = Math.atan2(P2[1] - Cy, P2[0] - Cx)

    // 调用 arc 方法绘制圆弧
    this.arc(Cx, Cy, radius, startAngle, endAngle, false, 100, color, alpha)

    // 将路径的最后一个点更新为终点
    this.currentSubpath.push(endPt[0], endPt[1])
    this.subpathsModified = true
  }
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number, color?: string, alpha?: number) {
    if (arguments.length !== 4) throw new TypeError()

    if (!isFinite(cpx) || !isFinite(cpy) || !isFinite(x) || !isFinite(y)) {
      return
    }
    color = color || this.styleState.fillStyle
    alpha = alpha || this.styleState.alpha
    this.ensureStartPath(cpx, cpy)

    const scale = 1 // TODO: ??
    const vertsLen = this.currentSubpath.length
    const startPt = [this.currentSubpath[vertsLen - 2], this.currentSubpath[vertsLen - 1]]
    const controlPt = this.getTransformedPt(cpx, cpy)
    const endPt = this.getTransformedPt(x, y)

    const vertices = []
    const numSegments = 100
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments
      const x = (1 - t) * (1 - t) * startPt[0] + 2 * (1 - t) * t * controlPt[0] + t * t * endPt[0]
      const y = (1 - t) * (1 - t) * startPt[1] + 2 * (1 - t) * t * controlPt[1] + t * t * endPt[1]
      vertices.push(x, y)
    }

    this.applyShader(color, alpha)

    if (this.activeShaderProgram === null) {
      return
    }

    // 绑定顶点数据并绘制
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )
    this.gl.drawArrays(this.gl.LINE_STRIP, 0, vertices.length / 2)
  }
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number,
    color?: string,
    alpha?: number
  ) {
    if (arguments.length !== 6) throw new TypeError()

    if (
      !isFinite(cp1x) ||
      !isFinite(cp1y) ||
      !isFinite(cp2x) ||
      !isFinite(cp2y) ||
      !isFinite(x) ||
      !isFinite(y)
    ) {
      return
    }
    color = color || this.styleState.fillStyle
    alpha = alpha || this.styleState.alpha
    this.ensureStartPath(cp1x, cp1y)

    const scale = 1 // TODO: ??
    const vertsLen = this.currentSubpath.length
    const startPt = [this.currentSubpath[vertsLen - 2], this.currentSubpath[vertsLen - 1]]
    const controlPt1 = this.getTransformedPt(cp1x, cp1y)
    const controlPt2 = this.getTransformedPt(cp2x, cp2y)
    const endPt = this.getTransformedPt(x, y)

    const vertices = []
    const numSegments = 100
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments
      const x =
        (1 - t) * (1 - t) * (1 - t) * startPt[0] +
        3 * (1 - t) * (1 - t) * t * controlPt1[0] +
        3 * (1 - t) * t * t * controlPt2[0] +
        t * t * t * endPt[0]
      const y =
        (1 - t) * (1 - t) * (1 - t) * startPt[1] +
        3 * (1 - t) * (1 - t) * t * controlPt1[1] +
        3 * (1 - t) * t * t * controlPt2[1] +
        t * t * t * endPt[1]
      vertices.push(x, y)
    }

    this.applyShader(color, alpha)

    if (this.activeShaderProgram === null) {
      return
    }

    // 绑定顶点数据并绘制
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )
    this.gl.drawArrays(this.gl.LINE_STRIP, 0, vertices.length / 2)
  }
  fillTriangle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    color?: string,
    alpha?: number
  ) {
    if (arguments.length < 6)
      throw new TypeError('fillTriangle requires at least 6 arguments (x1, y1, x2, y2, x3, y3)')
    color = color || this.styleState.fillStyle
    alpha = alpha || this.styleState.alpha
    // 转换顶点坐标
    const v1 = this.getTransformedPt(x1, y1)
    const v2 = this.getTransformedPt(x2, y2)
    const v3 = this.getTransformedPt(x3, y3)

    // 创建顶点数据
    const vertices = [v1[0], v1[1], v2[0], v2[1], v3[0], v3[1]]

    // 设置着色器和颜色
    this.applyShader(color, alpha)
    if (this.activeShaderProgram === null) return

    // 绑定顶点数据
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )

    // 绘制三角形
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3)
  }
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
  ) {
    if (arguments.length < 6)
      throw new TypeError('strokeTriangle requires at least 6 arguments (x1, y1, x2, y2, x3, y3)')
    color = color || this.styleState.fillStyle
    alpha = alpha || this.styleState.alpha
    lineWidth = lineWidth || this.styleState.lineWidth
    // 转换顶点坐标
    const v1 = this.getTransformedPt(x1, y1)
    const v2 = this.getTransformedPt(x2, y2)
    const v3 = this.getTransformedPt(x3, y3)

    // 创建顶点数据
    const vertices = [
      v1[0],
      v1[1],
      v2[0],
      v2[1],
      v2[0],
      v2[1],
      v3[0],
      v3[1],
      v3[0],
      v3[1],
      v1[0],
      v1[1]
    ]

    // 设置着色器和颜色
    this.applyShader(color, alpha)
    if (this.activeShaderProgram === null) return

    // 设置线宽
    this.gl.lineWidth(lineWidth)

    // 绑定顶点数据
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW)
    this.gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    )

    // 绘制三角形边框
    this.gl.drawArrays(this.gl.LINES, 0, 6)
  }
  /**************************************************
   * 图层变换
   **************************************************/

  scale(x: number, y: number, auto: boolean = false) {
    mat4.scale(this.mvMatrix!, this.mvMatrix!, [x, y, 1.0])
    this.invMvMatrix = mat4.create()
    mat4.invert(this.invMvMatrix, this.mvMatrix!)
    this.updateMatrixUniforms()
    if (auto) {
      // 调整投影矩阵以适应缩放
      const width = this.gl.drawingBufferWidth
      const height = this.gl.drawingBufferHeight
      mat4.ortho(this.pMatrix!, 0, width * x, height * y, 0, -1, 1)
      this.updateMatrixUniforms()
    }
  }

  rotate(angle: number) {
    if (arguments.length !== 1) throw new TypeError()
    for (let argIdx = 0; argIdx < arguments.length; argIdx++) {
      if (!isFinite(arguments[argIdx])) return
    }
    mat4.rotateZ(this.mvMatrix!, this.mvMatrix!, angle)
    this.updateMatrixUniforms()
  }

  translate(x: number, y: number) {
    mat4.translate(this.mvMatrix!, this.mvMatrix!, [x, y, 0.0])
    this.updateMatrixUniforms()
  }

  transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    mat4.multiply(
      this.mvMatrix!,
      this.mvMatrix!,
      mat4.fromValues(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1)
    )
    this.updateMatrixUniforms()
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
    mat4.identity(this.mvMatrix!)
    this.transform(a, b, c, d, e, f)
  }
  /**************************************************
   * scissor method
   **************************************************/
  /**
   * 使用帧缓冲实现宽高裁剪
   * @param framebuffer 帧缓冲对象
   * @param width 裁剪宽度
   * @param height 裁剪高度
   * @param drawFunction 渲染函数
   */
  scissor(framebuffer: WebGLFramebuffer, width: number, height: number, drawFunction: () => void) {
    const gl = this.gl

    // 绑定帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

    // 启用剪裁测试
    gl.enable(gl.SCISSOR_TEST)
    // 设置剪裁区域
    gl.scissor(0, 0, width, height)

    // 设置视口
    gl.viewport(0, 0, width, height)

    // 调用渲染函数
    drawFunction()

    // 禁用剪裁测试
    gl.disable(gl.SCISSOR_TEST)

    // 解绑帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    // 恢复视口
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  }
  /**************************************************
   * helper method
   **************************************************/
  private createCircleVertices(x: number, y: number, radius: number, segments: number) {
    const vertices = []
    const angleStep = (2 * Math.PI) / segments

    for (let i = 0; i < segments; i++) {
      const angle = i * angleStep
      vertices.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius)
    }

    return vertices
  }
  private makeStroke(lineWidth: number) {
    const vertices = []
    for (let i = 0; i < this.subpaths.length; i++) {
      const subpath = this.subpaths[i]

      // 跳过空的子路径
      if (subpath.length === 0) {
        continue
      }

      // 将子路径中的线段转换为三角形顶点数据
      for (let j = 0; j < subpath.length - 2; j += 2) {
        const x1 = subpath[j]
        const y1 = subpath[j + 1]
        const x2 = subpath[j + 2]
        const y2 = subpath[j + 3]

        // 计算线段的法向量
        const dx = x2 - x1
        const dy = y2 - y1
        const length = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / length
        const ny = dx / length

        // 计算偏移量
        const offsetX = (nx * lineWidth) / 2
        const offsetY = (ny * lineWidth) / 2

        // 计算四边形的四个顶点
        const x1a = x1 + offsetX
        const y1a = y1 + offsetY
        const x1b = x1 - offsetX
        const y1b = y1 - offsetY
        const x2a = x2 + offsetX
        const y2a = y2 + offsetY
        const x2b = x2 - offsetX
        const y2b = y2 - offsetY

        // 将四边形转换为两个三角形
        vertices.push(
          x1a,
          y1a, // 三角形1的顶点1
          x1b,
          y1b, // 三角形1的顶点2
          x2a,
          y2a, // 三角形1的顶点3

          x1b,
          y1b, // 三角形2的顶点1
          x2a,
          y2a, // 三角形2的顶点2
          x2b,
          y2b // 三角形2的顶点3
        )
      }
    }
    return vertices
  }
  private ensureStartPath(x: number, y: number) {
    if (this.currentSubpath.length === 0) {
      const tPt = this.getTransformedPt(x, y)
      this.currentSubpath.push(tPt[0])
      this.currentSubpath.push(tPt[1])
      return false
    } else {
      return true
    }
  }
  private makePatternStroke(lineWidth: number, opt: Partial<PathPatternOptions>) {
    const pattern: PathPatternOptions = {
      miterLimit: 10,
      thickness: 0,
      lineJoin: 'round',
      lineCap: 'butt',
      ...opt
    }
    const lineCap = pattern.lineCap
    const lineJoin = pattern.lineJoin
    const miterLimit = pattern.miterLimit
    let halfLineWidth = lineWidth / 2 // 在声明时立即赋值
    const vertices = []
    const normals = []

    for (const subpath of this.subpaths) {
      if (subpath.length < 4) continue

      for (let i = 0; i < subpath.length - 2; i += 2) {
        const x1 = subpath[i]
        const y1 = subpath[i + 1]
        const x2 = subpath[i + 2]
        const y2 = subpath[i + 3]

        const dx = x2 - x1
        const dy = y2 - y1
        const length = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / length
        const ny = dx / length

        const offsetX = nx * halfLineWidth
        const offsetY = ny * halfLineWidth

        vertices.push(
          x1 + offsetX,
          y1 + offsetY,
          x1 - offsetX,
          y1 - offsetY,
          x2 + offsetX,
          y2 + offsetY,
          x2 - offsetX,
          y2 - offsetY
        )

        normals.push(nx, ny, nx, ny, nx, ny, nx, ny)
      }
    }

    // 添加线帽 (lineCap)
    if (lineCap !== 'butt') {
      for (const subpath of this.subpaths) {
        if (subpath.length < 4) continue

        const x1 = subpath[0]
        const y1 = subpath[1]
        const x2 = subpath[2]
        const y2 = subpath[3]
        const dx = x2 - x1
        const dy = y2 - y1
        const length = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / length
        const ny = dx / length

        const capLength = lineCap === 'round' ? halfLineWidth : lineWidth

        if (lineCap === 'round') {
          // 添加圆形线帽
          const capVertices = this.createCircleVertices(x1, y1, halfLineWidth, 12)
          vertices.push(...capVertices)
        } else if (lineCap === 'square') {
          // 添加方形线帽
          vertices.push(
            x1 + nx * capLength,
            y1 + ny * capLength,
            x1 - nx * capLength,
            y1 - ny * capLength
          )
        }
      }
    }

    // 添加线连接 (lineJoin)
    if (lineJoin !== 'miter') {
      for (const subpath of this.subpaths) {
        if (subpath.length < 6) continue

        for (let i = 2; i < subpath.length - 2; i += 2) {
          const x1 = subpath[i]
          const y1 = subpath[i + 1]
          const x2 = subpath[i + 2]
          const y2 = subpath[i + 3]
          const x3 = subpath[i + 4]
          const y3 = subpath[i + 5]

          const dx1 = x2 - x1
          const dy1 = y2 - y1
          const dx2 = x3 - x2
          const dy2 = y3 - y2

          const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
          const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

          const nx1 = -dy1 / length1
          const ny1 = dx1 / length1
          const nx2 = -dy2 / length2
          const ny2 = dx2 / length2

          if (lineJoin === 'round') {
            // 添加圆角连接
            const joinVertices = this.createCircleVertices(x2, y2, halfLineWidth, 12)
            vertices.push(...joinVertices)
          } else if (lineJoin === 'bevel') {
            // 添加斜角连接
            vertices.push(
              x2 + nx1 * halfLineWidth,
              y2 + ny1 * halfLineWidth,
              x2 + nx2 * halfLineWidth,
              y2 + ny2 * halfLineWidth,
              x2,
              y2
            )
          }
        }
      }
    }
    return vertices
  }
  updateTextureRegion(
    texture: WebGLTexture,
    x: number,
    y: number,
    data: Uint8Array,
    width: number,
    height: number
  ) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texSubImage2D(
      this.gl.TEXTURE_2D,
      0,
      x,
      y,
      width,
      height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data
    )
  }
  /**************************************************
   * Pixel data methods 图片相关操作
   **************************************************/
  putImageData(
    imagedata: ImageData,
    dx: number,
    dy: number,
    dirtyX: number = 0,
    dirtyY: number = 0,
    dirtyWidth: number = 0,
    dirtyHeight: number = 0
  ) {
    let typeError = ''

    if (!(imagedata instanceof ImageData)) throw Error('Bad imagedata')
    const asset: Asset = {
      width: imagedata.width,
      height: imagedata.height,
      data: new Uint8Array(imagedata.data.buffer)
    }

    if (dirtyWidth < 0) {
      dirtyX += dirtyWidth
      dirtyWidth = -dirtyWidth
    }
    if (dirtyHeight < 0) {
      dirtyY += dirtyHeight
      dirtyHeight = -dirtyHeight
    }
    if (dirtyX < 0) {
      dirtyWidth += dirtyX
      dirtyX = 0
    }
    if (dirtyY < 0) {
      dirtyHeight += dirtyY
      dirtyY = 0
    }
    if (dirtyX + dirtyWidth > asset.width) {
      dirtyWidth = asset.width - dirtyX
    }
    if (dirtyY + dirtyHeight > asset.height) {
      dirtyHeight = asset.height - dirtyY
    }

    dx = Math.floor(dx)
    dy = Math.floor(dy)
    dirtyX = Math.floor(dirtyX)
    dirtyY = Math.floor(dirtyY)
    dirtyWidth = Math.floor(dirtyWidth)
    dirtyHeight = Math.floor(dirtyHeight)

    if (dirtyWidth <= 0 || dirtyHeight <= 0) {
      return
    }
    const minScreenX = dx + dirtyX
    const minScreenY = dy + dirtyY
    const maxScreenX = minScreenX + dirtyWidth
    const maxScreenY = minScreenY + dirtyHeight

    const minTexX = dirtyX / asset.width
    const minTexY = dirtyY / asset.height
    const maxTexX = minTexX + dirtyWidth / asset.width
    const maxTexY = minTexY + dirtyHeight / asset.height

    const vertices = [
      minScreenX,
      minScreenY,
      minTexX,
      minTexY,
      minScreenX,
      maxScreenY,
      minTexX,
      maxTexY,
      maxScreenX,
      minScreenY,
      maxTexX,
      minTexY,
      maxScreenX,
      maxScreenY,
      maxTexX,
      maxTexY
    ]
    this.drawImageData(vertices, asset)
  }
  drawImageData(vertices: number[], asset: Asset, type: 'put' | 'draw' = 'put') {
    // shader
    const pattern = createPattern(asset, 'src-rect')
    this.applyShader(pattern)
    if (this.activeShaderProgram == null) {
      return
    }
    const gl = this.gl
    gl.enableVertexAttribArray(this.activeShaderProgram.attributes['aTexCoord'])

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      gl.FLOAT,
      false,
      4 * 2 * 2,
      0
    )
    gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aTexCoord'],
      2,
      gl.FLOAT,
      false,
      4 * 2 * 2,
      4 * 2
    )
    if (type === 'put') {
      gl.uniform1f(this.activeShaderProgram.uniforms['uGlobalAlpha'], 1.0)
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ZERO, gl.ONE, gl.ZERO)

      gl.uniform1i(this.activeShaderProgram.uniforms['uSkipMVTransform'], 1)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.uniform1i(this.activeShaderProgram.uniforms['uSkipMVTransform'], 0)
      gl.disableVertexAttribArray(this.activeShaderProgram.attributes['aTexCoord'])

      this.applyCompositingState()
    } else {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      gl.disableVertexAttribArray(this.activeShaderProgram.attributes['aTexCoord'])
    }
  }
  drawImage() {
    const asset = arguments[0] as Asset
    if (!isValidCanvasImageSource(asset)) {
      throw new TypeError('Bad asset')
    }
    const gl = this.gl
    if (asset.width === 0 || asset.height === 0) {
      // Zero-sized asset image causes DOMException
      throw new DOMException('Bad source rectangle', 'InvalidStateError')
    }
    let sx = 0
    let sy = 0
    let sw = 1
    let sh = 1
    let dx
    let dy
    let dw
    let dh
    if (arguments.length === 3) {
      dx = arguments[1]
      dy = arguments[2]
      dw = asset.width
      dh = asset.height
    } else if (arguments.length === 5) {
      dx = arguments[1]
      dy = arguments[2]
      dw = arguments[3]
      dh = arguments[4]
    } else if (arguments.length === 9) {
      sx = arguments[1] / asset.width
      sy = arguments[2] / asset.height
      sw = arguments[3] / asset.width
      sh = arguments[4] / asset.height
      dx = arguments[5]
      dy = arguments[6]
      dw = arguments[7]
      dh = arguments[8]
    } else {
      throw new TypeError()
    }

    if (sw === 0 || sh === 0) {
      // Zero-sized source rect specified by the programmer is A-OK :P
      return
    }

    // TODO: the shader clipping method for source rectangles that are
    //  out of bounds relies on BlendFunc being set to SRC_ALPHA/SRC_ONE_MINUS_ALPHA
    //  if we can't rely on that, we'll have to clip beforehand by messing
    //  with rectangle dimensions

    const dxmin = Math.min(dx, dx + dw)
    const dxmax = Math.max(dx, dx + dw)
    const dymin = Math.min(dy, dy + dh)
    const dymax = Math.max(dy, dy + dh)

    const sxmin = Math.min(sx, sx + sw)
    const sxmax = Math.max(sx, sx + sw)
    const symin = Math.min(sy, sy + sh)
    const symax = Math.max(sy, sy + sh)

    const vertices = [
      dxmin,
      dymin,
      sxmin,
      symin,
      dxmin,
      dymax,
      sxmin,
      symax,
      dxmax,
      dymin,
      sxmax,
      symin,
      dxmax,
      dymax,
      sxmax,
      symax
    ]
    const pattern = createPattern(asset, 'src-rect')
    this.applyShader(pattern)
    if (this.activeShaderProgram == null) {
      return
    }
    gl.enableVertexAttribArray(this.activeShaderProgram.attributes['aTexCoord'])

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aVertexPosition'],
      2,
      gl.FLOAT,
      false,
      4 * 2 * 2,
      0
    )
    gl.vertexAttribPointer(
      this.activeShaderProgram.attributes['aTexCoord'],
      2,
      gl.FLOAT,
      false,
      4 * 2 * 2,
      4 * 2
    )

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.disableVertexAttribArray(this.activeShaderProgram.attributes['aTexCoord'])
  }
  /**************************************************
   * static method
   **************************************************/
  get lineWidth() {
    return this.styleState.lineWidth
  }
  get fillStyle() {
    return this.styleState.fillStyle
  }
  get font() {
    return this.styleState.font
  }
  get textAlign() {
    return this.styleState.textAlign
  }
  get textBaseline() {
    return this.styleState.textBaseline
  }
  set fillStyle(val: string) {
    this.styleState.fillStyle = val
  }
  set strokeStyle(val: string) {
    this.styleState.strokeStyle = val
  }
  set lineWidth(val: number) {
    val = Number(val)
    this.styleState.lineWidth = val
  }
  set textBaseline(val: CanvasTextBaseline) {
    this.styleState.textBaseline = val
  }
  set textAlign(val: CanvasTextAlign) {
    this.styleState.textAlign = val
  }
}
