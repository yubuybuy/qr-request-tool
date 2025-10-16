# 京东领券二维码工具

一个简单的工具，可以将京东领券请求转换为二维码，微信扫码即可领券。

## ✨ 功能特点

- 🎯 简单易用：只需粘贴 Cookie 和 Body 数据
- 📱 微信扫码：生成二维码，微信扫码自动领券
- 🚀 无需服务器：部署在 Vercel，完全免费
- 🔒 安全可靠：数据加密存储在 URL 中
- 🌍 全球访问：自动 HTTPS，CDN 加速

## 🚀 在线使用

访问：[部署后的地址]

## 📖 使用方法

1. 在京东 App 或网页中抓取领券请求
2. 复制 Cookie 和 Body 数据
3. 粘贴到工具中，生成二维码
4. 微信扫码自动领券

## 🛠️ 技术栈

- Node.js + Vercel Serverless
- QRCode.js
- 原生 HTML/CSS/JavaScript

## 📦 本地开发

```bash
npm install
npm start
```

访问 http://localhost:3000

## 🌐 部署到 Vercel

```bash
npm install -g vercel
vercel
```

## 📝 许可证

MIT
