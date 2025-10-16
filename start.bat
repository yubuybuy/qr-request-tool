@echo off
chcp 65001 >nul
echo ========================================
echo QR Request Tool - 启动服务
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js 未安装
    echo   请访问 https://nodejs.org/ 下载安装
    pause
    exit /b 1
)
echo ✓ Node.js 已安装
echo.

echo [2/2] 启动服务...
echo.
echo 服务将运行在 http://localhost:3000
echo 按 Ctrl+C 可以停止服务
echo.

npm start
