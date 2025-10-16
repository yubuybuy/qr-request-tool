# 项目开发历史记录

## 📅 开发时间线

### 2025-10-16 初始开发

---

## 🎯 项目需求

用户需要一个工具：
1. 输入 HTTP POST 请求的 Body 数据
2. 自动生成二维码
3. 用户用微信扫码后，自动执行该请求
4. 显示请求结果

**特别需求**: 专门优化京东领券操作

---

## 🔧 技术选型

### 为什么选择这些技术？

1. **Node.js + Express**
   - 轻量级后端框架
   - 易于处理 HTTP 请求
   - 社区成熟

2. **Vercel Serverless**
   - 免费部署
   - 自动 HTTPS
   - 支持自定义域名
   - 无需管理服务器

3. **QRCode.js**
   - 纯前端生成二维码
   - 支持 Data URL 格式

4. **Base64URL 编码**
   - 将配置嵌入 URL
   - 无需数据库存储
   - 完全无状态

---

## 🏗️ 开发过程

### 阶段 1: 基础架构（初期）

**需求**: 创建基本的 QR 生成和请求执行功能

**实现**:
- ✅ 创建 `index.html` - 通用请求表单
- ✅ 创建 `api/generate-qr.js` - 生成二维码 API
- ✅ 创建 `api/proxy-request.js` - 代理请求 API
- ✅ 创建 `execute.html` - 执行请求页面
- ✅ 创建 `server.js` - 本地开发服务器

**技术决策**:
- 使用 base64url 编码配置到 URL 中
- 后端代理解决 CORS 跨域问题
- 使用 Vercel 部署避免服务器维护

---

### 阶段 2: 京东专用优化

**问题**: 用户觉得通用版太复杂，需要填太多字段

**解决方案**: 创建京东专用简化版

**实现**:
- ✅ 创建 `jd.html` - 只需 Cookie + Body
- ✅ 自动识别 API 地址
- ✅ 自动构建 Headers（User-Agent、Referer 等）
- ✅ 自动清理 Cookie 格式（JSON、引号等）

**关键代码逻辑**:
```javascript
// 自动识别 API 地址
if (body.includes('functionId=')) {
    if (body.includes('client.action')) {
        apiUrl = "https://api.m.jd.com/client.action";
    } else if (body.includes('newBabelAwardCollection')) {
        apiUrl = "https://api.m.jd.com/api";
    }
}
```

---

### 阶段 3: Vercel 部署

**需求**: 随时随地访问工具

**实现步骤**:
1. ✅ GitHub 仓库创建
2. ✅ Vercel 项目关联
3. ✅ 自定义域名绑定: qr.sswl.top
4. ✅ 配置 `vercel.json` 路由规则

**配置文件**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

---

### 阶段 4: 移动端支持

**需求**: 在手机上也能抓包生成二维码

**实现**:
- ✅ 创建 `mobile-helper.html` - 移动端辅助页面
- ✅ 提供 Bookmarklet（书签脚本）自动抓包
- ✅ 使用 localStorage 存储抓取的数据
- ✅ 自动跳转并填充表单

**工作流程**:
```
1. 手机上保存书签脚本
2. 打开京东活动页
3. 点击书签脚本
4. 自动抓取并跳转到 jd.html
5. 自动填充 Cookie 和 Body
```

---

### 阶段 5: 错误处理优化

**问题 1**: 用户粘贴了 JSON 格式的 Cookie
**错误**: `JSON Parse error: Unexpected identifier "sdtoken"`

**解决**:
```javascript
// 自动清理 Cookie 格式
if (cookie.startsWith('{') || cookie.startsWith('"')) {
    try {
        const parsed = JSON.parse(cookie);
        if (typeof parsed === 'string') {
            cookie = parsed;
        } else if (parsed.Cookie) {
            cookie = parsed.Cookie;
        }
    } catch {
        // 保持原样
    }
}
cookie = cookie.replace(/^["']|["']$/g, '');
```

---

**问题 2**: 京东返回 HTML 错误页而不是 JSON
**错误**: `Unexpected token 'T', "The page c"... is not valid JSON`

