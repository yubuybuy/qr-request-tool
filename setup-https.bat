@echo off
chcp 65001 >nul
echo ========================================
echo QR Request Tool - HTTPS 快速配置
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 OpenSSL...
where openssl >nul 2>&1
if errorlevel 1 (
    echo ✗ OpenSSL 未安装
    echo.
    echo 请先安装 OpenSSL:
    echo 1. 访问: https://slproweb.com/products/Win32OpenSSL.html
    echo 2. 下载 "Win64 OpenSSL v3.x.x Light" 版本
    echo 3. 安装后重新运行此脚本
    echo.
    pause
    exit /b 1
)
echo ✓ OpenSSL 已安装
echo.

echo [2/3] 生成自签名 SSL 证书...
if not exist ssl mkdir ssl

openssl req -x509 -newkey rsa:2048 -keyout ssl\key.pem -out ssl\cert.pem -days 365 -nodes -subj "/CN=8.137.78.145"

if errorlevel 1 (
    echo ✗ 证书生成失败
    pause
    exit /b 1
)
echo ✓ SSL 证书生成成功
echo   证书位置: ssl\cert.pem
echo   私钥位置: ssl\key.pem
echo   有效期: 365 天
echo.

echo [3/3] 配置防火墙端口...
netsh advfirewall firewall show rule name="QR Tool HTTPS" >nul 2>&1
if errorlevel 1 (
    netsh advfirewall firewall add rule name="QR Tool HTTPS" dir=in action=allow protocol=TCP localport=8443
    echo ✓ 防火墙规则添加成功 ^(端口 8443^)
) else (
    echo ✓ 防火墙规则已存在
)
echo.

echo ========================================
echo 配置完成！
echo ========================================
echo.
echo 下一步操作:
echo 1. 去阿里云安全组开放 8443 端口
echo 2. 运行启动脚本: start-https.bat
echo.
echo 访问地址: https://8.137.78.145:8443
echo.
echo 注意: 首次访问会提示"不安全"，点击"高级" - "继续访问"即可
echo.
pause
