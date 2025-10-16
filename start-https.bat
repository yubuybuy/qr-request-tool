@echo off
chcp 65001 >nul
echo ========================================
echo QR Request Tool - HTTPS 服务启动
echo ========================================
echo.

cd /d "%~dp0"

echo 检查 SSL 证书...
if not exist ssl\key.pem (
    echo ✗ SSL 证书不存在
    echo   请先运行: setup-https.bat
    pause
    exit /b 1
)
echo ✓ SSL 证书存在
echo.

echo 设置环境变量...
set PUBLIC_HOST=8.137.78.145
set HTTP_PORT=8080
set HTTPS_PORT=8443
echo ✓ HOST: %PUBLIC_HOST%
echo ✓ HTTP 端口: %HTTP_PORT%
echo ✓ HTTPS 端口: %HTTPS_PORT%
echo.

echo ========================================
echo 启动服务...
echo ========================================
echo.
echo HTTP:  http://%PUBLIC_HOST%:%HTTP_PORT%
echo HTTPS: https://%PUBLIC_HOST%:%HTTPS_PORT%
echo.
echo 按 Ctrl+C 可以停止服务
echo.

node server-https.js