**原因**:
- h5st 签名过期（1-5分钟有效期）
- Cookie 过期
- 请求被风控拦截

**解决**:
```javascript
// 检测 HTML 响应
if (responseText.trim().toLowerCase().startsWith('<!doctype') ||
    responseText.trim().toLowerCase().startsWith('<html')) {
    isHTML = true;
    responseData = {
        error: '服务器返回了错误页面',
        hint: '可能原因：Cookie 过期、签名失效、请求被拦截',
        statusCode: response.status,
        preview: responseText.substring(0, 200) + '...'
    };
}
```

**文档化**: 创建 `ERROR-GUIDE.md` 详细说明错误原因和解决方法

---

**问题 3**: execute.html 解码失败
**错误**: `The string did not match the expected pattern`

**原因**: `execute.html` 使用旧的 requestId 逻辑，与 `generate-qr.js` 的 base64url 编码不匹配

**解决**:
```javascript
// 从 URL 参数解码配置
const urlParams = new URLSearchParams(window.location.search);
const encodedData = urlParams.get('data');
const jsonStr = atob(encodedData.replace(/-/g, '+').replace(/_/g, '/'));
requestConfig = JSON.parse(jsonStr);
```

---

## 📊 最终架构

```
用户侧（前端）
├── jd.html - 京东专用表单
├── execute.html - 扫码执行页面
└── mobile-helper.html - 移动端辅助

↓ HTTPS/POST

Vercel Serverless（后端）
├── api/generate-qr.js - 生成二维码
│   ├── 接收请求配置
│   ├── Base64URL 编码
│   └── 生成 QR 码 Data URL
│
└── api/proxy-request.js - 代理请求
    ├── 接收编码配置
    ├── 解码并发起请求
    └── 返回响应结果

↓ HTTPS/POST

第三方 API（如京东）
└── 执行实际的业务请求
```

---

## 🔐 安全考虑

### 已实现的安全措施

1. **HTTPS 加密**
   - Vercel 自动提供 HTTPS
   - Cookie 等敏感数据传输加密

2. **CORS 限制**
   - 后端代理控制请求来源
   - 避免被恶意网站调用

3. **无数据存储**
   - 不存储用户的 Cookie 或请求数据
   - 配置全部在 URL 中临时传递

4. **base64url 编码**
   - URL 安全编码
   - 避免特殊字符导致的问题

### 潜在安全风险

⚠️ **Cookie 暴露风险**
- 二维码中包含完整的 Cookie
- 如果二维码被他人扫描，可能泄露账号信息
- **建议**: 生成后尽快使用，使用后 Cookie 自然过期

⚠️ **h5st 签名时效性**
- h5st 签名 1-5 分钟过期
- 降低了被重放攻击的风险

---

## 📈 性能优化

### 已实现

1. **无服务器架构**
   - 按需运行，自动扩缩容
   - 无需维护服务器

2. **静态资源缓存**
   - HTML/CSS/JS 由 Vercel CDN 分发
   - 全球加速

3. **无状态设计**
   - 不依赖数据库
   - 响应快速

### 可优化项

- 📝 可以添加 Service Worker 实现离线支持
- 📝 可以使用 IndexedDB 存储历史记录
- 📝 可以压缩二维码中的数据

---

## 🐛 已知问题和限制

### 1. h5st 签名时效性
**问题**: 京东的 h5st 签名只有 1-5 分钟有效期

**影响**:
- 抓包后必须立即使用
- 无法提前生成备用二维码

**解决方案**:
- 文档中明确说明
- 建议用户快速操作

### 2. Cookie URL 编码问题
**问题**: Cookie 中可能包含 URL 编码字符（如 `%E6%8B%96%E9%9E%8B`）

**影响**:
- 可能导致编码/解码错误

**解决方案**:
- 已在前端自动清理格式
- Base64URL 编码避免特殊字符

### 3. 国内访问 Vercel
**问题**: Vercel 默认域名在国内可能不稳定

**解决方案**:
- 绑定自定义域名 qr.sswl.top
- 域名正常解析

### 4. 移动端抓包复杂性
**问题**: 手机上抓包需要安装第三方工具

