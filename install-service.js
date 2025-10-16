/**
 * Windows 服务安装脚本
 * 将 Node.js 应用注册为 Windows 服务
 *
 * 使用方法：
 * 1. 以管理员权限运行 PowerShell
 * 2. cd 到项目目录
 * 3. 运行: node install-service.js
 */

const Service = require('node-windows').Service;
const path = require('path');

// 创建服务对象
const svc = new Service({
  name: 'QR Request Tool',
  description: '京东优惠券二维码生成工具 - Node.js 后端服务',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--max_old_space_size=2048'
  ],
  env: [
    {
      name: 'PORT',
      value: '3000'
    },
    {
      name: 'PUBLIC_HOST',
      value: 'qr.sswl.top' // 修改为你的域名
    },
    {
      name: 'NODE_ENV',
      value: 'production'
    }
  ]
});

// 监听安装事件
svc.on('install', function() {
  console.log('✓ Windows 服务安装成功！');
  console.log('  服务名称: QR Request Tool');
  console.log('  服务已启动，开机自动运行');
  console.log('');
  console.log('管理命令:');
  console.log('  启动服务: Start-Service "QR Request Tool"');
  console.log('  停止服务: Stop-Service "QR Request Tool"');
  console.log('  重启服务: Restart-Service "QR Request Tool"');
  console.log('  查看状态: Get-Service "QR Request Tool"');
  console.log('');
  console.log('日志位置:');
  console.log('  ' + path.join(__dirname, 'daemon', 'qr-request-tool.out.log'));
  console.log('  ' + path.join(__dirname, 'daemon', 'qr-request-tool.err.log'));

  // 安装完成后自动启动服务
  svc.start();
});

svc.on('alreadyinstalled', function() {
  console.warn('⚠ 服务已存在！');
  console.log('如需重新安装，请先运行: node uninstall-service.js');
});

svc.on('error', function(err) {
  console.error('✗ 安装失败:', err.message);
  console.log('');
  console.log('可能的原因:');
  console.log('  1. 未使用管理员权限运行');
  console.log('  2. node-windows 未安装（运行: npm install -g node-windows）');
  console.log('  3. 服务已存在（先运行: node uninstall-service.js）');
});

// 开始安装
console.log('正在安装 Windows 服务...');
svc.install();
