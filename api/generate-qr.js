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

// Vercel KV 存储（使用 Vercel KV 或简化版本）
// 由于免费版限制，这里使用临时存储方案
const requestStore = new Map();

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
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const executeUrl = `${protocol}://${host}/execute.html?data=${encodedConfig}`;

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
    console.error('请求体:', req.body);
    res.status(500).json({
      error: '生成二维码失败: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
