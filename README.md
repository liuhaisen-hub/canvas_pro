# Canvas pro

如果你在寻找一个使用`JavaScript` 的`WEBGL` 来绘制的2d图形库，或者平替当前使用的原生canvas API，以提高图层绘制和管理的性能。那么你可以尝试使用一下这个简单、轻量、易用的库

### 基于WebGL 重构 HTML Canvas API
- 使用`WebGL `重构 原生`Canvas API`的库
- 一行代码便可直接转换使用
- 除了提供所有原生Canvas API的支持外，提供更多的图形绘制API
- 具有可监听的绘图生命周期
- 内置位移，缩放，旋转等变化后的重绘制
- 提供图层（layer）的管理
- 多图层画面中，支持对单一图层的控制
- 支持离屏幕渲染，以及渲染管线缓冲
- 使用TypeScript 开发，拥有较好了类型提示
- 基于浏览器的原生事件管理图层，使图层的绘制管理更轻更快。
- 采用Rslib进行打包，支持swc，模块联邦等输出。[rslib](https://lib.rsbuild.dev/zh/guide/start/quick-start)
- 支持WebWorker后台渲染

## 作者 

- 刘海森 [@threemu](http://threemu.top) 

## 使用简单
只需一行代码便可直接使用
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


## 支持的API

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
  

## 新增图层管理，相机管理

 1. createLayer
    * 将会创建一个离屏的图形层
    * 可以对该图层进行大小裁剪，放大，缩小，位移
    * 图层缓存在GPU的管线中
 2. composeLayer 
    * 将会把GPU的渲染管线都合成在主屏幕上
    * 合并所有图层后，其中一个图层发生动画变化，整体的图层都会随之更新
 3. carmera 
    * 作为全局的相机，可以不改变图层的情况下，移动，放大，缩小视图

 ## 基本API的使用
 ### 使用canvas API的原生方法绘制
 ```js
   ctx.fillStyle = 'red'
   ctx.fillRect(100,100,100,100)
 ``` 
 ### 使用函数内传值  
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

 ### Camera的使用
 ```ts
  active(viewWidth: number, viewHeight: number): void
  // 平移相机
  pan(tx: number, ty: number): void

  // 绕Z轴旋转（适用于2D）
  rotate(angle: number, centerX?: number, centerY?: number): void

  // 缩放（以视口中心为基准）
  zoom(scale: number, centerX?: number, centerY?: number): void
  // 实现 lookAt 方法
  lookAt(targetX: number, targetY: number): void
  getViewMatrix(): mat4
  getProjectionMatrix(): mat4
  updateViewport(width: number, height: number): void
  // 获取相机在浏览器坐标系中的平移量
  getBrowserTranslation(): vec2
  // 如果视口在浏览器中的位置不是 (0, 0)，可以使用以下方法
  getBrowserTranslationWithViewport(viewportX: number, viewportY: number): vec2
  getScale(): { x: number; y: number }
 ```

 ### 图层的使用
 ```ts
 // 激活图层
  active(renderer: IWebGL2DRender): void
  resize(newWidth: number, newHeight: number): void
  // 释放所有资源
  release(): void
  // 重置资源
  reset(): void
  // 平移图层
  translate(tx: number, ty: number): void
  // 缩放图层
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
 ## 所有的内部交互事件都通过浏览器原生API方式实现，无需第三方库，或独立的编写事件总线控制。
 ```ts
export interface ListenerRecord<T> {
  name: keyof T & string
  callback: CustomEventListener<T[keyof T]>
}

export class NativeEvent<T> extends EventTarget {
  private recorder: ListenerRecord<T>[] = []

  // 触发事件
  $emit(name: keyof T & string, data: T[keyof T]) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail: data
      })
    )
  }

  // 监听事件
  $on<E extends keyof T & string>(name: E, listener: CustomEventListener<T[E]>) {
    this.recorder.push({
      name,
      callback: listener as CustomEventListener<T[keyof T]>
    })
    return this.addEventListener(name, listener as EventListener)
  }

  // 移除所有事件
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
 ### 他们都会继承一个基类，相当于Dom元素一样进行事件交互
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

然后你就可以轻松的监听他们的事件
```js
layer.$on('befoerUpdate', (layer) => {
  // 执行回调
})
``` 