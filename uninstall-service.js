/**
 * Windows 服务卸载脚本
 * 移除 Windows 服务
 *
 * 使用方法：
 * 1. 以管理员权限运行 PowerShell
 * 2. cd 到项目目录
 * 3. 运行: node uninstall-service.js
 */

const Service = require('node-windows').Service;
const path = require('path');

// 创建服务对象（需要与安装时相同的配置）
const svc = new Service({
  name: 'QR Request Tool',
  script: path.join(__dirname, 'server.js')
});

// 监听卸载事件
svc.on('uninstall', function() {
  console.log('✓ Windows 服务卸载成功！');
  console.log('  服务已停止并从系统中移除');
});

svc.on('error', function(err) {
  console.error('✗ 卸载失败:', err.message);
  console.log('');
  console.log('可能的原因:');
  console.log('  1. 未使用管理员权限运行');
  console.log('  2. 服务不存在');
  console.log('  3. 服务正在运行（先停止服务再卸载）');
});

// 开始卸载
console.log('正在卸载 Windows 服务...');
svc.uninstall();
