# Vercel 部署指南

## 🚀 超简单 3 步部署

### 第 1 步：准备代码

项目已经配置好 Vercel，包含：
- ✅ `vercel.json` - Vercel 配置文件
- ✅ `api/` - Serverless API 函数
- ✅ `public/` - 静态文件

### 第 2 步：部署到 Vercel

#### 方法 A：使用 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 部署
cd C:\Users\gao-huan\Desktop\qr-request-tool
vercel

# 首次部署会询问：
# - Set up and deploy? → Y
# - Which scope? → 选择你的账号
# - Link to existing project? → N
# - What's your project's name? → qr-request-tool
# - In which directory is your code located? → ./
# - Want to override the settings? → N

# 4. 部署到生产环境
vercel --prod
```

#### 方法 B：使用 GitHub + Vercel 网页（最简单）

1. **上传到 GitHub**
   ```bash
   cd C:\Users\gao-huan\Desktop\qr-request-tool
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create qr-request-tool --public --source=. --push
   ```

2. **连接 Vercel**
   - 访问 https://vercel.com
   - 点击 "New Project"
   - Import 你的 GitHub 仓库
   - 点击 "Deploy"

### 第 3 步：访问你的应用

部署成功后，Vercel 会给你一个地址：

```
https://qr-request-tool.vercel.app
https://qr-request-tool.vercel.app/jd.html
```

---

## 📋 项目结构

```
qr-request-tool/
├── api/                    # Serverless 函数
│   ├── generate-qr.js     # 生成二维码 API
│   └── proxy-request.js   # 代理请求 API
├── public/                 # 静态文件
│   ├── index.html         # 通用版主页
│   ├── jd.html            # 京东简化版
│   └── execute.html       # 执行页面（需更新）
├── vercel.json            # Vercel 配置
└── package.json           # 依赖配置
```

---

## 🔧 需要更新的文件

由于 Vercel 是 Serverless，需要更新前端页面的 API 调用路径：

### 1. 更新 `public/index.html`

将 API 调用从：
```javascript
fetch('/api/generate-qr', ...)
```

改为：
```javascript
fetch('/api/generate-qr', ...)  // 保持不变，Vercel 会自动路由
```

### 2. 更新 `public/jd.html`

同样保持 `/api/generate-qr` 路径即可。

### 3. 更新 `public/execute.html`

这个文件需要从 URL 参数读取配置，而不是从服务器 ID 获取。

---

## ✅ Vercel 优势

- ✅ **完全免费**（个人项目）
- ✅ **自动 HTTPS**
- ✅ **全球 CDN** 加速
- ✅ **自动部署** Git 推送后自动部署
- ✅ **无需服务器** 无需维护
- ✅ **自定义域名** 支持绑定自己的域名

---

## 🌐 自定义域名（可选）

部署后可以绑定自己的域名：

1. Vercel 控制台 → Settings → Domains
2. 添加你的域名：`qr.yourdomain.com`
3. 按提示配置 DNS（CNAME 或 A 记录）
4. 等待生效（通常几分钟）

---

## 📱 API 路由

部署后的 API 地址：

```
POST /api/generate-qr      # 生成二维码
POST /api/proxy-request    # 代理执行请求
```

---

## 🔥 一键部署命令

```bash
# 确保在项目目录
cd C:\Users\gao-huan\Desktop\qr-request-tool

# 安装 Vercel CLI
npm install -g vercel

# 登录并部署
vercel login
vercel --prod

# 完成！复制显示的 URL 即可访问
```

---

## 💡 常见问题

### Q: 二维码中的链接是什么？
A: 现在是 `https://你的域名.vercel.app/execute.html?data=加密数据`

### Q: 数据存储在哪里？
A: 数据编码在 URL 中，无需服务器存储（更安全）

### Q: 有请求限制吗？
A: 免费版：
- 100 GB 带宽/月
- 100 次部署/天
- 无限请求（有合理使用限制）

### Q: 支持自定义域名吗？
A: 支持，而且免费 HTTPS 证书

---

## 🎯 推荐配置

部署到 Vercel 后，访问地址：

```
https://qr-request-tool-你的用户名.vercel.app/jd.html
```

可以：
1. 收藏到手机浏览器
2. 添加到主屏幕
3. 随时随地使用

比自己搭服务器简单 100 倍！
