const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.PUBLIC_HOST || 'localhost'; // 公网地址或域名

// 存储请求配置的内存数据库（生产环境建议使用 Redis 或数据库）
const requestStore = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 接收 body 数据并生成二维码
app.post('/api/generate-qr', async (req, res) => {
  try {
    const { url, method = 'POST', headers = {}, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: '缺少目标 URL' });
    }

    // 生成唯一 ID
    const requestId = uuidv4();

    // 存储请求配置（24小时后自动删除）
    requestStore.set(requestId, {
      url,
      method,
      headers,
      body,
      createdAt: Date.now()
    });

    // 24小时后删除
    setTimeout(() => {
      requestStore.delete(requestId);
    }, 24 * 60 * 60 * 1000);

    // 生成二维码（包含执行页面的 URL）
    const executeUrl = `http://${HOST}:${PORT}/execute/${requestId}`;
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
    res.status(500).json({ error: '生成二维码失败' });
  }
});

// 获取请求配置
app.get('/api/request/:id', (req, res) => {
  const requestId = req.params.id;
  const config = requestStore.get(requestId);

  if (!config) {
    return res.status(404).json({ error: '请求配置不存在或已过期' });
  }

  res.json({
    success: true,
    config
  });
});

// 执行页面路由
app.get('/execute/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'execute.html'));
});

// 代理执行请求（解决跨域问题）
app.post('/api/proxy-request/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const config = requestStore.get(requestId);

    if (!config) {
      return res.status(404).json({ error: '请求配置不存在或已过期' });
    }

    // 准备请求体
    let requestBody;
    const contentType = config.headers['Content-Type'] || config.headers['content-type'] || '';

    if (config.body) {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        // URL 编码格式
        if (typeof config.body === 'string') {
          requestBody = config.body;
        } else {
          // 如果是对象，转换为 URL 编码字符串
          requestBody = new URLSearchParams(config.body).toString();
        }
      } else if (contentType.includes('application/json')) {
        // JSON 格式
        requestBody = typeof config.body === 'string'
          ? config.body
          : JSON.stringify(config.body);
      } else {
        // 其他格式，保持原样
        requestBody = typeof config.body === 'string'
          ? config.body
          : JSON.stringify(config.body);
      }
    }

    console.log('代理请求:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      bodyLength: requestBody ? requestBody.length : 0
    });

    // 使用 Node.js 的 fetch（需要 Node 18+）
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: requestBody
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    res.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
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

// 清理过期数据（每小时执行一次）
setInterval(() => {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  for (const [id, data] of requestStore.entries()) {
    if (now - data.createdAt > dayInMs) {
      requestStore.delete(id);
    }
  }
}, 60 * 60 * 1000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务运行在 http://${HOST}:${PORT}`);
  console.log(`局域网访问: http://${HOST}:${PORT}`);
  console.log(`本地访问: http://localhost:${PORT}`);
});
