import * as THREE from 'three';

export function createPageFour() {
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

/* --- 开始粘贴 Shadertoy 代码 --- */

// Distance field for gyroid, adapted from Paul Karlik's "Gyroid Travel" in KodeLife
//  Tweaked slightly for this effect
float g(vec4 p,float s) {
  // Makes it nicer (IMO) but costs bytes!
  // p.x=-abs(p.x);
  return abs(dot(sin(p*=s),cos(p.zxwy))-1.)/s;
}

void mainImage(out vec4 O,vec2 C) {
  // FYI: This code is intended to be as small as possible.
  //  As a consequence even harder to read than usual.

  float i, d, z, s, T = iTime;
  vec4 o, q, p, U=vec4(2,1,0,3);
  for (
    // Store resolution
    vec2 r = iResolution.xy
    // Step through the scene, up to 78 steps
    ; ++i < 79.
    // Advance along the ray by current distance estimate (+ epsilon)
    // The epsilon makes the cave walls somewhat translucent
    ; z += d + 5E-4
    // Compute ray direction, scaled by distance
    , q = vec4(normalize(vec3(C-.5*r, r.y)) * z, .2)
    // Traverse through the cave
    , q.z += T/3E1
    // Save sign before mirroring
    , s = q.y + .1
    // Creates the water reflection effect
    , q.y = abs(s)
    , p = q
    , p.y -= .11
    // Twist cave walls based on depth
    //  This uses a trick that a 2D rotation matrix
    //   mat2(cos(a), sin(a), -sin(a), cos(a)) can be approximated with:
    //   mat2(cos(a + vec4(0,11,33,0)))
    //   22/7 ~= PI, then 11 ~= 3.5*PI and 33 ~= 10.5*PI
    //   sin(a) = cos(a-0.5*PI) = cos(a-0.5*PI+4*PI) = cos(a+3.5*PI)
    //   -sin(a) = cos(a-1.5*PI) = cos(a-1.5*PI+12*PI) = cos(a+10.5*PI)
    //   If that makes sense to you.
    , p.xy *= mat2(cos(11.*U.zywz - 2. * p.z ))
    , p.y -= .2
    // Combine gyroid fields at two scales for more detail
    , d = abs(g(p,8.) - g(p,24.)) / 4.
    // Base glow color varies with distance from center
    , p = 1. + cos(.7 * U + 5. * q.z)
  )
    // Accumulate glow — brighter and sharper if not mirrored (above axis)
    o += (s > 0. ? 1. : .1) * p.w * p / max(s > 0. ? d : d*d*d, 5E-4)
    ;

  // Add pulsing glow for the "tunnelwisp"
  o += (1.4 + sin(T) * sin(1.7 * T) * sin(2.3 * T))
       * 1E3 * U / length(q.xy);

  // Apply tanh for soft tone mapping
  O = tanh(o / 1E5);
}

/* --- 结束 Shadertoy 代码 --- */

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
