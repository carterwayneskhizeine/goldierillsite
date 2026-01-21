import * as THREE from 'three';

export function createPageThree() {
  const section = document.createElement('section');
  section.className = 'full-page';

  // 1. 初始化场景
  const scene = new THREE.Scene();

  // 使用正交相机进行 2D 渲染
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
uniform vec3 iMouse;

#define FAR 30.
#define PI 3.1415

int m = 0;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
mat3 lookAt(vec3 dir) {
    vec3 up=vec3(0.,1.,0.);
    vec3 rt=normalize(cross(dir,up));
    return mat3(rt, cross(rt,dir), dir);
}

float gyroid(vec3 p) { return dot(cos(p), sin(p.zxy)) + 1.; }

float map(vec3 p) {
    float r = 1e5, d;

    d = gyroid(p);
    if (d<r) { r=d; m=1; }

    d = gyroid(p - vec3(0,0,PI));
    if (d<r) { r=d; m=2; }

    return r;
}

float raymarch(vec3 ro, vec3 rd) {
    float t = 0.;
    for (int i=0; i<150; i++) {
        float d = map(ro + rd*t);
        if (abs(d) < .001) break;
        t += d;
        if (t > FAR) break;
    }
    return t;
}

float getAO(vec3 p, vec3 sn){
	float occ = 0.;
    for (float i=0.; i<4.; i++) {
        float t = i*.08;
        float d = map(p + sn*t);
        occ += t-d;
    }
    return clamp(1.-occ, 0., 1.);
}

vec3 getNormal(vec3 p){
    vec2 e = vec2(0.5773,-0.5773)*0.001;
    return normalize(e.xyy*map(p+e.xyy) + e.yyx*map(p+e.yyx) + e.yxy*map(p+e.yxy) + e.xxx*map(p+e.xxx));
}

vec3 trace(vec3 ro, vec3 rd) {
    vec3 C = vec3(0);
    vec3 throughput = vec3(1);

    for (int bounce = 0; bounce < 2; bounce++) {
        float d = raymarch(ro, rd);
        if (d > FAR) { break; }

        // fog
        float fog = 1. - exp(-.008*d*d);
        C += throughput * fog * vec3(0); throughput *= 1. - fog;

        vec3 p = ro + rd*d;
        vec3 sn = normalize(getNormal(p) + pow(abs(cos(p*64.)), vec3(16))*.1);

        // lighting
        vec3 lp = vec3(10.,-10.,-10.+ro.z) ;
        vec3 ld = normalize(lp - p);
        float diff = max(0., .5+2.*dot(sn, ld));
        float diff2 = pow(length(sin(sn*2.)*.5+.5), 2.);
        float diff3 = max(0., .5+.5*dot(sn, vec2(1,0).yyx));

        float spec = max(0., dot(reflect(-ld, sn), -rd));
        float fres = 1. - max(0.,dot(-rd, sn));
        vec3 col = vec3(0), alb = vec3(0);

        col += vec3(.4, .6, .9) * diff;
        col += vec3(.5, .1, .1) * diff2;
        col += vec3(.9, .1, .4) * diff3;
        col += vec3(.3,.25,.25) * pow(spec,4.)*8.;

        float freck = dot(cos(p*23.),vec3(1));
        if (m==1) { alb = vec3(.2, .1, .9);  alb *= max(.6, step(2.5, freck)); }
        if (m==2) { alb = vec3(.6, .3, .1);  alb *= max(.8, step(-2.5, freck)); }
        col *= alb;

        col *= getAO(p, sn);
        C += throughput * col;

        // reflection
        rd = reflect(rd, sn);
        ro = p + sn*.01;
        throughput *=  .9 * pow(fres, 1.);

    }
    return C;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord.xy - iResolution.xy*.5) / iResolution.y;
    vec2 mo = (iMouse.xy - iResolution.xy*.5) / iResolution.y;

    vec3 ro = vec3(PI/2.,0, -iTime*.5);
    vec3 rd = normalize(vec3(uv, -.5));

    if (iMouse.z > 0.) {
        rd.zy = rot(mo.y*PI) * rd.zy;
        rd.xz = rot(-mo.x*PI) * rd.xz;
    } else {
        rd.xy = rot(sin(iTime*.2)) * rd.xy;
        vec3 ta = vec3(cos(iTime*.4), sin(iTime*.4), 4.);
        rd = lookAt(normalize(ta)) * rd;
    }

    vec3 col = trace(ro, rd);

    col *= smoothstep(0.,1., 1.2-length(uv*.9));
    col = pow(col, vec3(0.4545));
    fragColor = vec4(col, 1.0);
}

// Three.js 的主入口函数
void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

  // 3. 创建 ShaderMaterial
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
    iMouse: { value: new THREE.Vector3(0, 0, 0) }
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
  function animate(time) {
    animationId = requestAnimationFrame(animate);

    // 更新时间 (从毫秒转换为秒)
    uniforms.iTime.value = time * 0.001;

    renderer.render(scene, camera);
  }

  animate();

  // 6. 处理窗口大小调整
  function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    uniforms.iResolution.value.x = width;
    uniforms.iResolution.value.y = height;
  }

  window.addEventListener('resize', onWindowResize, false);

  // 7. 处理鼠标移动
  function onMouseMove(event) {
    uniforms.iMouse.value.x = event.clientX;
    uniforms.iMouse.value.y = window.innerHeight - event.clientY;
  }

  function onMouseDown(event) {
    uniforms.iMouse.value.z = 1;
  }

  function onMouseUp(event) {
    uniforms.iMouse.value.z = 0;
  }

  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mouseup', onMouseUp, false);

  // 8. 触摸事件支持（移动设备交互）
  function onTouchStart(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      uniforms.iMouse.value.x = touch.clientX;
      uniforms.iMouse.value.y = window.innerHeight - touch.clientY;
      uniforms.iMouse.value.z = 1;
    }
  }

  function onTouchMove(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      uniforms.iMouse.value.x = touch.clientX;
      uniforms.iMouse.value.y = window.innerHeight - touch.clientY;
    }
  }

  function onTouchEnd(event) {
    uniforms.iMouse.value.z = 0;
  }

  window.addEventListener('touchstart', onTouchStart, false);
  window.addEventListener('touchmove', onTouchMove, false);
  window.addEventListener('touchend', onTouchEnd, false);

  // 清理函数，当页面被销毁时调用
  section._cleanup = () => {
    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    cancelAnimationFrame(animationId);
    renderer.dispose();
    geometry.dispose();
    material.dispose();
  };

  return section;
}
