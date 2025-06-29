import { CanvasPattern } from './pattern'
import {
  createShaderProgramImpl,
  patternShaderRepeatValues,
  ShaderProgramImpl,
  UserShaderKeySymbol
} from '@/shader'
import { createPattern, cssToGlColor } from '@/common'
import { isString } from '@/common'
import { ApplyShaderSymbol, IWebGL } from './types'
import { mat4, vec3 } from 'gl-matrix'
export class WebGLImpl implements IWebGL {
  activeShaderProgram: ShaderProgramImpl | null = null
  vertexBuffer: WebGLBuffer
  pMatrix: mat4 | undefined
  // 模型矩阵的逆矩阵
  invMvMatrix: mat4 | undefined
  mvMatrix: mat4 | undefined
  private matrixStack: mat4[] = []
  /**缓存对应的shader程序 */
  shaderProgramMap: Record<UserShaderKeySymbol, ShaderProgramImpl | null>
  constructor(public gl: WebGL2RenderingContext) {
    this.shaderProgramMap = createShaderProgramImpl(this.gl)
    this.vertexBuffer = this.gl.createBuffer()
    this.initializeMatrix()
    this.updateMatrixUniforms()
    this.applyCompositingState()
  }
  /**************************************************
   * shader method
   **************************************************/
  applyShader(val: ApplyShaderSymbol, alpha = 1) {
    if (!val) throw TypeError('fail to set shader program')
    if (isString(val)) {
      /**设置颜色 */
      this.configColorShader(val, alpha)
    }
    if (val && val instanceof CanvasPattern) {
      this.configParttenShader(val, alpha)
    }
    this.configureVertexAttributes()
  }
  configColorShader(val: string, alpha: number) {
    this.setShaderProgram('flatShaderProgram')
    this.gl.uniform4fv(this.activeShaderProgram!.uniforms['uColor'], cssToGlColor(val))
    this.gl.uniform1f(this.activeShaderProgram!.uniforms['uGlobalAlpha'], alpha)
  }
  configParttenShader(val: CanvasPattern, alpha: number) {
    this.setShaderProgram('patternShaderProgram')
    // 禁用顶点
    this.gl.disableVertexAttribArray(this.activeShaderProgram!.attributes['aTexCoord'])
    /**创建纹理 */

    const texture =
      val.pattern.data instanceof WebGLTexture ? val.pattern.data : this.gl.createTexture()
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    if (val.pattern.data instanceof Uint8Array || !val.pattern.data) {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        val.pattern.width,
        val.pattern.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        'data' in val.pattern ? val.pattern.data : val.pattern // accept both assets and raw data arrays
      )
    }
    this.gl.uniform2f(
      this.activeShaderProgram!.uniforms['uTextureSize'],
      val.pattern.width,
      val.pattern.height
    )
    this.gl.uniform1i(this.activeShaderProgram!.uniforms['uTexture'], 0)
    this.gl.uniform1i(
      this.activeShaderProgram!.uniforms['uRepeatMode'],
      patternShaderRepeatValues[val.repeat]
    )

