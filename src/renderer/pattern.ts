import { Asset } from './types'

export class CanvasPattern {
  constructor(
    public pattern: Asset,
    public repeat: 'no-repeat' | 'repeat-x' | 'repeat-y' | 'repeat' | 'src-rect'
  ) {}
}
export const transformImageData = (imageData: ImageData, sw?: number, sh?: number) => {
  if (!sw && !sh) {
    sw = imageData.width
    sh = imageData.height
  }
  if (sw === 0 || sh === 0) {
    throw new DOMException('Bad dimensions', 'IndexSizeError')
  }
  return new ImageData(sw as number, sh as number)
}
