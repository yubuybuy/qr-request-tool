# 换电脑继续开发指南

## 📌 项目信息

- **项目名称**: QR Request Tool（京东领券二维码生成器）
- **GitHub 仓库**: https://github.com/yubuybuy/qr-request-tool
- **在线地址**: https://qr.sswl.top
- **技术栈**: Node.js + Express + Vercel Serverless

---

## 🚀 在新电脑上开始开发

### 第一步：安装必要工具

#### 1. 安装 Git
- 下载地址: https://git-scm.com/download/win
- 验证安装:
```powershell
git --version
```

#### 2. 安装 Node.js
- 下载地址: https://nodejs.org/ (推荐 LTS 版本)
- 验证安装:
```powershell
node --version
npm --version
```

#### 3. 安装 Vercel CLI（可选，如果需要部署）
```powershell
npm install -g vercel
```

---

### 第二步：克隆项目

```powershell
# 进入你想要存放项目的目录，比如桌面
cd C:\Users\你的用户名\Desktop

# 克隆项目
git clone https://github.com/yubuybuy/qr-request-tool.git

# 进入项目目录
cd qr-request-tool

# 查看项目结构
dir
```

---

### 第三步：安装依赖

```powershell
# 安装所有 npm 包
npm install
```

**等待安装完成，会下载这些依赖：**
- express
- qrcode
- uuid
- cors

---

### 第四步：配置 Git

```powershell
# 配置你的用户名和邮箱
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"

# 验证配置
git config --global --list
```

---

### 第五步：启动开发

#### 本地开发
```powershell
# 启动本地服务器（端口 3000）
npm run dev
```

然后在浏览器打开:
- http://localhost:3000 - 主页
- http://localhost:3000/jd.html - 京东领券页面

#### Vercel 本地测试（可选）
```powershell
# 登录 Vercel
vercel login

# 关联项目
vercel link

# 启动 Vercel 本地环境
vercel dev
```

---

## 🔄 日常开发工作流程

### 开始工作前（拉取最新代码）
```powershell
cd C:\Users\你的用户名\Desktop\qr-request-tool

# 拉取最新代码
git pull origin master

# 启动开发服务器
npm run dev
```

### 完成工作后（提交并推送代码）
```powershell
# 查看修改了哪些文件
git status

# 添加所有修改到暂存区
git add .

# 提交修改（写清楚做了什么）
git commit -m "描述你做的修改"

# 推送到 GitHub
git push origin master
```

---

## 📂 项目文件结构

```
qr-request-tool/
├── api/                          # Vercel Serverless 函数
│   ├── generate-qr.js           # 生成二维码 API
│   └── proxy-request.js         # 代理请求 API（处理跨域）
├── public/                       # 静态文件
│   ├── index.html               # 通用版页面
│   ├── jd.html                  # 京东专用版（简化）
│   ├── execute.html             # 二维码扫码后的执行页面
│   └── mobile-helper.html       # 移动端辅助工具
├── package.json                  # 项目依赖配置
├── package-lock.json            # 依赖锁定文件
├── vercel.json                  # Vercel 部署配置
├── server.js                    # 本地开发服务器
├── ERROR-GUIDE.md               # 错误排查指南
├── README.md                    # 项目说明
└── SETUP-GUIDE.md               # 本文档
```

---

## 🔑 重要配置说明

### Vercel 部署
项目已经部署在 Vercel，域名绑定为 **qr.sswl.top**

如果需要在新电脑上部署/管理：
```powershell
# 登录 Vercel（会打开浏览器）
vercel login

# 关联到现有项目
vercel link
# 选择: yubuybuy 账号
# 选择: qr-request-tool 项目

# 部署到生产环境
vercel --prod
```

### 自动部署
每次 `git push` 到 GitHub 的 master 分支，Vercel 会自动部署。

---

## 💡 常见问题

### 1. npm install 失败
**原因**: 网络问题或权限问题

