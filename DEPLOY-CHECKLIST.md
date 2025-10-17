# Windows Server 部署清单

## 📋 部署前准备

- [ ] Windows Server 2022 已安装
- [ ] 有管理员权限
- [ ] 域名 `qr.sswl.top` 已解析到服务器 IP
- [ ] 防火墙已开放 80 和 443 端口

---

## 🚀 快速部署（30分钟）

### 第 1 步：下载代码（5分钟）
```powershell
# 方法 A: 使用 Git（推荐）
cd C:\
git clone https://github.com/yubuybuy/qr-request-tool.git
cd qr-request-tool

# 方法 B: 直接下载 ZIP
# 访问 https://github.com/yubuybuy/qr-request-tool/archive/refs/heads/master.zip
# 解压到 C:\qr-request-tool
```

---

### 第 2 步：安装 Node.js（5分钟）
```powershell
# 访问 https://nodejs.org/ 下载 LTS 版本（v20.x）
# 双击安装，全部默认选项即可

# 验证安装
node --version
npm --version
```

---

### 第 3 步：一键部署脚本（10分钟）
```powershell
# 以管理员权限运行 PowerShell（右键 -> 以管理员身份运行）
cd C:\qr-request-tool

# 运行一键部署脚本
.\deploy-windows.ps1

# 按提示输入域名：qr.sswl.top
# 等待安装完成
```

脚本会自动：
- 安装 npm 依赖
- 安装 node-windows
- 创建并启动 Windows 服务
- 配置环境变量

---

### 第 4 步：配置 IIS（10分钟）

#### 4.1 安装 IIS
```powershell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

#### 4.2 下载并安装 IIS 模块
1. **URL Rewrite Module**
   - 访问：https://www.iis.net/downloads/microsoft/url-rewrite
   - 下载并安装

2. **Application Request Routing (ARR)**
   - 访问：https://www.iis.net/downloads/microsoft/application-request-routing
   - 下载并安装
   - 安装后，打开 IIS 管理器 → 服务器 → ARR → Server Proxy Settings
   - 勾选 "Enable proxy"

#### 4.3 创建 IIS 站点
```powershell
# 创建站点目录
mkdir C:\inetpub\qr-tool

# 复制配置文件
copy C:\qr-request-tool\web.config C:\inetpub\qr-tool\
```

**在 IIS 管理器中：**
1. 打开 IIS 管理器（运行 `inetmgr`）
2. 右键"网站" → "添加网站"
   - 网站名称：`QR Tool`
   - 物理路径：`C:\inetpub\qr-tool`
   - 绑定类型：`http`
   - 端口：`80`
   - 主机名：`qr.sswl.top`
3. 点击"确定"

---

### 第 5 步：配置 SSL 证书（可选，5分钟）

#### 使用 Win-ACME（Let's Encrypt 免费证书）
```powershell
# 下载 Win-ACME
# https://github.com/win-acme/win-acme/releases
# 解压到 C:\win-acme

cd C:\win-acme
.\wacs.exe

# 选择：
# N - 创建新证书
# 2 - 单个绑定 IIS 站点
# 选择 "QR Tool" 站点
# 输入邮箱
# 同意条款
```

证书会自动安装并每 60 天自动续期。

---

## ✅ 验证部署

### 检查 Windows 服务
```powershell
Get-Service "QR Request Tool"
# 状态应该是 Running
```

### 检查 Node.js 服务
```powershell
# 测试本地端口
curl http://localhost:3000

# 应该返回 HTML 页面
```

### 检查 IIS 反向代理
```powershell
# 测试域名（HTTP）
curl http://qr.sswl.top

# 测试域名（HTTPS，如果配置了 SSL）
curl https://qr.sswl.top
```

### 测试完整 API
```powershell
curl -X POST https://qr.sswl.top/api/generate-qr `
  -H "Content-Type: application/json" `
  -d '{"url":"https://api.m.jd.com/api","method":"POST","headers":{"Content-Type":"application/x-www-form-urlencoded"},"body":"test=123"}'

# 应该返回 JSON，包含 success: true 和二维码数据
```

---

## 📊 服务管理

### 启动服务
```powershell
Start-Service "QR Request Tool"
```

### 停止服务
```powershell
Stop-Service "QR Request Tool"
```

### 重启服务
```powershell
Restart-Service "QR Request Tool"
```

### 查看日志
```powershell
# 正常日志
Get-Content C:\qr-request-tool\daemon\qr-request-tool.out.log -Tail 50

# 错误日志
Get-Content C:\qr-request-tool\daemon\qr-request-tool.err.log -Tail 50
```

---

## 🔄 更新代码

```powershell
cd C:\qr-request-tool
git pull
npm install
Restart-Service "QR Request Tool"
```

---

## 🐛 常见问题

### 服务无法启动
```powershell
# 查看错误日志
Get-Content C:\qr-request-tool\daemon\qr-request-tool.err.log -Tail 100

# 检查端口占用
netstat -ano | findstr :3000

# 手动运行测试
cd C:\qr-request-tool
node server.js
```

### 域名无法访问
```powershell
# 检查 DNS
nslookup qr.sswl.top

# 检查防火墙
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
```

### IIS 502 错误
```powershell
# 确保 Node.js 服务运行
Get-Service "QR Request Tool"

# 确保 ARR 代理已启用
# IIS 管理器 → 服务器 → ARR → Server Proxy Settings
# 勾选 "Enable proxy"
```

---

## 📚 相关文档

- [详细部署指南](./WINDOWS-DEPLOY.md)
- [开发历史](./DEVELOPMENT-HISTORY.md)
- [错误指南](./ERROR-GUIDE.md)
- [项目设置指南](./SETUP-GUIDE.md)

---

## ✨ 部署完成

恭喜！你的 QR Request Tool 已成功部署到 Windows Server。

**访问地址：** https://qr.sswl.top

**技术支持：**
- GitHub Issues: https://github.com/yubuybuy/qr-request-tool/issues
