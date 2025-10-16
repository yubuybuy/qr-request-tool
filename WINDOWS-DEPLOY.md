# Windows Server 2022 部署指南

本文档详细说明如何在 Windows Server 2022 上部署 QR Request Tool。

## 目录
- [前置要求](#前置要求)
- [步骤 1: 安装 Node.js](#步骤-1-安装-nodejs)
- [步骤 2: 上传代码](#步骤-2-上传代码)
- [步骤 3: 安装依赖](#步骤-3-安装依赖)
- [步骤 4: 配置环境变量](#步骤-4-配置环境变量)
- [步骤 5: 创建 Windows 服务](#步骤-5-创建-windows-服务)
- [步骤 6: 配置 IIS 反向代理](#步骤-6-配置-iis-反向代理)
- [步骤 7: 配置 SSL 证书](#步骤-7-配置-ssl-证书)
- [测试](#测试)
- [日常维护](#日常维护)

---

## 前置要求

- Windows Server 2022
- 管理员权限
- 域名已解析到服务器 IP（如 qr.sswl.top）
- 防火墙开放 80 和 443 端口

---

## 步骤 1: 安装 Node.js

### 1.1 下载 Node.js
访问 https://nodejs.org/ 下载 LTS 版本（推荐 v20.x 或更高）

### 1.2 安装
```powershell
# 使用管理员权限打开 PowerShell
# 双击下载的 .msi 文件进行安装
# 勾选 "Automatically install necessary tools" 选项
```

### 1.3 验证安装
```powershell
node --version
npm --version
```

---

## 步骤 2: 上传代码

### 方法 A: 使用 Git（推荐）
```powershell
# 在服务器上安装 Git
# 下载：https://git-scm.com/download/win

# 克隆仓库
cd C:\
git clone https://github.com/yubuybuy/qr-request-tool.git
cd qr-request-tool
```

### 方法 B: 使用远程桌面复制
```powershell
# 通过远程桌面连接，直接复制文件夹到服务器
# 推荐路径：C:\qr-request-tool
```

---

## 步骤 3: 安装依赖

```powershell
cd C:\qr-request-tool
npm install
```

---

## 步骤 4: 配置环境变量

### 4.1 创建配置文件
在项目根目录创建 `.env` 文件：

```env
PORT=3000
PUBLIC_HOST=qr.sswl.top
NODE_ENV=production
```

### 4.2 测试运行
```powershell
node server.js
```

访问 `http://localhost:3000` 确认服务正常。

按 `Ctrl+C` 停止服务。

---

## 步骤 5: 创建 Windows 服务

我们使用 `node-windows` 将 Node.js 应用注册为 Windows 服务。

### 5.1 安装 node-windows
```powershell
npm install -g node-windows
npm link node-windows
```

### 5.2 创建服务脚本
项目已包含 `install-service.js` 文件，直接运行：

```powershell
# 以管理员权限运行 PowerShell
node install-service.js
```

### 5.3 验证服务
```powershell
# 查看服务状态
Get-Service "QR Request Tool"

# 或使用 services.msc 图形界面查看
```

服务会自动启动，并在系统重启后自动运行。

### 5.4 服务管理命令
```powershell
# 启动服务
Start-Service "QR Request Tool"

# 停止服务
Stop-Service "QR Request Tool"

# 重启服务
Restart-Service "QR Request Tool"

# 卸载服务（如果需要）
node uninstall-service.js
```

---

## 步骤 6: 配置 IIS 反向代理

### 6.1 安装 IIS
```powershell
# 以管理员权限运行 PowerShell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

### 6.2 安装 URL Rewrite 和 ARR 模块

**下载并安装：**
1. **URL Rewrite Module**
   - 下载：https://www.iis.net/downloads/microsoft/url-rewrite
   - 或使用 Web Platform Installer

2. **Application Request Routing (ARR)**
   - 下载：https://www.iis.net/downloads/microsoft/application-request-routing
   - 安装后，打开 IIS 管理器 → 服务器节点 → Application Request Routing Cache → Server Proxy Settings
   - 勾选 "Enable proxy"

### 6.3 配置 IIS 站点

#### 方法 A: 使用提供的配置文件（推荐）

项目已包含 `web.config` 文件，将其复制到 IIS 站点根目录。

```powershell
# 创建 IIS 站点根目录
mkdir C:\inetpub\qr-tool

# 复制 web.config
copy C:\qr-request-tool\web.config C:\inetpub\qr-tool\
```

#### 方法 B: 手动配置

1. 打开 IIS 管理器 (`inetmgr`)
2. 右键"网站" → "添加网站"
   - 网站名称：`QR Tool`
   - 物理路径：`C:\inetpub\qr-tool`
   - 绑定类型：`http`
   - 端口：`80`
   - 主机名：`qr.sswl.top`

3. 选择新建的站点 → 双击 "URL 重写"
4. 点击右侧 "添加规则" → "反向代理"
5. 输入：`localhost:3000`
6. 确定

### 6.4 验证反向代理
```powershell
# 访问域名（需要先配置 hosts 或 DNS）
curl http://qr.sswl.top
```

---

## 步骤 7: 配置 SSL 证书

### 方法 A: 使用 Let's Encrypt（推荐，免费）

#### 7.1 安装 Win-ACME
```powershell
# 下载 Win-ACME
# https://github.com/win-acme/win-acme/releases

# 解压到 C:\win-acme
cd C:\win-acme
```

#### 7.2 运行证书申请
```powershell
# 以管理员权限运行
.\wacs.exe

# 选项：
# N - 创建新证书
# 2 - 单个绑定 IIS 站点
# 选择你的站点（QR Tool）
# 输入邮箱地址
# 同意条款
```

证书会自动安装并配置 IIS 绑定，且每 60 天自动续期。

### 方法 B: 使用自有证书

1. 打开 IIS 管理器
2. 选择服务器节点 → "服务器证书"
3. 右侧 "导入" → 选择 `.pfx` 文件
4. 回到站点 → "绑定" → "添加"
   - 类型：`https`
   - 端口：`443`
   - 主机名：`qr.sswl.top`
   - SSL 证书：选择刚导入的证书

---

## 测试

### 测试 HTTP
```powershell
curl http://qr.sswl.top
```

### 测试 HTTPS
```powershell
curl https://qr.sswl.top
```

### 测试 API
```powershell
curl -X POST https://qr.sswl.top/api/generate-qr -H "Content-Type: application/json" -d '{"url":"https://api.m.jd.com/api","method":"POST","headers":{"Content-Type":"application/x-www-form-urlencoded"},"body":"test=123"}'
```

---

## 日常维护

### 查看服务日志
```powershell
# 日志位置
Get-Content "C:\qr-request-tool\daemon\qr-request-tool.out.log" -Tail 50
Get-Content "C:\qr-request-tool\daemon\qr-request-tool.err.log" -Tail 50
```

### 更新代码
```powershell
cd C:\qr-request-tool
git pull
npm install
Restart-Service "QR Request Tool"
```

### 备份数据
```powershell
# 虽然使用内存存储，但建议定期备份代码
Copy-Item C:\qr-request-tool C:\backups\qr-tool-$(Get-Date -Format "yyyyMMdd") -Recurse
```

### 监控服务状态
```powershell
# 检查服务是否运行
Get-Service "QR Request Tool" | Select-Object Name,Status,StartType

# 检查 Node.js 进程
Get-Process node

# 检查端口占用
netstat -ano | findstr :3000
```

---

## 故障排查

### 服务无法启动
```powershell
# 查看错误日志
Get-Content "C:\qr-request-tool\daemon\qr-request-tool.err.log" -Tail 100

# 检查端口是否被占用
netstat -ano | findstr :3000

# 手动运行测试
cd C:\qr-request-tool
node server.js
```

### 域名无法访问
```powershell
# 检查 DNS 解析
nslookup qr.sswl.top

# 检查防火墙
netsh advfirewall firewall show rule name=all | findstr 80
netsh advfirewall firewall show rule name=all | findstr 443

# 开放端口（如果需要）
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
```

### IIS 反向代理 502 错误
```powershell
# 检查 Node.js 服务是否运行
Get-Service "QR Request Tool"

# 检查 ARR 代理是否启用
# IIS 管理器 → 服务器 → Application Request Routing Cache → Server Proxy Settings
# 确保 "Enable proxy" 已勾选

# 检查 Node.js 是否监听正确端口
netstat -ano | findstr :3000
```

---

## 性能优化

### 1. 启用 IIS 输出缓存
在 `web.config` 中已配置静态文件缓存。

### 2. 配置 Node.js 集群（可选）
如果流量较大，可以使用 PM2 cluster 模式（需要修改服务脚本）。

### 3. 监控内存使用
```powershell
# 查看 Node.js 进程内存
Get-Process node | Select-Object ProcessName,@{Name="Memory(MB)";Expression={[math]::Round($_.WS/1MB,2)}}
```

---

## 安全建议

1. **定期更新 Node.js** 到最新 LTS 版本
2. **使用强密码** 保护服务器
3. **配置防火墙** 只开放必要端口
4. **启用 Windows 更新** 保持系统安全
5. **定期备份** 代码和配置文件
6. **监控日志** 及时发现异常访问

---

## 联系支持

如遇到问题，请查看：
- [GitHub Issues](https://github.com/yubuybuy/qr-request-tool/issues)
- [开发文档](./DEVELOPMENT-HISTORY.md)
- [错误指南](./ERROR-GUIDE.md)
