/**
 * shape的基本参数
 */
export interface RectAttribute {
  x: number
  y: number
  w: number
  h: number
  color: string
  lineWidth: number
  alpha: number
}
export interface StrokeRectAttribute {
  x: number
  y: number
  w: number
  h: number
  color: string
  lineWidth: number
  alpha: number
}
export interface ArcAttribute {
  x: number
  y: number
  radius: number
  startAngle: number
  endAngle: number
  color: string
  anticlockwise: boolean
  lineWidth: number
  numSegments: number
  alpha: number
}
export type GridAttribute = Array<number[][]>
export interface CureAttribute {
  cpx: number
  cpy: number
  x: number
  y: number
  color: string
  alpha: number
}
export interface BezierCureAttribute {
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  x: number
  y: number
  color: string
  alpha: number
}
export interface TriangleAttribute {
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
  color: string
  alpha: number
  lineWidth: number
}
export interface TextAttribute {
  x: number
  y: number
  w: number
  h: number
  content: string
  color: string
  font_size: string
  font_family: string
  textAlign: string
  textBaseline: string
  font_css?: string
}
export interface TextureAttribute {
  texture: WebGLTexture
  width: number
  height: number
  x: number
  y: number
}
export interface ImageBitmapAttribute {
  imageBitmap: ImageBitmap
  width: number
  height: number
  x: number
  y: number
}
export type DefaultAttribute =
  | RectAttribute
  | ArcAttribute
  | CureAttribute
  | BezierCureAttribute
  | TriangleAttribute
  | TextAttribute
  | StrokeRectAttribute
  | TextureAttribute
