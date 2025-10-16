const pako = require('pako');

// 使用全局变量（与 generate-qr.js 共享）
global.requestStore = global.requestStore || new Map();

module.exports = async (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: '只支持 GET 请求' });
  }

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
};
