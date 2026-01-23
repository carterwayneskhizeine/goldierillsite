import * as THREE from 'three';

export function createPageNine() {
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

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec3 colors[5] = vec3[5](
        vec3(1.000,0.251,0.251),
        vec3(0.996,0.941,0.255),
        vec3(0.200,1.000,0.243),
        vec3(0.059,0.082,1.000),
        vec3(1.000,0.059,1.000)
    );


    // inputs
    float value = uv.x;
    float maxInputValue = 1.0;

    float maxValue = maxInputValue / float(colors.length()-1);

    float stepLow = floor(value / maxValue);
    float stepHigh = ceil(value / maxValue);

    float diff = (stepHigh - value / maxValue);
    diff = diff*diff*(3.0-2.*diff);
    vec3 col = mix(colors[int(stepLow)],colors[int(stepHigh)],1.0-diff);

    fragColor = vec4(col,1.0);
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
