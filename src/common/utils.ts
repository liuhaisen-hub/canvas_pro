import { patternShaderRepeatValues } from '@/shader'
import { Asset, CanvasPattern, PatternShaderRepeatSymbol } from '@/renderer'
import { textLineHeight, textLineWidth } from './types'

export const getDevicePixelRatio = () => window.devicePixelRatio
export const cssValueToNumber = (val: string) => Number(val.replace('px', ''))
export const isNumber = (val: unknown) => typeof val === 'number'
export const isString = (val: unknown) => typeof val === 'string'
export const isObject = (val: unknown) => typeof val === 'object'
export const isFunction = (val: unknown) =>
  typeof val === 'function' && Object.prototype.toString.call(val) === '[object Function]'
export const isArray = (val: unknown) => Array.isArray(val)
export const isPromise = <T>(val: T) => val instanceof Promise
export const isAsyncFunction = <T>(val: T) =>
  Object.prototype.toString.call(val) === '[object AsyncFunction]'
export const generateTimstrap = () => new Date().valueOf()

export const setStyle = (elem: HTMLElement, styles: Record<string, string>) => {
  for (const key in styles) {
    elem.style.setProperty(key, styles[key] as string)
  }
}
export function isValidCanvasImageSource(asset: Asset) {
  if (asset instanceof ImageData) {
    return true
  } else {
    if (
      asset.hasOwnProperty('width') &&
      asset.hasOwnProperty('height') &&
      (asset.hasOwnProperty('localUri') || asset.hasOwnProperty('data'))
    ) {
      return true
    }
    if (asset.nodeName!.toLowerCase() === 'img' || asset.nodeName!.toLowerCase() === 'canvas') {
      return true
    }
  }
  return false
}
export function createPattern(asset: Asset, repeat: PatternShaderRepeatSymbol) {
  if (arguments.length !== 2) throw new TypeError()
  // TODO: make sure this doesn't pick up asset changes later on

  if (!(repeat in patternShaderRepeatValues)) {
    throw new DOMException('Bad repeat value', 'SyntaxError')
  }
  if (!isValidCanvasImageSource(asset)) {
    throw new TypeError('Bad asset')
  }
  return new CanvasPattern(asset, repeat)
}

export const settingFontStyle = (
  x: number,
  y: number,
  w: number,
  h: number,
  dpr: number,
  lineWidth: textLineWidth = 'center',
  lineHeight: textLineHeight = 'center'
) => {
  let _x = x / dpr
  let _y = y / dpr
  let _w = w / dpr
  let _h = h / dpr
  switch (lineWidth) {
    case 'center':
      _x = _x + _w / 2
      break
    case 'left':
      _x = _x + _w / 3
      break
    default:
      break
  }
  switch (lineHeight) {
    case 'center':
      _y = _y + _h / 2
      break
    case 'top':
      _y = _y + h / 3
      break
    default:
      break
  }
  return {
    x: _x,
    y: _y,
    w: _w,
    h: _h
  }
}