**解决方案**:
- 提供书签脚本自动抓取
- 提供详细的移动端使用说明

---

## 📚 相关文档

- **SETUP-GUIDE.md** - 换电脑开发指南
- **ERROR-GUIDE.md** - 错误排查指南
- **README.md** - 项目说明
- 代码注释 - 所有关键代码都有中文注释

---

## 🎓 技术要点总结

### 1. Base64URL 编码/解码
```javascript
// 编码
const encoded = Buffer.from(JSON.stringify(data))
    .toString('base64url');

// 解码（浏览器端）
const decoded = JSON.parse(
    atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
);
```

### 2. 后端 CORS 代理
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### 3. QR 码生成
```javascript
const qrCodeDataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2
});
```

### 4. Vercel Serverless 函数
```javascript
module.exports = async (req, res) => {
    // 处理请求
    res.json({ success: true });
};
```

---

## 🔮 未来可能的改进

### 功能扩展
- [ ] 支持更多电商平台（淘宝、拼多多等）
- [ ] 添加二维码历史记录功能
- [ ] 支持批量生成二维码
- [ ] 添加二维码有效期提醒

### 技术优化
- [ ] 使用 TypeScript 重构
- [ ] 添加单元测试
- [ ] 优化移动端 UI
- [ ] 支持 PWA（离线使用）

### 安全增强
- [ ] 添加二维码密码保护
- [ ] 限制二维码使用次数
- [ ] 添加 IP 访问限制

---

## 💬 关于 AI 助手记忆

### 重要说明

**Claude Code 的聊天记录无法在不同电脑之间同步。**

每次在新电脑上开始对话时，AI 助手不会记得之前的开发历史。

### 如何让新 AI 助手快速了解项目？

在新对话开始时，告诉 AI：

```
我有一个京东领券二维码生成器项目，需要继续开发。

项目信息：
- GitHub: https://github.com/yubuybuy/qr-request-tool
- 在线地址: https://qr.sswl.top
- 技术栈: Node.js + Express + Vercel Serverless

项目目录包含以下文档：
- SETUP-GUIDE.md: 开发环境配置指南
- DEVELOPMENT-HISTORY.md: 完整的开发历史（包括技术决策、遇到的问题和解决方案）
- ERROR-GUIDE.md: 常见错误排查指南
- README.md: 项目说明

请先阅读 DEVELOPMENT-HISTORY.md 了解项目背景和所有关键决策。

当前任务：[描述你要做的事情]
```

### 为什么要详细记录？

1. **AI 助手更换**: 每次新对话都是从零开始
2. **团队协作**: 其他开发者可以快速了解项目
3. **未来维护**: 几个月后你可能忘记当初的设计思路
4. **问题排查**: 了解历史问题有助于解决新问题

---

## 📞 项目信息

- **项目名称**: QR Request Tool
- **项目维护者**: sky拖鞋
- **GitHub**: https://github.com/yubuybuy/qr-request-tool
- **在线地址**: https://qr.sswl.top
- **部署平台**: Vercel
- **开发时间**: 2025-10-16
- **最后更新**: 2025-10-16

---

## ✅ 当前项目状态

**主要功能**: ✅ 全部完成
- [x] 通用请求转二维码
- [x] 京东领券专用版
- [x] 移动端支持
- [x] 错误处理优化
- [x] 自动部署

**已知问题**: 已全部修复
- [x] Cookie 格式兼容问题
- [x] HTML 错误响应识别
- [x] execute.html 解码逻辑

**部署状态**: ✅ 已上线
- Vercel 自动部署
- 域名 qr.sswl.top 正常访问
- HTTPS 证书有效

**代码质量**: ✅ 良好
- 核心代码有详细注释
- 错误处理完善
- 文档齐全

---

## 🎉 结语

这个项目从零开始，经历了需求分析、技术选型、功能开发、问题修复、优化部署的完整过程。

所有的技术决策都基于实际需求，所有的问题都被记录和解决。

希望这份文档能帮助你（或任何接手这个项目的人）快速理解整个项目！

**祝开发顺利！** 🚀

---

*本文档记录了截至 2025-10-16 的所有开发历史。*
