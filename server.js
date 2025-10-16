const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');
const path = require('path');
const pako = require('pako');

// 简单的 UUID 生成函数（避免 ES Module 问题）
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.PUBLIC_HOST || 'localhost'; // 公网地址或域名

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 接收 body 数据并生成二维码（使用压缩）
app.post('/api/generate-qr', async (req, res) => {
  try {
    const { url, method = 'POST', headers = {}, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: '缺少目标 URL' });
    }

    // 生成唯一 ID
    const requestId = generateUUID();

    // 存储请求配置
    const config = {
      url,
      method,
      headers,
      body,
      createdAt: Date.now()
    };

    // 将配置 JSON 字符串化
    const jsonStr = JSON.stringify(config);

    // 使用 pako 压缩数据
    const compressed = pako.deflate(jsonStr);

    // 手动转换为 base64url 编码（兼容性更好）
    const base64 = Buffer.from(compressed).toString('base64');
    const encodedConfig = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // 获取当前域名
    const protocol = HOST === 'localhost' ? 'http' : 'https';
    const portStr = HOST === 'localhost' ? `:${PORT}` : '';
    const executeUrl = `${protocol}://${HOST}${portStr}/execute.html?data=${encodedConfig}`;

    console.log('原始数据长度:', jsonStr.length);
    console.log('压缩后长度:', compressed.length);
    console.log('base64url 长度:', encodedConfig.length);

    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(executeUrl, {
      width: 300,
      margin: 2
    });

    res.json({
      success: true,
      requestId,
      qrCode: qrCodeDataUrl,
      executeUrl
    });

  } catch (error) {
    console.error('生成二维码失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      error: '生成二维码失败: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


//代理执行请求（新版本 - 使用压缩数据）
app.post('/api/proxy-request', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: '缺少配置数据' });
    }

    // 解码 base64url 为二进制数据（手动处理兼容性更好）
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    // 添加 padding
    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const compressed = Buffer.from(paddedBase64, 'base64');

    // 使用 pako 解压
    const decompressed = pako.inflate(compressed, { to: 'string' });
    const config = JSON.parse(decompressed);

    // 准备请求体
    let requestBody;
    const contentType = config.headers['Content-Type'] || config.headers['content-type'] || '';

    if (config.body) {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        if (typeof config.body === 'string') {
          requestBody = config.body;
        } else {
          requestBody = new URLSearchParams(config.body).toString();
        }
      } else if (contentType.includes('application/json')) {
        requestBody = typeof config.body === 'string'
          ? config.body
          : JSON.stringify(config.body);
      } else {
        requestBody = typeof config.body === 'string'
          ? config.body
          : JSON.stringify(config.body);
      }
    }

    console.log('代理请求:', {
      url: config.url,
      method: config.method,
      bodyLength: requestBody ? requestBody.length : 0
    });

    // 发起请求
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: requestBody
    });

    const responseText = await response.text();
    let responseData;
    let isHTML = false;

    // 检查是否是 HTML 响应
    if (responseText.trim().toLowerCase().startsWith('<!doctype') ||
        responseText.trim().toLowerCase().startsWith('<html')) {
      isHTML = true;
      responseData = {
        error: '服务器返回了错误页面',
        hint: '可能原因：Cookie 过期、签名失效、请求被拦截',
        statusCode: response.status,
        preview: responseText.substring(0, 200) + '...'
      };
    } else {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = {
          rawText: responseText,
          hint: '响应不是 JSON 格式'
        };
      }
    }

    res.json({
      success: !isHTML && response.ok,
      status: response.status,
      statusText: response.statusText,
      isHTML: isHTML,
      data: responseData
    });

  } catch (error) {
    console.error('代理请求失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务运行在 http://${HOST}:${PORT}`);
  console.log(`局域网访问: http://${HOST}:${PORT}`);
  console.log(`本地访问: http://localhost:${PORT}`);
});