**解决**:
```powershell
# 清除 npm 缓存
npm cache clean --force

# 使用淘宝镜像
npm install --registry=https://registry.npmmirror.com

# 或者全局设置淘宝镜像
npm config set registry https://registry.npmmirror.com
```

### 2. git push 失败
**原因**: 网络问题或没有权限

**解决**:
```powershell
# 检查远程仓库地址
git remote -v

# 重新设置远程仓库
git remote set-url origin https://github.com/yubuybuy/qr-request-tool.git

# 重试推送
git push origin master
```

### 3. 端口 3000 已被占用
**解决**:
```powershell
# 查看占用端口的进程
netstat -ano | findstr :3000

# 结束进程（记下 PID）
taskkill /PID 进程号 /F

# 或者修改 server.js 中的端口号
```

---

## 📱 关于聊天记录和开发记忆

### ❌ 无法直接转移
- Claude Code 的聊天记录存储在本地电脑
- 换电脑后，聊天记录**不会自动同步**
- AI 助手会**失去之前的对话上下文**

### ✅ 解决方案：文档化

我已经为你整理了完整的项目文档：

1. **SETUP-GUIDE.md** (本文件)
   - 换电脑开发流程
   - 项目结构说明
   - 常见问题解决

2. **ERROR-GUIDE.md**
   - 京东领券常见错误
   - h5st 签名过期说明
   - Cookie 过期处理

3. **README.md**
   - 项目整体介绍
   - 功能说明

4. **代码注释**
   - 所有关键代码都有中文注释
   - 方便理解每个功能的作用

### 📝 给新 AI 助手的信息

如果在新电脑上开始新的对话，可以这样告诉 AI：

```
我有一个京东领券二维码生成器项目：
- GitHub: https://github.com/yubuybuy/qr-request-tool
- 部署在: https://qr.sswl.top
- 主要功能: 将 HTTP 请求编码成二维码，微信扫码后自动执行请求
- 技术栈: Node.js + Express + Vercel Serverless
- 主要文件:
  - jd.html: 京东专用版
  - api/generate-qr.js: 生成二维码
  - api/proxy-request.js: 代理请求
  - execute.html: 执行请求页面

请阅读项目中的 SETUP-GUIDE.md 和 ERROR-GUIDE.md 了解详情。
```

---

## 🎯 项目核心逻辑

### 1. 工作流程
```
用户输入 Cookie + Body
    ↓
jd.html 发送到 /api/generate-qr
    ↓
生成二维码（URL 中包含 base64url 编码的配置）
    ↓
微信扫码打开 execute.html
    ↓
解码配置，调用 /api/proxy-request
    ↓
后端代理请求京东 API
    ↓
返回结果给用户
```

### 2. 关键技术点

- **Base64URL 编码**: 将请求配置编码到二维码 URL 中
- **CORS 代理**: 后端代理请求避免跨域问题
- **h5st 签名**: 京东的加密签名，有效期 1-5 分钟
- **无状态设计**: 不需要数据库，配置全部在 URL 中

### 3. 已知问题

- ⏰ **h5st 签名过期**: 抓包后 1-5 分钟内必须使用
- 🔐 **Cookie 过期**: 需要重新登录京东获取
- 🌐 **网络限制**: 国内访问 Vercel 需要绑定域名

---

## 📞 联系方式

- **项目维护**: sky拖鞋 (GitHub: yubuybuy)
- **部署平台**: Vercel
- **域名**: qr.sswl.top

---

## 🎉 快速测试

克隆项目后，快速测试是否正常工作：

```powershell
# 1. 进入项目目录
cd qr-request-tool

# 2. 安装依赖
npm install

# 3. 启动服务
npm run dev

# 4. 打开浏览器
# 访问: http://localhost:3000/jd.html

# 5. 测试生成二维码
# 输入任意 Cookie 和 Body，点击生成
# 如果能看到二维码，说明前端正常
```

---

**最后更新**: 2025-10-16
**版本**: 1.0

祝开发顺利！🚀