    this.gl.uniform1f(this.activeShaderProgram!.uniforms['uGlobalAlpha'], alpha)
  }
  configureVertexAttributes() {
    if (this.activeShaderProgram === null) return
    // 设置attrib属性
    this.gl.enableVertexAttribArray(this.activeShaderProgram.attributes['aVertexPosition'] as GLint)
    this.gl.disableVertexAttribArray(this.activeShaderProgram.attributes['aTextPageCoord'] as GLint)
    this.gl.uniform1i(this.activeShaderProgram.uniforms['uTextEnabled'], 0)
    this.gl.uniform1i(this.activeShaderProgram.uniforms['uTextPages'], 1)
  }
  setShaderProgram(key: UserShaderKeySymbol) {
    const shaderProgram = this.shaderProgramMap[key]
    if (this.activeShaderProgram !== shaderProgram) {
      if (shaderProgram !== null) {
        // 重新设置
        shaderProgram.makesure()
      } else {
        // 清空shader
        this.gl.useProgram(null)
        this.gl.bindVertexArray(null)
      }
      // 设置当前需要的shader
      this.activeShaderProgram = shaderProgram
      this.updateMatrixUniforms()
    }
  }

  /**************************************************
   * Pixel data methods 纹理操作
   **************************************************/
  createTexture(width: number, height: number): WebGLTexture
  createTexture(
    source: HTMLCanvasElement | HTMLImageElement | ImageBitmap | OffscreenCanvas
  ): WebGLTexture
  createTexture() {
    const gl = this.gl
    if (arguments.length === 1) {
      const source = arguments[0]
      // 1. 创建纹理对象
      const texture = gl.createTexture()
      if (!texture) {
        throw new Error('Failed to create WebGL texture.')
      }
      // 2. 绑定纹理
      gl.bindTexture(gl.TEXTURE_2D, texture)

      // 3. 设置纹理参数
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        source.width,
        source.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR) // 缩小过滤
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR) // 放大过滤
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE) // S 轴环绕模式
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE) // T 轴环绕模式

      // 4. 将画布内容上传到纹理
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
      gl.activeTexture(gl.TEXTURE0)

      // 5. 解绑纹理（可选）
      gl.bindTexture(gl.TEXTURE_2D, null)
      // 6. 返回纹理对象
      return texture
    } else if (arguments.length === 2) {
      const width = arguments[0]
      const height = arguments[1]
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

      gl.bindTexture(gl.TEXTURE_2D, null)

      return texture
    } else {
      throw TypeError('bad createTexture')
    }
  }
  drawTexture(texture: WebGLTexture, x: number, y: number, width: number, height: number) {
    const gl = this.gl
    // 创建纹理模式
    const pattern = createPattern(
      {
        width: width,
        height: height,
        data: texture
      },
      'repeat' // 重复模式
    )
    // 应用 patternShaderProgram
    // 启用混合
    gl.enable(gl.BLEND)
    // 设置混合函数
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    // 设置混合方程
    gl.blendEquation(gl.FUNC_ADD)
    this.applyShader(pattern)

    if (this.activeShaderProgram === null) {
      console.error('Active shader program is null')
      return
    }
    // 设置顶点和纹理坐标
    const vertices = [
      x,
      y,
      0,
      0, // 左下角
      x + width,
      y,
      1,
      0, // 右下角
      x,
      y + height,
      0,
      1, // 左上角
      x + width,
      y + height,
      1,
      1 // 右上角
    ]

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
    // 渲染
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.disableVertexAttribArray(this.activeShaderProgram.attributes['aTexCoord'])
    this.applyCompositingState()
  }
  release() {
    const gl = this.gl
    for (let i = 0; i < gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS; i++) {
      gl.activeTexture(gl.TEXTURE0 + i)
      gl.bindTexture(gl.TEXTURE_2D, null)
    }
  }
  createFramebufferObject(width: number, height: number) {
    // 初始化清空离屏缓冲
    const framebuffer = this.gl.createFramebuffer()
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)

    // 创建纹理并附加到帧缓冲
    const texture = this.gl.createTexture()
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    )
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      texture,
      0
    )

    // 检查帧缓冲是否完整
    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer is not complete')
      throw Error('Framebuffer is not complete')
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    return { framebuffer, texture }
  }

  /**************************************************
   * 属性操作
   **************************************************/
  // 混合模式
  applyCompositingState() {
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFuncSeparate(
      this.gl.SRC_ALPHA,
      this.gl.ONE_MINUS_SRC_ALPHA,
      this.gl.ONE,
      this.gl.ONE_MINUS_SRC_ALPHA
    )
  }
  setBackgrondTransparent() {
    // 设置背景色为透明
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  /**************************************************
   * 矩阵操作
   **************************************************/
  initializeMatrix() {
    this.mvMatrix = mat4.create() // 视图
    this.pMatrix = mat4.create() // 模型矩阵
    // 初始化投影矩阵
    mat4.ortho(this.pMatrix, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, -1, 1)

    // 初始化模型视图矩阵
    mat4.identity(this.mvMatrix)

    // 初始化逆模型视图矩阵
    this.invMvMatrix = mat4.create()
    mat4.invert(this.invMvMatrix, this.mvMatrix)
    this.updateMatrixUniforms()
  }
  updateViewPort(newWidth?: number, newHeight?: number) {
    // 更新WebGL视口大小，使渲染适应新的尺寸
    newWidth && newHeight
      ? this.gl.viewport(0, 0, newWidth, newHeight)
      : this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    // 重新渲染场景等相关逻辑（比如清除缓冲区并重新绘制图形等）
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT | this.gl.STENCIL_BUFFER_BIT)
    this.activeShaderProgram = null
    // 清空shader
    this.gl.useProgram(null)
    this.gl.bindVertexArray(null)
    //
    mat4.ortho(this.pMatrix!, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, -1, 1)
    // 更新视图矩阵
    this.updateMatrixUniforms()
  }
  // 获取逆模型视图矩阵
  getInvMatrix() {
    if (this.invMvMatrix == null) {
      this.invMvMatrix = mat4.create()
      mat4.invert(this.invMvMatrix, this.mvMatrix!)
    }
    return this.invMvMatrix
  }
  updateMatrixUniforms() {
    const gl = this.gl
    if (this.activeShaderProgram != null) {
      gl.uniformMatrix4fv(this.activeShaderProgram.uniforms['uPMatrix'], false, this.pMatrix!)
      gl.uniformMatrix4fv(this.activeShaderProgram.uniforms['uMVMatrix'], false, this.mvMatrix!)
      // 如果有逆矩阵，则更新逆矩阵
      if ('uiMVMatrix' in this.activeShaderProgram.uniforms) {
        gl.uniformMatrix4fv(
          this.activeShaderProgram.uniforms['uiMVMatrix'],
          false,
          this.getInvMatrix()
        )
      }
      gl.uniform1i(this.activeShaderProgram.uniforms['uSkipMVTransform'], 0)
    }
  }
  getTransformedPt(x: number, y: number) {
    const tPt = vec3.fromValues(x, y, 0.0)
    vec3.transformMat4(tPt, tPt, this.mvMatrix!)
    return [tPt[0], tPt[1]]
  }
  getUntransformedPt(x: number, y: number) {
    // TODO: creating a new vec3 every time seems potentially inefficient
    const tPt = vec3.fromValues(x, y, 0.0)
    vec3.transformMat4(tPt, tPt, this.getInvMatrix())
    return [tPt[0], tPt[1]]
  }
  // 将当前矩阵压入栈中
  save() {
    // 保存当前 mvMatrix 的副本到矩阵栈
    this.matrixStack.push(mat4.clone(this.mvMatrix!))
  }
  // 从栈中弹出矩阵并恢复
  resotre() {
    if (this.matrixStack.length > 0) {
      // 从栈中弹出最后一个矩阵并赋值给 mvMatrix
      this.mvMatrix = this.matrixStack.pop()
      this.updateMatrixUniforms()
    }
  }

  /**************************************************
   * 离屏和矩阵操作
   **************************************************/
  // 绘制到framebuffer
  renderToOffscreen(
    framebuffer: WebGLFramebuffer,
    width: number,
    height: number,
    drawFunction: () => void
  ) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)
    // 设置视口
    this.gl.viewport(0, 0, width, height)
    drawFunction()
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    // 恢复视图
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    // 恢复视图
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.applyCompositingState()
  }
  // 更新图形时
  clearOffScrenn(framebuffer: WebGLFramebuffer, width: number, height: number) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)
    // 设置视口
    this.gl.viewport(0, 0, width, height)
    // 清除 framebuffer
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.applyCompositingState()
  }
  // 绘制到主屏幕
  renderToScreen(framebuffer: WebGLFramebuffer, texture: WebGLTexture) {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    this.setShaderProgram('patternShaderProgram')
    if (this.activeShaderProgram === null) {
      return
    }
    gl.enableVertexAttribArray(this.activeShaderProgram.attributes['aTexCoord'])

    gl.uniform2f(
      this.activeShaderProgram.uniforms['uTextureSize'],
      gl.drawingBufferWidth,
      gl.drawingBufferHeight
    )
    gl.uniform1i(this.activeShaderProgram.uniforms['uTexture'], 0)
    gl.uniform1i(this.activeShaderProgram.uniforms['uRepeatMode'], 4)

    gl.uniform1f(this.activeShaderProgram.uniforms['uGlobalAlpha'], 1)

    gl.disableVertexAttribArray(this.activeShaderProgram.attributes['aTextPageCoord'])
    gl.uniform1i(this.activeShaderProgram.uniforms['uTextEnabled'], 0)
    gl.uniform1i(this.activeShaderProgram.uniforms['uTextPages'], 1) // TODO: causing trips in web-land

    gl.uniform1i(this.activeShaderProgram.uniforms['uSkipMVTransform'], 1)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)

    const vertices = [
      0,
      0,
      0,
      1,
      0,
      gl.drawingBufferHeight,
      0,
      0,
      gl.drawingBufferWidth,
      0,
      1,
      1,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      1,
      0
    ]

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

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

    gl.uniform1i(this.activeShaderProgram.uniforms['uSkipMVTransform'], 0)
    // 切换为主渲染进程
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
  clearTexture(texture: WebGLTexture, width: number, height: number) {
    const gl = this.gl

    // 创建一个帧缓冲区并绑定纹理
    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

    // 将纹理附加到帧缓冲区
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    // 设置视口以匹配纹理的尺寸
    gl.viewport(0, 0, width, height)

    // 清除颜色缓冲区
    gl.clearColor(0.0, 0.0, 0.0, 0.0) // 设置清除颜色为透明黑色
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 解绑帧缓冲区并恢复视口
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    // 释放帧缓冲区资源（可选）
    gl.deleteFramebuffer(framebuffer)
  }
}
