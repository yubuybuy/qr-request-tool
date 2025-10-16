const QRCode = require('qrcode');
const pako = require('pako');

// 简单的 UUID 生成函数（避免 ES Module 问题）
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 使用全局变量存储（Vercel 会在一定时间内保持热启动）
global.requestStore = global.requestStore || new Map();

module.exports = async (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

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

    // 获取当前域名
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const executeUrl = `${protocol}://${host}/execute.html?id=${requestId}`;

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
};
