import stringFormat from 'string-format'
const shaderVersion = `#version 300 es
`

/**
 * 定义一个常量 shaderCommonHeaderTxt，包含了一些在 GLSL 着色器中常用的预处理器指令和精度限定符。
 * 定义圆周率的近似值
 * #define M_PI 3.1415926535897932384626433832795
 * 设置整数类型的精度为 lowp
 * precision lowp int;
 * 设置浮点数类型的精度为 mediump
 * precision mediump float;
 * 设置 sampler2DArray 类型的精度为 mediump
 * precision mediump sampler2DArray;
 */
const shaderCommonHeaderTxt = `
  #define M_PI 3.1415926535897932384626433832795
  precision lowp int;
  precision mediump float;
  precision mediump sampler2DArray;
`

/**
 * 定义一个常量 shaderFragHeaderTxt，包含了一些在 GLSL 着色器中常用的片段着色器代码。
 * 定义输出变量 fragColor，用于存储最终的颜色值。
 * 定义 uniform 变量 uGlobalAlpha，用于控制全局透明度。
 * 定义一个函数 fragShaderPostprocess，用于在片段着色器中进行后处理操作。
 * 在 fragShaderPostprocess 函数中，将 fragColor 乘以 vec4(1, 1, 1, uGlobalAlpha)，以应用全局透明度。
 * 然后，将 fragColor 的 alpha 通道乘以 runTextFragShader() 的返回值，以应用文本遮罩效果。
 */
const shaderFragHeaderTxt = `
  out vec4 fragColor;
  uniform float uGlobalAlpha;

  void fragShaderPostprocess(void) {
    fragColor *= vec4(1, 1, 1, uGlobalAlpha);
    fragColor.a *= runTextFragShader();
  }
`

/**
 * 定义一个常量 textVertShaderTxt，包含了一些在 GLSL 着色器中常用的顶点着色器代码。
 * 定义输入变量 aTextPageCoord，用于存储文本页面坐标。
 * 定义 uniform 变量 uTextEnabled，用于控制文本是否启用。
 * 定义输出变量 vTextPageCoord，用于将文本页面坐标传递给片段着色器。
 * 定义一个函数 runTextVertShader，用于在顶点着色器中进行文本处理操作。
 * 在 runTextVertShader 函数中，如果 uTextEnabled 为 true，则将 aTextPageCoord 赋值给 vTextPageCoord。
 */
const textVertShaderTxt = `
  in vec3 aTextPageCoord;
  uniform bool uTextEnabled;
  out vec3 vTextPageCoord;

  void runTextVertShader(void) {
    if (uTextEnabled) {
      vTextPageCoord = aTextPageCoord;
    }
  }
`
/**
 * 定义一个常量 textFragShaderTxt，包含了一些在 GLSL 着色器中常用的片段着色器代码。
 * 定义 uniform 变量 uTextPages，用于存储文本页面的纹理。
 * 定义 uniform 变量 uTextEnabled，用于控制文本是否启用。
 * 定义 uniform 变量 uTextDistanceFieldThreshold，用于控制文本距离场的阈值。
 * 定义 uniform 变量 uTextStrokeWidth，用于控制文本描边的宽度。
 * 定义输入变量 vTextPageCoord，用于存储文本页面坐标。
 * 定义一个函数 runTextFragShader，用于在片段着色器中进行文本处理操作。
 * 在 runTextFragShader 函数中，如果 uTextEnabled 为 true，则从 uTextPages 纹理中采样 alpha 通道的值。
 * 如果 uTextStrokeWidth 小于 0.0，则将采样值与 uTextDistanceFieldThreshold 进行比较。
 * 如果采样值小于阈值，则将 textMask 设置为 0.0，否则设置为 1.0。
 * 如果 uTextStrokeWidth 大于等于 0.0，则将采样值与 lowerThreshold 和 upperThreshold 进行比较。
 * 如果采样值小于 lowerThreshold 或大于 upperThreshold，则将 textMask 设置为 0.0，否则设置为 1.0。
 * 最后，返回 textMask 的值。
 * 如果 uTextEnabled 为 false，则返回 1.0。
 */
