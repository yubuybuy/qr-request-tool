# Windows Server 快速部署脚本
# 以管理员权限运行此脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "QR Request Tool - Windows Server 部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "✗ 错误: 请以管理员权限运行此脚本" -ForegroundColor Red
    Write-Host "  右键点击 PowerShell -> 以管理员身份运行" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✓ 管理员权限检查通过" -ForegroundColor Green
Write-Host ""

# 获取项目路径
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "项目路径: $projectPath" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js 未安装" -ForegroundColor Red
    Write-Host "  请访问 https://nodejs.org/ 下载安装" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host ""

# 安装依赖
Write-Host "安装 npm 依赖..." -ForegroundColor Yellow
Set-Location $projectPath
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install 失败" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✓ 依赖安装完成" -ForegroundColor Green
Write-Host ""

# 安装 node-windows
Write-Host "安装 node-windows..." -ForegroundColor Yellow
npm install -g node-windows
npm link node-windows
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ node-windows 安装可能失败，但继续执行..." -ForegroundColor Yellow
}
Write-Host ""

# 询问域名
Write-Host "请输入你的域名（如 qr.sswl.top）:" -ForegroundColor Cyan
$domain = Read-Host
if ([string]::IsNullOrWhiteSpace($domain)) {
    Write-Host "✗ 域名不能为空" -ForegroundColor Red
    pause
    exit 1
}

# 更新 install-service.js 中的域名
Write-Host "更新服务配置..." -ForegroundColor Yellow
$serviceScript = Get-Content "$projectPath\install-service.js" -Raw
$serviceScript = $serviceScript -replace "value: 'qr\.sswl\.top'", "value: '$domain'"
Set-Content "$projectPath\install-service.js" -Value $serviceScript
Write-Host "✓ 域名配置更新: $domain" -ForegroundColor Green
Write-Host ""

# 安装 Windows 服务
Write-Host "安装 Windows 服务..." -ForegroundColor Yellow
node "$projectPath\install-service.js"
Start-Sleep -Seconds 3
Write-Host ""

# 检查服务状态
Write-Host "检查服务状态..." -ForegroundColor Yellow
$service = Get-Service "QR Request Tool" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "✓ 服务状态: $($service.Status)" -ForegroundColor Green
    if ($service.Status -ne "Running") {
        Write-Host "  正在启动服务..." -ForegroundColor Yellow
        Start-Service "QR Request Tool"
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "⚠ 服务未找到，可能安装失败" -ForegroundColor Yellow
}
Write-Host ""

# 测试 Node.js 服务
Write-Host "测试 Node.js 服务..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Node.js 服务运行正常" -ForegroundColor Green
} catch {
    Write-Host "⚠ Node.js 服务可能未启动" -ForegroundColor Yellow
    Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# IIS 配置提示
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "下一步：配置 IIS 反向代理" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 安装 IIS:" -ForegroundColor Yellow
Write-Host "   Install-WindowsFeature -name Web-Server -IncludeManagementTools"
Write-Host ""
Write-Host "2. 下载并安装 IIS 模块:" -ForegroundColor Yellow
Write-Host "   - URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite"
Write-Host "   - ARR: https://www.iis.net/downloads/microsoft/application-request-routing"
Write-Host ""
Write-Host "3. 创建 IIS 站点:" -ForegroundColor Yellow
Write-Host "   - 物理路径: C:\inetpub\qr-tool"
Write-Host "   - 绑定: http, 端口 80, 主机名 $domain"
Write-Host "   - 复制 web.config 到站点目录"
Write-Host ""
Write-Host "4. 配置 SSL 证书（使用 Win-ACME）:" -ForegroundColor Yellow
Write-Host "   - 下载: https://github.com/win-acme/win-acme/releases"
Write-Host "   - 运行: wacs.exe"
Write-Host ""
Write-Host "详细步骤请参考: WINDOWS-DEPLOY.md" -ForegroundColor Cyan
Write-Host ""

# 日志路径
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "服务信息" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "服务名称: QR Request Tool" -ForegroundColor White
Write-Host "监听端口: 3000" -ForegroundColor White
Write-Host "域名: $domain" -ForegroundColor White
Write-Host "日志路径: $projectPath\daemon\" -ForegroundColor White
Write-Host ""
Write-Host "管理命令:" -ForegroundColor Yellow
Write-Host "  启动: Start-Service 'QR Request Tool'"
Write-Host "  停止: Stop-Service 'QR Request Tool'"
Write-Host "  重启: Restart-Service 'QR Request Tool'"
Write-Host "  状态: Get-Service 'QR Request Tool'"
Write-Host ""

Write-Host "✓ 部署完成！" -ForegroundColor Green
Write-Host ""
pause
