module.exports = async (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: '缺少配置数据' });
    }

    // 解码配置
    const configJson = Buffer.from(data, 'base64url').toString('utf-8');
    const config = JSON.parse(configJson);

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
};
