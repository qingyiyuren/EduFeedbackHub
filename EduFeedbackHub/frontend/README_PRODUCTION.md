# Frontend Production Build Guide

## 生产环境构建说明

### 环境配置
- **开发环境**: 使用本地后端 `http://localhost:8000`
- **生产环境**: 使用Render后端 `https://edufeedbackhub.onrender.com`

### 构建步骤

#### 方法1: 使用批处理文件 (推荐)
```bash
# 在frontend目录下运行
build-production.bat
```

#### 方法2: 手动构建
```bash
# 1. 安装依赖
npm install

# 2. 构建生产版本
npm run build
```

### 构建结果
构建完成后，所有文件都在 `dist` 文件夹中，包括：
- `index.html` - 主页面
- `assets/` - 静态资源文件
- 其他必要的构建文件

### 部署说明
1. 将 `dist` 文件夹中的所有内容上传到你的静态文件托管服务
2. 确保你的托管服务支持单页应用路由
3. 前端会自动连接到Render上的后端API

### 本地开发
本地开发不受影响，仍然使用：
```bash
npm run dev
```

### 注意事项
- 生产构建会自动使用Render后端地址
- 本地开发仍然使用本地后端
- 环境变量通过 `env.production` 文件配置
