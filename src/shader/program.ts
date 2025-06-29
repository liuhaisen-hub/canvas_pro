import {
  disjointRadialGradShaderTxt,
  flatShaderTxt,
  linearGradShaderTxt,
  patternShaderTxt,
  radialGradShaderTxt
} from './glsl'
import stringFormat from 'string-format'
import { UserShaderKeySymbol } from './types'
import { mat4 } from 'gl-matrix'

/**
 * 着色器实现
 * @param gl webgl上下文
 * @param vertShaderTxt 顶点着色器代码
 * @param fragShaderTxt 片元着色器代码
 */
export class ShaderProgramImpl {
  programHandle: WebGLProgram
  vertexArray: WebGLVertexArrayObject
  attributes: Record<string, number> = {}
  uniforms: Record<string, WebGLUniformLocation> = {}
  constructor(public gl: WebGL2RenderingContext, vertShaderTxt: string, fragShaderTxt: string) {
    const vertShader = this.createShader(gl.VERTEX_SHADER, vertShaderTxt)
    const fragShader = this.createShader(gl.FRAGMENT_SHADER, fragShaderTxt)

    this.programHandle = this.createProgram(vertShader, fragShader)
    this.vertexArray = this.createVertexArray()

    this.setupAttributes()
    this.setupUniforms()
  }

  private createShader(type: GLenum, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const log = this.gl.getShaderInfoLog(shader)
      throw new SyntaxError(
        `Error compiling ${type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader: \n${log}`
      )
    }

    return shader
  }

  private createProgram(vertShader: WebGLShader, fragShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram()
    this.gl.attachShader(program, vertShader)
    this.gl.attachShader(program, fragShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const log = this.gl.getProgramInfoLog(program)
      throw new SyntaxError(`Error linking shader program: \n${log}`)
    }

    return program
  }

  private createVertexArray(): WebGLVertexArrayObject {
    const vertexArray = this.gl.createVertexArray()
    this.gl.bindVertexArray(vertexArray)
    return vertexArray
  }

  private setupAttributes(): void {
    const nAttributes = this.gl.getProgramParameter(this.programHandle, this.gl.ACTIVE_ATTRIBUTES)
    for (let i = 0; i < nAttributes; i++) {
      const attr = this.gl.getActiveAttrib(this.programHandle, i)
      if (attr) {
        const location = this.gl.getAttribLocation(this.programHandle, attr.name)
        this.attributes[attr.name] = location
        this.gl.enableVertexAttribArray(location)
      }
    }
  }

  private setupUniforms(): void {
    const nUniforms = this.gl.getProgramParameter(this.programHandle, this.gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < nUniforms; i++) {
      const uniform = this.gl.getActiveUniform(this.programHandle, i)
      if (uniform) {
        const location = this.gl.getUniformLocation(this.programHandle, uniform.name)
        if (location) {
          this.uniforms[uniform.name] = location
        }
      }
    }
  }
  /**
   * 设置相机的视图矩阵和投影矩阵
   * @param viewMatrix 视图矩阵
   * @param projectionMatrix 投影矩阵
   */
  setCameraMatrices(viewMatrix: mat4, projectionMatrix: mat4): void {
    // 确保当前着色器程序处于激活状态
    this.makesure()

    // 获取视图矩阵和投影矩阵的uniform位置
    const viewMatrixLocation = this.uniforms['u_viewMatrix']
    const projectionMatrixLocation = this.uniforms['u_projectionMatrix']

    // 更新视图矩阵
    if (viewMatrixLocation) {
      this.gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix)
    }

    // 更新投影矩阵
    if (projectionMatrixLocation) {
      this.gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    }
  }

  /**
   * 确保当前着色器程序处于激活状态
   * 该方法会将当前的着色器程序绑定到WebGL上下文中，并将顶点数组对象绑定到WebGL上下文中
   */
  makesure(): void {
    // 使用当前的着色器程序
    this.gl.useProgram(this.programHandle)
    // 绑定顶点数组对象
    this.gl.bindVertexArray(this.vertexArray)
  }
}

export const createShaderProgramImpl = (gl: WebGL2RenderingContext, maxGradStops: number = 128) => {
  // 创建一个空对象，用于存储不同类型的着色器程序
  const sharerProgram: Record<UserShaderKeySymbol, ShaderProgramImpl | null> = {
    // 创建一个平面着色器程序
    flatShaderProgram: new ShaderProgramImpl(gl, flatShaderTxt.vert, flatShaderTxt.frag),
    // 创建一个线性渐变着色器程序
    linearGradShaderProgram: new ShaderProgramImpl(
      gl,
      linearGradShaderTxt.vert,
      stringFormat(linearGradShaderTxt.frag, { maxGradStops: maxGradStops })
    ),
    // 创建一个不连续径向渐变着色器程序
    disjointRadialGradShaderProgram: new ShaderProgramImpl(
      gl,
      disjointRadialGradShaderTxt.vert,
      stringFormat(disjointRadialGradShaderTxt.frag, {
        maxGradStops: maxGradStops
      })
    ),
    // 创建一个图案着色器程序
    patternShaderProgram: new ShaderProgramImpl(gl, patternShaderTxt.vert, patternShaderTxt.frag),
    // 创建一个径向渐变着色器程序
    radialGradShaderProgram: new ShaderProgramImpl(
      gl,
      radialGradShaderTxt.vert,
      stringFormat(radialGradShaderTxt.frag, { maxGradStops: maxGradStops })
    )
  }
  return sharerProgram
}