const textFragShaderTxt = `
  uniform sampler2DArray uTextPages;
  uniform bool uTextEnabled;
  uniform float uTextDistanceFieldThreshold;
  uniform float uTextStrokeWidth;

  in vec3 vTextPageCoord;

  float runTextFragShader() {
    if (uTextEnabled) {
      float textMask = texture(uTextPages, vTextPageCoord).a;
      if (uTextStrokeWidth < 0.0) {
        if (textMask < uTextDistanceFieldThreshold) {
          textMask = 0.0;
        } else {
          textMask = 1.0;
        }
      } else {
        float lowerThreshold = max(0.0001, uTextDistanceFieldThreshold - uTextStrokeWidth);
        float upperThreshold = min(0.9999, uTextDistanceFieldThreshold + uTextStrokeWidth);
        if (textMask < lowerThreshold || textMask > upperThreshold) {
          textMask = 0.0;
        } else {
          textMask = 1.0;
        }
      }
      return textMask;
    } else {
      return 1.0;
    }
  }
`
export const flatShaderTxt = {
  vert:
    shaderVersion +
    shaderCommonHeaderTxt +
    textVertShaderTxt +
    `
      in vec2 aVertexPosition;

      uniform bool uSkipMVTransform;

      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;

      void main(void) {
        if (uSkipMVTransform) {
          gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);
        } else {
          gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);
        }
        runTextVertShader();
      }
    `,
  frag:
    shaderVersion +
    shaderCommonHeaderTxt +
    textFragShaderTxt +
    shaderFragHeaderTxt +
    `

      uniform vec4 uColor;

      void main(void) {
        fragColor = uColor;
        fragShaderPostprocess();
      }
    `
}

const gradMapperFragShaderTxt = `
  const int MAX_STOPS = {maxGradStops};
  uniform vec4 colors[MAX_STOPS];
  uniform float offsets[MAX_STOPS];

  vec4 mapToGradStop(float t) {
    vec4 stopColor = colors[0];
    for(int i = 0; i < MAX_STOPS; i ++) {
      if (offsets[i+1] == -1.0) {
        stopColor = colors[i];
        break;
      }
      if (t >= offsets[i] && t < offsets[i+1] ) {
        float stopOffset = t-offsets[i];
        stopOffset /= offsets[i+1] - offsets[i];
        stopColor = mix(colors[i], colors[i+1], stopOffset);
        break;
      }
    }
    return stopColor;
  }


`

export const linearGradShaderTxt = {
  vert:
    shaderVersion +
    shaderCommonHeaderTxt +
    textVertShaderTxt +
    `

      in vec2 aVertexPosition;

      out vec2 vP2;

      uniform bool uSkipMVTransform;

      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;

      uniform mat4 uiMVMatrix;

      void main(void) {
        if (uSkipMVTransform) {
          gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);
          vP2 = (uiMVMatrix * vec4(aVertexPosition, 0.0, 1.0)).xy;
        } else {
          gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);
          vP2 = aVertexPosition.xy;
        }
        runTextVertShader();
      }
    `,
  frag:
    shaderVersion +
    shaderCommonHeaderTxt +
    textFragShaderTxt +
    shaderFragHeaderTxt +
    gradMapperFragShaderTxt +
    `
    
    uniform vec2 p0;
    uniform vec2 p1;

    in vec2 vP2;

    const float epsilon = 0.01;

    void main() {
      // Project coordinate onto gradient spectrum
      vec2 p1p0 = p1 - p0;
      vec2 p2p0 = vP2 - p0;
      float t = dot(p2p0, p1p0) / dot(p1p0, p1p0);

      t = clamp(t, 0.0, 1.0);

      // Map to color

      fragColor = mapToGradStop(t);

      fragShaderPostprocess();
    }
  `
}

export const radialGradShaderTxt = {
  vert:
    shaderVersion +
    shaderCommonHeaderTxt +
    textVertShaderTxt +
    `

    in vec2 aVertexPosition;

    out vec2 vP2;

    uniform bool uSkipMVTransform;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    uniform mat4 uiMVMatrix;

    void main(void) {
      if (uSkipMVTransform) {
        gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);
        vP2 = (uiMVMatrix * vec4(aVertexPosition, 0.0, 1.0)).xy;
      } else {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);
        vP2 = aVertexPosition.xy;
      }
      runTextVertShader();
    }
  `,
  frag:
    shaderVersion +
    shaderCommonHeaderTxt +
    textFragShaderTxt +
    shaderFragHeaderTxt +
    gradMapperFragShaderTxt +
    `

    uniform vec2 p0;
    uniform float r0;

    uniform vec2 p1;
    uniform float r1;

    uniform bool uCirclesTouching;

    in vec2 vP2;

    void main() {

      if (uCirclesTouching) {
        vec2 gradLine = normalize(p1-p0);
        vec2 touchPt = p0 - gradLine*r0;
        if (dot(vP2-touchPt, gradLine) < 0.0) {
          fragColor = vec4(1,1,1,0);
          fragShaderPostprocess();
          return;
        }
      }

      // Project coordinate onto gradient spectrum
      float t;
      if (distance(vP2, p0) < r0) {
        t = 0.0;
      } else if (distance(vP2, p1) > r1) {
        t = 1.0;
      } else {
        vec2 p2p0 = vP2 - p0;
        float c0theta = atan(p2p0.y, p2p0.x);
        vec2 radialP0 = vec2(r0*cos(c0theta), r0*sin(c0theta)) + p0;

        //vec2 radialP1 = vec2(r1*cos(c0theta), r1*sin(c0theta)) + p0;

        vec2 e = normalize(radialP0 - vP2);
        vec2 h = p1 - radialP0;
        float lf = dot(e,h);
        float s = r1*r1-dot(h,h)+lf*lf;

        // TODO: if s < 0, no intersection pts, what to do?
        s = sqrt(s);

        vec2 radialP1;
        if (lf < s) {
          if (lf + s >= 0.0) {
            //s = -s;
            // TODO: tangent pt. wtf.
          }
          // TODO: else no intersection? wtf?
        } else {
          radialP1 = e*(lf-s) + radialP0;
        }

        vec2 rp1p0 = radialP1 - radialP0;
        vec2 rp2p0 = vP2 - radialP0;
        t = dot(rp2p0, rp1p0) / dot(rp1p0, rp1p0);
      }

      t = clamp(t, 0.0, 1.0);

      // Map to color
      fragColor = mapToGradStop(t);
      
      fragShaderPostprocess();
    }
  `
}

