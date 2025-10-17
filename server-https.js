const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const QRCode = require('qrcode');
const cors = require('cors');
const path = require('path');
const pako = require('pako');

// 简单的 UUID 生成函数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const HOST = process.env.PUBLIC_HOST || 'localhost';

// 使用内存存储（云服务器单进程完美支持）
global.requestStore = global.requestStore || new Map();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 接收 body 数据并生成二维码（使用服务器存储）
app.post('/api/generate-qr', async (req, res) => {
  try {
    const { url, method = 'POST', headers = {}, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: '缺少目标 URL' });
    }

    // 生成唯一 ID
    const requestId = generateUUID();

    // 存储请求配置（使用压缩）
    const config = {
      url,
      method,
      headers,
      body,
      createdAt: Date.now()
    };

    const jsonStr = JSON.stringify(config);
    const compressed = pako.deflate(jsonStr);
    const base64 = Buffer.from(compressed).toString('base64');

    // 存储压缩后的数据
    global.requestStore.set(requestId, base64);

    // 10分钟后删除
    setTimeout(() => {
      global.requestStore.delete(requestId);
    }, 10 * 60 * 1000);

    // 获取当前域名（优先使用 HTTPS）
    const protocol = 'https';
    const portStr = HTTPS_PORT === 443 ? '' : `:${HTTPS_PORT}`;
    const executeUrl = `${protocol}://${HOST}${portStr}/execute.html?id=${requestId}`;

    console.log('原始数据长度:', jsonStr.length);
    console.log('压缩后长度:', compressed.length);
    console.log('存储 ID:', requestId);
    console.log('URL 长度:', executeUrl.length);

    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(executeUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M'
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

// 获取存储的配置
app.get('/api/get-config', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: '缺少 ID 参数' });
    }

    // 从存储中读取数据
    const base64Data = global.requestStore.get(id);

    if (!base64Data) {
      return res.status(404).json({ error: '配置不存在或已过期（10分钟有效期）' });
    }

    // 解压数据
    const compressed = Buffer.from(base64Data, 'base64');
    const decompressed = pako.inflate(compressed, { to: 'string' });
    const config = JSON.parse(decompressed);

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({
      error: '获取配置失败: ' + error.message
    });
  }
});

// 代理执行请求（接收 config 对象）
app.post('/api/proxy-request', async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: '缺少配置数据' });
    }

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

// 尝试读取 SSL 证书
let sslOptions = null;
const sslKeyPath = path.join(__dirname, 'ssl', 'key.pem');
const sslCertPath = path.join(__dirname, 'ssl', 'cert.pem');

try {
  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    sslOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
    console.log('✓ SSL 证书加载成功');
  }
} catch (error) {
  console.warn('⚠ SSL 证书加载失败，将只启动 HTTP 服务');
}

// 启动 HTTP 服务
http.createServer(app).listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`✓ HTTP 服务运行在 http://${HOST}:${HTTP_PORT}`);
});

// 如果有 SSL 证书，启动 HTTPS 服务
if (sslOptions) {
  https.createServer(sslOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`✓ HTTPS 服务运行在 https://${HOST}:${HTTPS_PORT}`);
    console.log(`✓ 二维码将使用 HTTPS 地址`);
  });
} else {
  console.log('');
  console.log('如需启用 HTTPS，请执行：');
  console.log('  mkdir ssl');
  console.log('  openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/CN=' + HOST + '"');
  console.log('');
}
