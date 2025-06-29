import { DefalutLayer, ILayer } from '@/layer'
export type CreateLayerFn = (width: number, height: number, name: string) => ILayer
export const createLayer: CreateLayerFn = (width: number, height: number, name: string) =>
  new DefalutLayer(width, height, name, 'default')