export const disjointRadialGradShaderTxt = {
  vert:
    shaderVersion +
    shaderCommonHeaderTxt +
    textVertShaderTxt +
    `

    in vec2 aVertexPosition;

    out vec2 vP2;

    uniform bool uSkipMVTransform;

    uniform mat4 uMVMatrix;
    uniform mat4 uPMatrix;

    uniform mat4 uiMVMatrix;

    void main(void) {
      if (uSkipMVTransform) {
        gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);
        vP2 = (uiMVMatrix * vec4(aVertexPosition, 0.0, 1.0)).xy;
      } else {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);
        vP2 = aVertexPosition.xy;
      }
      runTextVertShader();
    }
  `,
  frag:
    shaderVersion +
    shaderCommonHeaderTxt +
    textFragShaderTxt +
    shaderFragHeaderTxt +
    gradMapperFragShaderTxt +
    `

      uniform vec2 p0;
      uniform vec2 p1;
      uniform float r0;
      uniform float r1;

      uniform vec2 uPinchPt;

      in vec2 vP2;

      uniform bool uStopDirection;

      void circleIntersection(in vec2 testPt, in vec2 pinchPt, in vec2 circlePt, in float circleRad, in bool stopDirection, out highp vec2 intersection, out bool valid){
        // TODO: this routine seems to be numerically unstable
        //  on some platforms when floats are mediump/lowp - quantify
        //  exactly where this becomes a problem

        vec2 p2p0 = testPt - pinchPt;
        vec2 p1p0 = circlePt - pinchPt;
        float proj_t = dot(p2p0,p1p0) / pow(length(p2p0),2.0);
        if (proj_t < 0.0) {
          valid = false;
          return;
        }

        highp vec2 p2p1 = testPt - circlePt;
        highp vec2 p0p1 = pinchPt - circlePt;

        highp float dx = p2p1.x - p0p1.x;
        highp float dy = p2p1.y - p0p1.y; // ABSing this fixes bad solution detection? is that the right thing to do?
        highp float dr = sqrt(dx*dx + dy*dy);
        highp float D = (p0p1.x*p2p1.y) - (p2p1.x*p0p1.y);

        highp float discriminant = pow(circleRad*dr,2.0)-pow(D,2.0);

        if (dr == 0.0) {
          valid = false;
          return;
        }

        if (discriminant <= 0.0) {
          valid = false;
          return;
        }

        float dysgn = (dy < 0.0) ? -1.0 : 1.0;
        float stopDirectionSgn = (stopDirection) ? dysgn:-dysgn;
    
        intersection = vec2(
            ( D*dy + stopDirectionSgn*dysgn*dx*sqrt(discriminant)) / pow(dr,2.0),
            (-D*dx + stopDirectionSgn*abs(dy) *sqrt(discriminant)) / pow(dr,2.0)
        );
        intersection += circlePt;
        valid = true;

        return;
      }

      void main() {

        // Project coordinate onto gradient spectrum
        // TODO: describe the geometry here

        float t = 0.0;

        vec2 pinchPt;
        bool stopDirection;
        bool skipGradCalc = false;

        // TODO: decompose main into mainEqualRadii() and mainUnequalRadii()
        // TODO: solution selection is inconsistent with ''var g = ctx.createRadialGradient(230, 25, 50, 100, 25, 20);''

        if (r0 == r1) {
          vec2 gradDirection = normalize(p1-p0);
          float vP2projection = dot(vP2-p0, gradDirection);
          if (vP2projection < -r0) {
            t = 0.0;
            skipGradCalc = true;
            vec2 vP2projectionPt = p0 + vP2projection*gradDirection;
            if (length(vP2projectionPt-vP2) > r0) {
              fragColor = vec4(1,1,1,0);
              fragShaderPostprocess();
              return;
            }
          } else if (vP2projection > length(p1-p0)+r0) {
            t = 1.0;
            vec2 vP2projectionPt = p0 + vP2projection*gradDirection;
            if (length(vP2projectionPt-vP2) > r0) {
              fragColor = vec4(1,1,1,0);
              fragShaderPostprocess();
              return;
            }
            skipGradCalc = true;
          } else {
            pinchPt = vP2 - gradDirection*max(length(vP2-p0),r0)*2.0;
          }
          stopDirection = !uStopDirection;
        } else {
          pinchPt = uPinchPt;
          stopDirection = uStopDirection;
        }

        if (!skipGradCalc) {
          highp vec2 intersection0;
          highp vec2 intersection1;
          bool valid0;
          bool valid1;

          circleIntersection(
            vP2,                   // test point
            pinchPt,               // "pinch" point
            p0, r0,                // circle center/radius
            stopDirection,        // solution selection
            intersection0, valid0  // outputs
          );

          circleIntersection(
            vP2,                   // test point
            pinchPt,               // "pinch" point
            p1, r1,                // circle center/radius
            stopDirection,        // solution selection
            intersection1, valid1  // outputs
          );

          if (!valid0 || !valid1) {
            fragColor = vec4(1,1,1,0);
            fragShaderPostprocess();
            return;
          }

          vec2 gradLine = normalize(vP2 - pinchPt);

          float minPt = dot(intersection0-pinchPt, gradLine);
          float maxPt = dot(intersection1-pinchPt, gradLine) - minPt;
          float fragPt = dot(vP2-pinchPt, gradLine) - minPt;

          fragPt = clamp(fragPt, 0.0, maxPt);
          t = fragPt / maxPt;
        }


        // Map to color
        fragColor = mapToGradStop(t);

        fragShaderPostprocess();
      }
    `
}
export const patternShaderRepeatValues = {
  'no-repeat': 0,
  'repeat-x': 1,
  'repeat-y': 2,
  repeat: 3,
  'src-rect': 4 // Only used for drawImage() and putImageData()
}

