import * as THREE from 'three';

export function createPageFive() {
  const section = document.createElement('section');
  section.className = 'full-page';

  // 1. 初始化场景
  const scene = new THREE.Scene();

  // 使用正交相机 (OrthographicCamera) 来进行 2D 渲染，这样不会有透视变形
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  section.appendChild(renderer.domElement);

  // 2. 定义 Shadertoy 代码
  const fragmentShader = `
uniform float iTime;
uniform vec3 iResolution;

// Created by Hazel Quantock 2019
// This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.

const int numCubes = 32;
const float twistStep = .06;
const float scaleStep = 0.96;
const float zoom = 3.7;
const float lineThickness = 1.2; // in pixels

// input in range [-1,1] to span iResolution.y pixels
float RenderLine( vec2 a, vec2 b, vec2 fragCoord )
{
    a = (iResolution.y*a + iResolution.xy)*.5;
    b = (iResolution.y*b + iResolution.xy)*.5;

    const float halfThickness = lineThickness*.5;

    const float halfAASoftening = .7; // in pixels (don't change this much)

    float t = dot(fragCoord-a,b-a);
    t /= dot(b-a,b-a);
    t = clamp( t, 0., 1. );
    return smoothstep( halfThickness-halfAASoftening, halfThickness+halfAASoftening, length(fragCoord - mix(a,b,t)) );
}


float RenderLine3D( vec3 a, vec3 b, vec2 fragCoord )
{
    vec3 camPos = vec3(0,0,-5);

    a -= camPos;
    b -= camPos;

    // todo: transform by camera matrix

    a.z /= zoom;
    b.z /= zoom;

    // perspective projection
    return RenderLine( a.xy/a.z, b.xy/b.z, fragCoord );
}


// combine 2 anti-aliased values
float BlendAA( float a, float b )
{
    // a and b values represent what proportion of the pixel is covered by each line,
    // but they don't contain enough information to accurately combine them!
    // if both lines are covering the same part of the pixel the result should be min(a,b)
    // if they cover non-overlapping parts of the pixel the result is a-(1-b)
	// a*b assumes the proportion of overlap is the same in the solid and clear regions
    // this is the safest assumption given the lack of any other info

    // but, tune it until it looks good
    return mix( min(a,b), a*b, .5 );
}


void mainImage( out vec4 fragColour, in vec2 fragCoord )
{
    fragColour.rgb = vec3(.8);

    vec3 a = vec3(twistStep*cos(iTime*3./vec3(11,13,17)+1.5));
    mat3 stepTransform =
        scaleStep *
        mat3( cos(a.z), sin(a.z), 0,
             -sin(a.z), cos(a.z), 0,
              0, 0, 1 ) *
        mat3( cos(a.y), 0, sin(a.y),
             0, 1, 0,
             -sin(a.y), 0, cos(a.y) ) *
        mat3( 1, 0, 0,
              0, cos(a.x), sin(a.x),
              0,-sin(a.x), cos(a.x) );

    vec3 b = vec3(.7+iTime/6.,.7+iTime/6.,.6);
    mat3 transform =
        mat3( cos(b.z), sin(b.z), 0,
             -sin(b.z), cos(b.z), 0,
              0, 0, 1 ) *
        mat3( cos(b.y), 0, sin(b.y),
             0, 1, 0,
             -sin(b.y), 0, cos(b.y) ) *
        mat3( 1, 0, 0,
              0, cos(b.x), sin(b.x),
              0,-sin(b.x), cos(b.x) );

    float line = 1.;
    #define DrawLine(a,b) line = BlendAA( line, RenderLine3D(a,b,fragCoord) );

    for ( int cube=0; cube < numCubes; cube++ )
    {
        vec3 vertices[8];
        for ( int i=0; i < 8; i++ )
        {
            vertices[i] = transform*(vec3(i>>2,(i>>1)&1,i&1)*2.-1.);
        }

        DrawLine( vertices[0], vertices[1] );
        DrawLine( vertices[2], vertices[3] );
        DrawLine( vertices[4], vertices[5] );
        DrawLine( vertices[6], vertices[7] );
        DrawLine( vertices[0], vertices[2] );
        DrawLine( vertices[1], vertices[3] );
        DrawLine( vertices[4], vertices[6] );
        DrawLine( vertices[5], vertices[7] );
        DrawLine( vertices[0], vertices[4] );
        DrawLine( vertices[1], vertices[5] );
        DrawLine( vertices[2], vertices[6] );
        DrawLine( vertices[3], vertices[7] );

        transform *= stepTransform;
    }

    fragColour.rgb = mix( vec3(.02), vec3(.8), line );

    fragColour.rgb = pow(fragColour.rgb,vec3(1./2.2));
    fragColour.a = 1.;
}

// Three.js 的主入口函数
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

  // 3. 创建 ShaderMaterial
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) }
  };

  const material = new THREE.ShaderMaterial({
    fragmentShader: fragmentShader,
    vertexShader: `
        void main() {
            gl_Position = vec4( position, 1.0 );
        }
    `,
    uniforms: uniforms
  });

  // 4. 创建全屏平面
  const geometry = new THREE.PlaneGeometry(2, 2);
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  // 5. 动画循环
  let animationId;
  let isRunning = true;

  function animate(time) {
    if (!isRunning) return;
    animationId = requestAnimationFrame(animate);

    if (time === undefined) time = performance.now();

    // 更新时间 (从毫秒转换为秒)
    uniforms.iTime.value = time * 0.001;

    renderer.render(scene, camera);
  }

  animate();

  section.play = () => {
    if (!isRunning) {
      isRunning = true;
      animate();
    }
  };

  section.pause = () => {
    isRunning = false;
    cancelAnimationFrame(animationId);
  };

  // 6. 处理窗口大小调整
  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    uniforms.iResolution.value.x = width;
    uniforms.iResolution.value.y = height;
  }

  window.addEventListener('resize', onWindowResize, false);

  // 清理函数，当页面被销毁时调用
  section._cleanup = () => {
    window.removeEventListener('resize', onWindowResize);
    cancelAnimationFrame(animationId);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };

  return section;
}
