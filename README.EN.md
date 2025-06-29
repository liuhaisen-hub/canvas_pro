# Canvas pro

If you're looking for a 2D graphics library that uses JavaScript and WEBGL for drawing, or a replacement for the current native canvas API to improve the performance of layer drawing and management, then you can try this simple, lightweight, and easy-to-use library.

### Reconstructing the HTML Canvas API based on WebGL
- A library that reconstructs the native Canvas API using WebGL.
- Can be directly converted and used with just one line of code.
- In addition to supporting all native Canvas APIs, it provides more graphics drawing APIs.
- Has a monitorable drawing lifecycle.
- Built-in redrawing after transformations such as displacement, scaling, and rotation.
- Provides layer management.
- Supports controlling a single layer in a multi-layer scene.
- Supports off-screen rendering and rendering pipeline buffering.
- Developed with TypeScript, offering good type hints.
- Manages layers based on the browser's native events, making layer drawing management lighter and faster.
- Packaged using Rslib, supporting outputs such as swc and module federation.[rslib](https://lib.rsbuild.dev/zh/guide/start/quick-start)
- Supports WebWorker background rendering.

## Author

- Haisen Liu [@threemu](http://threemu.top) 

## Easy to Use
You can use it directly with just one line of code.
```html
<div class="container">
  <canvas id="webgl-api"></canvas>
  <div id="container">
</div>    
<script type="module">
    const canvas = transformCanvasCtx(document.getElementById('webgl-api'))
    // or
    const canvas = createCanvas(document.getElementById('container'))
    const ctx = canvas.getContext('canvas-pro-2d')
    ctx.fillRect(100,100,200,200, 'red')
    ctx.bezierCurveTo(100,200,300,400,300,600, 'red', 0.8)
    
    // addEventListener
    canvas.$on('beforeChange', (e) =>{})

    //use layer
    const layer = createLayer(canvas.width, canvas.height, 'test-layer')
    const layer2 = createLayer(canvas.width, canvas.height, 'test2-layer')
    
   

    // you can set zIndex in layer
    canvas.append(layer, 1)
    canvas.append(layer2, 2)

    // get layer by name
    
    console.log(canvas.testLayer === layer)

    layer.render(canvas.ctx, () => {
        canvas.ctx.fillRect(100, 100, 300, 300, 'red', 1.0)
        canvas.ctx.bezierCurveTo(2, 6, 4, 3, 300, 400)
    })
    layer.render(canvas.ctx, () => {
        canvas.ctx.fillRect(400, 400, 100, 100, 'blue', 1.0)
    })
    layer2.render(canvas.ctx, () => {
        canvas.ctx.fillTriangle(600, 800, 700, 600, 500, 600, 'blue')
    })
    // when you need, it will compose all layer in screen
    canvas.compose()
    // when you need, it will be auot change the view
    layer.translate(10, 0)


    // use camera ,it will change the golbal matrix
    canvas.pan(0, -10)
</script>

</html>
```


## Supported API

  * fillRect
  * strokeRect
  * clearRect
  * fillText
  * beginPath
  * closePath
  * moveTo
  * lineTo
  * stroke

  * strokeArc
  * fillArc
  * arc
  * arcTo
  * quadraticCurveTo
  * bezierCurveTo
  * fillTriangle
  * strokeTriangle
  * scale
  * rotate
  * translate
  * transform
  * setTransform
  * scissor
  

## New Layer Management and Camera Management

 1. createLayer
   * Creates an off-screen graphics layer.
   * Allows size cropping, zooming in and out, and displacement of the layer.
   * The layer is cached in the GPU pipeline.
 2. composeLayer  
   * Combines all the GPU rendering pipelines on the main screen.
   * After merging all layers, if an animation change occurs in one layer, the entire layer will be updated accordingly.
 3. carmera 
    * As a global camera, it can move, zoom in, and zoom out the view without changing the layers.

 ## Usage of Basic APIs
 ### Drawing using the native methods of the canvas API
 ```js
   ctx.fillStyle = 'red'
   ctx.fillRect(100,100,100,100)
 ``` 
 ### Passing values within functions
 ```ts
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
 ```

 ### Usage of Camera
 ```ts
  active(viewWidth: number, viewHeight: number): void
  // Pan the camera
  pan(tx: number, ty: number): void

 // Rotate around the Z-axis (for 2D)
  rotate(angle: number, centerX?: number, centerY?: number): void

   // Zoom (based on the center of the viewport)
  zoom(scale: number, centerX?: number, centerY?: number): void
   // Implement the lookAt method
  lookAt(targetX: number, targetY: number): void
  getViewMatrix(): mat4
  getProjectionMatrix(): mat4
  updateViewport(width: number, height: number): void
   // Get the camera's translation in the browser coordinate system
  getBrowserTranslation(): vec2
   // If the viewport's position in the browser is not (0, 0), you can use the following method
  getBrowserTranslationWithViewport(viewportX: number, viewportY: number): vec2
  getScale(): { x: number; y: number }
 ```

 ### Usage of Layers
 ```ts
 // Activate the layer
  active(renderer: IWebGL2DRender): void
  resize(newWidth: number, newHeight: number): void
   // Release all resources
  release(): void
   // Reset resources
  reset(): void
  // Translate the layer
  translate(tx: number, ty: number): void
  // Scale the layer
  scale(sx: number, sy: number, centerX?: number, centerY?: number): void
  render(callback: RenderCallback): void
  draw(): void
  update(): void


  type AsyncRenderFunction<T extends DefaultAttribute | void = DefaultAttribute> = (
  ctx: IWebGL2DRender
   ) => Promise<T>
  type SyncRenderFunction<T extends DefaultAttribute | void = DefaultAttribute> = (
  ctx: IWebGL2DRender
  ) => T
  type VoidRenderFunction = (ctx: IWebGL2DRender) => void
  type RenderCallback<T extends DefaultAttribute | void = void> =
  | AsyncRenderFunction<T>
  | SyncRenderFunction<T>
  | Promise<T>
  | VoidRenderFunction
 ```
 ## All internal interaction events are implemented through the browser's native API, without the need for third-party libraries or independently writing event bus controls.
 ```ts
export interface ListenerRecord<T> {
  name: keyof T & string
  callback: CustomEventListener<T[keyof T]>
}

export class NativeEvent<T> extends EventTarget {
  private recorder: ListenerRecord<T>[] = []

  // Trigger an event
  $emit(name: keyof T & string, data: T[keyof T]) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: data
      })
    )
  }

  // Listen for an event
  $on<E extends keyof T & string>(name: E, listener: CustomEventListener<T[E]>) {
    this.recorder.push({
      name,
      callback: listener as CustomEventListener<T[keyof T]>
    })
    return this.addEventListener(name, listener as EventListener)
  }

   // Remove all events
  $remove(name?: keyof T & string) {
    if (name) {
      this.recorder = this.recorder.filter(record => record.name !== name)
      this.removeEventListener(
        name,
        this.recorder.find(record => record.name === name)?.callback as EventListener
      )
    } else {
      this.recorder.forEach(record => {
        this.removeEventListener(record.name, record.callback as EventListener)
      })
      this.recorder = []
    }
  }
}

 ```
 ### They all inherit from a base class and can perform event interactions just like DOM elements.
 ```ts
 export interface LayerEvent {
  matrixChange: {
    matrix: mat4
    layer: ILayer
  }
  resize: {
    layer: ILayer
    newWidth: number
    newHeight: number
  }
  beforeUpdate: {
    layer: ILayer
  }
  update: {
    layer: ILayer
  }
  befoerDraw: {
    layer: ILayer
  }
  render: {
    layer: ILayer
  }
}
export interface ILayer extends NativeEvent<LayerEvent> {}
```

you can easily listen for their events.
```js
layer.$on('befoerUpdate', (layer) => {
  // 执行回调
})
``` 