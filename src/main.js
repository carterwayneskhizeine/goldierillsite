import * as THREE from 'three';

// 1. 初始化场景
const scene = new THREE.Scene();

// 使用正交相机 (OrthographicCamera) 来进行 2D 渲染，这样不会有透视变形
const camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. 加载纹理 (iChannel0)
// 原 Shader 需要一个纹理。这里我们要加载一个图片。
// 为了演示，我们使用一张在线的测试图。你可以换成本地图片 '/texture.jpg'。
const loader = new THREE.TextureLoader();
const texture = loader.load('/pic.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;

// 3. 定义 Shadertoy 代码
// 注意：我们需要在 Shadertoy 代码前面加上 Three.js 需要的 uniform 定义
const fragmentShader = `
uniform float iTime;
uniform vec3 iResolution;
uniform sampler2D iChannel0;

/* --- 开始粘贴 Shadertoy 代码 --- */

/*
	Bumped Sinusoidal Warp
	----------------------
    (原作者注释省略，直接保留核心逻辑)
*/

// Warp function.
vec2 W(vec2 p){
    p = (p + 3.)*4.;
    float t = iTime/2.;
    for (int i=0; i<3; i++){
        p += cos(p.yx*3. + vec2(t, 1.57))/3.;
        p += sin(p.yx + t + vec2(1.57, 0))/2.;
        p *= 1.3;
    }
    p += fract(sin(p+vec2(13, 7))*5e5)*.03 - .015;
    return mod(p, 2.) - 1.; 
}

float bumpFunc(vec2 p){ 
	return length(W(p))*.7071; 
}

vec3 smoothFract(vec3 x){ x = fract(x); return min(x, x*(1.-x)*12.); }

void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    // Screen coordinates.
	vec2 uv = (fragCoord - iResolution.xy*.5)/iResolution.y;
    
    vec3 sp = vec3(uv, 0); 
    vec3 rd = normalize(vec3(uv, 1)); 
    vec3 lp = vec3(cos(iTime)*.5, sin(iTime)*.2, -1); 
	vec3 sn = vec3(0, 0, -1); 

    vec2 eps = vec2(4./iResolution.y, 0);
    
    float f = bumpFunc(sp.xy); 
    float fx = bumpFunc(sp.xy - eps.xy); 
    float fy = bumpFunc(sp.xy - eps.yx); 
   
	const float bumpFactor = .05;
    
    fx = (fx - f)/eps.x; 
    fy = (fy - f)/eps.x; 
    sn = normalize(sn + vec3(fx, fy, 0)*bumpFactor);   
    
	vec3 ld = lp - sp;
	float lDist = max(length(ld), .0001);
	ld /= lDist;
   
    float atten = 1./(1. + lDist*lDist*.15);
    atten *= f*.9 + .1; 

	float diff = max(dot(sn, ld), 0.);  
    diff = pow(diff, 4.)*.66 + pow(diff, 8.)*.34; 
    float spec = pow(max(dot( reflect(-ld, sn), -rd), 0.), 12.); 
    
    // TEXTURE COLOR
    // 原代码使用了 texture()，在 ThreeJS 的标准 WebGL1 shader 中是 texture2D
    // 但如果在 WebGL2 环境或者特定配置下 texture() 也可用。
    // 为了兼容性，我们可以让 ThreeJS 处理，或者简单的用 texture2D 替换。
    // 这里我们直接用 texture，因为现代 ThreeJS 默认环境通常支持。
    vec3 texCol = texture(iChannel0, sp.xy + W(sp.xy)/8.).xyz; 
    texCol *= texCol; 
    texCol = smoothstep(.05, .75, pow(texCol, vec3(.75, .8, .85)));    
    
    vec3 col = (texCol*(diff*vec3(1, .97, .92)*2. + .5) + vec3(1, .6, .2)*spec*2.)*atten;
    
    float ref = max(dot(reflect(rd, sn), vec3(1)), 0.);
    col += col*pow(ref, 4.)*vec3(.25, .5, 1)*3.;

	fragColor = vec4(sqrt(clamp(col, 0., 1.)), 1);
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
const geometry = new THREE.PlaneGeometry( 2, 2 );
const plane = new THREE.Mesh( geometry, material );
scene.add( plane );

// 6. 动画循环
function animate(time) {
    requestAnimationFrame( animate );

    // 更新时间 (从毫秒转换为秒)
    uniforms.iTime.value = time * 0.001;
    
    renderer.render( scene, camera );
}

animate();

// 7. 处理窗口大小调整
window.addEventListener( 'resize', onWindowResize, false );

function onWindowResize(){
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize( width, height );
    uniforms.iResolution.value.x = width;
    uniforms.iResolution.value.y = height;
}