export const patternShaderTxt = {
  vert:
    shaderVersion +
    shaderCommonHeaderTxt +
    textVertShaderTxt +
    stringFormat(
      `

      in vec2 aVertexPosition;
      in vec2 aTexCoord;

      uniform bool uSkipMVTransform;

      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;

      uniform int uRepeatMode;
      uniform vec2 uTextureSize;
      out vec2 vTexCoord;

      uniform mat4 uiMVMatrix;

      void main(void) {
        if (uSkipMVTransform) {
          gl_Position = uPMatrix * vec4(aVertexPosition, 0.0, 1.0);
          vTexCoord = (uiMVMatrix * vec4(aVertexPosition, 0.0, 1.0)).xy / uTextureSize;
        } else {
          gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 0.0, 1.0);
          vTexCoord = aVertexPosition / uTextureSize;
        }

        if (uRepeatMode == {src-rect}) {
          vTexCoord = aTexCoord;
        }

        runTextVertShader();
      }
    `,
      patternShaderRepeatValues
    ),
  frag:
    shaderVersion +
    shaderCommonHeaderTxt +
    textFragShaderTxt +
    shaderFragHeaderTxt +
    stringFormat(
      `

      uniform int uRepeatMode;
      uniform sampler2D uTexture;
      in vec2 vTexCoord;

      void main(void) {
        if ((uRepeatMode == {no-repeat} || uRepeatMode == {src-rect}) && (
          vTexCoord.x < 0.0 || vTexCoord.x > 1.0 ||
          vTexCoord.y < 0.0 || vTexCoord.y > 1.0))
        {
          fragColor = vec4(0,0,0,0);
        } else if (uRepeatMode == {repeat-x} && (
          vTexCoord.y < 0.0 || vTexCoord.y > 1.0))
        {
          fragColor = vec4(0,0,0,0);
        } else if (uRepeatMode == {repeat-y} && (
          vTexCoord.x < 0.0 || vTexCoord.x > 1.0))
        {
          fragColor = vec4(0,0,0,0);
        } else {
          vec2 wrappedCoord = mod(vTexCoord, 1.0);
          fragColor = texture(uTexture, wrappedCoord).rgba;
        }
        fragShaderPostprocess();
      }
    `,
      patternShaderRepeatValues
    )
}
