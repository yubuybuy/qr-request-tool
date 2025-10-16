@echo off
chcp 65001 >nul
echo ========================================
echo   创建 GitHub 仓库并推送
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 登录 GitHub...
gh auth status >nul 2>&1
if errorlevel 1 (
    echo 需要登录 GitHub，浏览器即将打开...
    gh auth login --web
)

echo.
echo [2/4] 创建 GitHub 仓库...
gh repo create qr-request-tool --public --source=. --remote=origin --description "QR code generator for JD coupon requests"

echo.
echo [3/4] 推送代码...
git push -u origin master

echo.
echo [4/4] 完成！
echo.
echo GitHub 仓库地址:
gh repo view --web
echo.
echo 现在可以部署到 Vercel：
echo 1. 访问 https://vercel.com/new
echo 2. Import 你的 GitHub 仓库
echo 3. 点击 Deploy
echo.
pause
