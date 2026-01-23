# Goldierillcn 项目文档
## Docker 操作指南
### 基础命令
- **构建并启动容器**
  ```bash
  docker compose up -d
  ```
- **查看日志**
  ```bash
  docker compose logs -f
  ```
- **停止容器**
  ```bash
  docker compose down
  ```
- **重新构建镜像**
  ```bash
  docker compose up -d --build
  ```
- **重启服务**
  ```bash
  docker compose down && docker compose up -d
  ```
### 访问信息
- **访问地址**：http://localhost:5933
- **热重载**：代码修改自动生效（通过 `volumes` 挂载实现）
---
## 项目介绍
**Goldierillcn** 是一个基于 Vite + Three.js + Docker 的全屏滚动 WebGL 艺术展示网站。
### 核心特性
#### 1. 技术栈
- **Vite** - 快速的前端构建工具
- **Three.js** - 3D/WebGL 渲染引擎
- **Shadertoy** - GLSL 着色器艺术效果
- **Docker** - 容器化部署
#### 2. 页面结构
- 共 9 个全屏页面（`PageOne` - `PageNine`）。
- 每个页面使用 Three.js 渲染独特的 **GLSL Fragment Shader** 效果。
- 集成 Shadertoy 风格的着色器，包含纹理贴图和实时动画。
#### 3. 滚动交互
实现无缝循环滚动逻辑：
- **技术原理**：使用克隆页面技术。
- **DOM 结构**：`[克隆NINE]` + `[ONE...NINE]` + `[克隆ONE]`
- **循环逻辑**：
  - 从 **ONE** 向上滑动 → 平滑滑动到克隆的 **NINE** → 瞬间跳回真实的 **NINE**。
  - 从 **NINE** 向下滑动 → 平滑滑动到克隆的 **ONE** → 瞬间跳回真实的 **ONE**。
---
## 项目结构
```text
goldierillcn/
├── src/
│   ├── main.js           # 主入口 + 滚动逻辑
│   ├── style.css         # 全局样式
│   └── pages/
│       ├── PageOne.js    # Shadertoy 着色器页面
│       ├── PageTwo.js
│       └── ...           # 其他页面组件
├── package.json
├── docker-compose.yml
└── Dockerfile
```