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

// Day 168 !
// Having a play with repeated angular repetition.

#define res iResolution.xy
#define B vec3(0.2126, 0.7152, 0.0722)
#define PI 3.141

mat2 rotMat(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

vec3 camPath(float t) {
    return 5.0 * vec3(cos(t), 1.0, sin(t));
}

vec2 angularRep(vec2 p, float n, float sa) {
    float a = atan(p.y, p.x) + sa;
    float r = length(p);

    float sector = 2.0 * PI / n;

    a = mod(a + sector * 0.5, sector) - sector * 0.5;

    return vec2(cos(a) * r, sin(a) * r);
}

float map(vec3 p) {
    vec3 q = p;

    float d1 = 1e20;

    float n = 5.0;
    float s = 1.0;
    for(int i = 0; i < 3; i++) {
        p.xz = angularRep(p.xz, n, (iTime + p.y) * (0.1 + float(i)));
        //p.xy = angularRep(p.xy, 2.0 * n, iTime * 0.5 * float(i));
        p -= vec3(1.0, 0.0, 0.0) * s;
        d1 = min(d1, length(p.xz) - s * 0.1);

        s *= 0.25;
    }

    return max(d1, p.y);
}

vec2 raymarch(vec3 rayOrigin, vec3 rayDir, int iter, bool f) {
    float td = 0.0;
    bool hit = false;
    float ld = 1e20;

    float k = f ? -1.0 : 1.0;
    for(int i = 0; i < iter; i++) {
        vec3 rayPos = rayOrigin + rayDir * td;
        float d = map(rayPos) * k;
        if(i == 0) ld = d;

        if(d < 0.005 && abs(ld - d) < 0.01) { hit = true; break; }

        td += d; ld = d;
        if(td > 120.0) { td = 120.0; break; }
    }

    return vec2(hit, td);
}
vec2 raymarch(vec3 rayOrigin, vec3 rayDir) { return raymarch(rayOrigin, rayDir, 200, false); }

float softShadow(vec3 ro, vec3 rd, float k) {
    float re = 1.0;
    float t = 0.01;
    for (int i = 0; i < 50; i++) {
        float h = map(ro + rd * t);
        if (h < 0.001) return 0.0;
        re = min(re, k * h / t);
        t += h;
        if (t > 10.0) break;
    }
    return tanh(re);
}

float edge;
vec3 getNormal(vec3 p) {
    float t = 0.1;
    vec2 e = vec2(1./mix(400., iResolution.y, .5)*(1. + t*.5), 0) * 15.;

    float d1 = map(p + e.xyy), d2 = map(p - e.xyy);
    float d3 = map(p + e.yxy), d4 = map(p - e.yxy);
    float d5 = map(p + e.yyx), d6 = map(p - e.yyx);
    float d = map(p)*2.;

    edge = abs(d1 + d2 - d) + abs(d3 + d4 - d) + abs(d5 + d6 - d);
    edge = smoothstep(0., 1., sqrt(edge/e.x*2.));

    e = vec2(.002, 0);
    d1 = map(p + e.xyy), d2 = map(p - e.xyy);
    d3 = map(p + e.yxy), d4 = map(p - e.yxy);
    d5 = map(p + e.yyx), d6 = map(p - e.yyx);

    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

void mainImage( out vec4 O, in vec2 I )
{
    vec2 p = (I - 0.5 * res) / res.y;

    float time = iTime * 0.3 - 0.5 - 0.5 * 3.141;
    vec3 camPos = camPath(time);
    vec3 camDir = normalize(-camPos);

    float fov = radians(45.0);
    vec3 worldUp = vec3(0.0, 1.0, 0.0);
    vec3 camRight = normalize(cross(camDir, worldUp));
    vec3 camUp = cross(camRight, camDir);

    float t = tan(fov * 0.5);

    vec3 rayOrigin = camPos;
    vec3 rayDir = normalize(camDir + p.x * camRight * t + p.y * camUp * t);

    vec2 rm = raymarch(rayOrigin, rayDir);
    bool hit = rm.x > 0.5;
    float td = rm.y;

    vec3 col;
    if(hit) {
        vec3 hitPoint = rayOrigin + rayDir * td;
        vec3 normal = getNormal(hitPoint);
        //normal = doBumpMap(hitPoint, normal, 0.02);

        float time = 0.5 * iTime;
        vec3 lightDir = normalize(vec3(1));

        float shadow = softShadow(hitPoint + 0.3 * normal, lightDir, 1.0);
        float specular = pow(dot(reflect(hitPoint, normal), lightDir), 15.0);

        float light = shadow + tanh(5.0 * specular);

        vec3 color;
        color = vec3(1.0);

        col = color * light;
    }
    else {
        col = vec3(1);
    }

    O = vec4(col, 1.0);
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
