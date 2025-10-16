#!/bin/bash
# 云服务器部署脚本

# 如果是全新服务器，先安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或者使用 CentOS/RHEL
# curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
# sudo yum install -y nodejs

# 进入项目目录
cd /home/qr-request-tool

# 安装依赖
npm install

# 安装 PM2（进程管理工具，保持服务运行）
sudo npm install -g pm2

# 启动服务
pm2 start server.js --name qr-tool

# 设置开机自启
pm2 startup
pm2 save

# 查看运行状态
pm2 status

echo "================================"
echo "部署完成！"
echo "访问地址: http://你的公网IP:3000"
echo "京东专用: http://你的公网IP:3000/jd.html"
echo "================================"
