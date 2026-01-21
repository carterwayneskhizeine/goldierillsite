import * as THREE from 'three';

export function createPageTwo() {
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

  // 2. 加载纹理 (iChannel0)
  const loader = new THREE.TextureLoader();
  const texture = loader.load('/pic.jpg');
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // 3. 定义 Shadertoy 代码
  const fragmentShader = `
uniform float iTime;
uniform vec3 iResolution;
uniform sampler2D iChannel0;

/* --- 开始粘贴 Shadertoy 代码 --- */

/*
	Bumped Sinusoidal Warp
	----------------------
*/

// Warp function.
vec2 W(vec2 p){
    p = (p + 3.0)*4.0;
    float t = iTime/2.0;
    for (int i=0; i<3; i++){
        p += cos(p.yx*3.0 + vec2(t, 1.57))/3.0;
        p += sin(p.yx + t + vec2(1.57, 0.0))/2.0;
        p *= 1.3;
    }
    p += fract(sin(p+vec2(13.0, 7.0))*5e5)*0.03 - 0.015;
    return mod(p, 2.0) - 1.0;
}

float bumpFunc(vec2 p){
	return length(W(p))*0.7071;
}

vec3 smoothFract(vec3 x){ x = fract(x); return min(x, x*(1.0-x)*12.0); }

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    // Screen coordinates.
	vec2 uv = (fragCoord - iResolution.xy*0.5)/iResolution.y;

    vec3 sp = vec3(uv, 0.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 lp = vec3(cos(iTime)*0.5, sin(iTime)*0.2, -1.0);
	vec3 sn = vec3(0.0, 0.0, -1.0);

    vec2 eps = vec2(4.0/iResolution.y, 0.0);

    float f = bumpFunc(sp.xy);
    float fx = bumpFunc(sp.xy - eps.xy);
    float fy = bumpFunc(sp.xy - eps.yx);

	const float bumpFactor = 0.05;

    fx = (fx - f)/eps.x;
    fy = (fy - f)/eps.x;
    sn = normalize(sn + vec3(fx, fy, 0.0)*bumpFactor);

	vec3 ld = lp - sp;
	float lDist = max(length(ld), 0.0001);
	ld /= lDist;

    float atten = 1.0/(1.0 + lDist*lDist*0.15);
    atten *= f*0.9 + 0.1;

	float diff = max(dot(sn, ld), 0.0);
    diff = pow(diff, 4.0)*0.66 + pow(diff, 8.0)*0.34;
    float spec = pow(max(dot( reflect(-ld, sn), -rd), 0.0), 12.0);

    // TEXTURE COLOR
    vec3 texCol = texture(iChannel0, sp.xy + W(sp.xy)/8.0).xyz;
    texCol *= texCol;
    texCol = smoothstep(0.05, 0.75, pow(texCol, vec3(0.75, 0.8, 0.85)));

    vec3 col = (texCol*(diff*vec3(1.0, 0.97, 0.92)*2.0 + 0.5) + vec3(1.0, 0.6, 0.2)*spec*2.0)*atten;

    float ref = max(dot(reflect(rd, sn), vec3(1.0)), 0.0);
    col += col*pow(ref, 4.0)*vec3(0.25, 0.5, 1.0)*3.0;

	fragColor = vec4(sqrt(clamp(col, 0.0, 1.0)), 1.0);
}

/* --- 结束 Shadertoy 代码 --- */

// Three.js 的主入口函数
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

  // 4. 创建 ShaderMaterial
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
    iChannel0: { value: texture }
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

  // 5. 创建全屏平面
  const geometry = new THREE.PlaneGeometry(2, 2);
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  // 6. 动画循环
  let animationId;
  function animate(time) {
    animationId = requestAnimationFrame(animate);

    // 更新时间 (从毫秒转换为秒)
    uniforms.iTime.value = time * 0.001;

    renderer.render(scene, camera);
  }

  animate();

  // 7. 处理窗口大小调整
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
    texture.dispose();
  };

  return section;
}
