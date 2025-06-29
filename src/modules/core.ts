import { Camera, CanvasImpl, CreateCanvasProOptions, ICamera, ICanvas } from '@/canvas'
import { IWebGL2DRender } from '@/renderer'
export const createCanvas: (
  element: Exclude<HTMLElement, HTMLCanvasElement>,
  options?: CreateCanvasProOptions
) => ICanvas = (
  element: Exclude<HTMLElement, HTMLCanvasElement>,
  options?: CreateCanvasProOptions
) => {
  if (element instanceof HTMLCanvasElement)
    throw TypeError('createCanvas not accept a canvas element ')
  return new CanvasImpl(element, options)
}
export const transformCanvasCtx: (
  element: HTMLCanvasElement,
  options?: CreateCanvasProOptions
) => IWebGL2DRender = (element: HTMLCanvasElement, options?: CreateCanvasProOptions) => {
  if (!(element instanceof HTMLCanvasElement))
    throw TypeError('transformCanvasCtx only accept a canvas element')
  return new CanvasImpl(element, options).getContext()
}

export const createCamera: (width?: number, height?: number) => ICamera = (
  width?: number,
  height?: number
) => new Camera(width, height)
