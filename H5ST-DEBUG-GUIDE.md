# h5st 签名机制调试指南

## 🎯 目标

快速验证京东 h5st 签名生成机制，为后续集成到工具中做准备。

---

## 📋 准备工作

### 需要的工具
- ✅ Chrome 或 Edge 浏览器（推荐）
- ✅ 一个京东活动页面（有"领券"按钮的）
- ✅ 我们提供的调试脚本

### 调试页面地址
- 本地: http://localhost:3000/h5st-debugger.html
- 线上: https://qr.sswl.top/h5st-debugger.html

---

## 🚀 快速开始（3 分钟）

### 步骤 1: 打开京东活动页面

在新标签页打开任意京东优惠券活动页面，例如：
```
https://h5static.m.jd.com/mall/active/xxx/index.html
```

> 💡 提示：可以先用我们之前抓包的活动页面

---

### 步骤 2: 打开开发者工具

按 `F12` 键，切换到 **Console（控制台）** 标签

---

### 步骤 3: 运行调试脚本

#### 方式 A：访问调试页面复制脚本
1. 打开 http://localhost:3000/h5st-debugger.html
2. 点击"方法 A"下的"复制"按钮
3. 回到京东页面的控制台粘贴并回车

#### 方式 B：使用书签（Bookmarklet）
稍后会提供一键调试的书签

---

### 步骤 4: 观察输出

脚本会自动搜索并输出：

```
🔍 开始搜索 h5st 生成函数...

📌 步骤 1: 搜索全局函数...
  ✓ 找到可能的函数: getH5st

📌 步骤 2: 检查 localStorage...
  ✓ 找到相关数据: h5st_token

📌 步骤 3: 检查 cookies...
  ✓ 找到相关 Cookie: shshshfp

📌 步骤 4: 监听下一个网络请求...
  💡 提示: 请在页面上点击"领取"按钮
```

---

### 步骤 5: 点击"领取"按钮

在京东页面上点击"领取优惠券"按钮，脚本会自动捕获 h5st 签名：

```
📤 请求 #1 [Fetch]
URL: https://api.m.jd.com/api?functionId=newBabelAwardCollection

🎉 找到 h5st 签名！
完整签名: 20251016160158044;36mwzzm9mh6qdqq7;35fa0;tk03w...

结构分析:
  时间戳: 20251016160158044
  版本号: 36mwzzm9mh6qdqq7  ← 关键信息！
  appId: 35fa0
  签名数据: tk03w6dc41ada18n...
```

---

## 🔍 深度调试（如果自动脚本没找到）

### 方法 1: 手动搜索源码

1. 打开开发者工具的 **Sources** 标签
2. 按 `Ctrl+Shift+F` 打开全局搜索
3. 搜索关键字：`h5st`
4. 查看搜索结果，找到包含生成逻辑的 JS 文件
5. 设置断点，调试查看参数

### 方法 2: Network 抓包分析

1. 切换到 **Network** 标签
2. 勾选 "Preserve log"（保留日志）
3. 点击页面上的"领取"按钮
4. 找到包含 `h5st` 参数的请求
5. 查看请求的 Initiator（发起者）追踪调用栈

### 方法 3: 设置 XHR 断点

1. 在 **Sources** 标签右侧
2. 展开 "XHR/fetch Breakpoints"
3. 添加断点: `api.m.jd.com`
4. 点击页面上的"领取"按钮
5. 代码会在发送请求前暂停，可以查看调用栈

---

## 📊 期望的结果

### ✅ 成功情况

如果调试成功，你应该能获得：

1. **h5st 版本号**
   ```
   36mwzzm9mh6qdqq7
   ```

2. **生成函数的位置**
   ```javascript
   window.getH5st
   // 或
   window.JDH5ST.sign
   // 或其他变量名
   ```

3. **函数需要的参数**
   ```javascript
   {
       appId: '35fa0',
       functionId: 'newBabelAwardCollection',
       body: {...},
       timestamp: 1760601714044,
       // 可能还有其他参数
   }
   ```

4. **返回值格式**
   ```
   20251016160158044;36mwzzm9mh6qdqq7;35fa0;tk03w6dc...
   ```

### ❌ 失败情况

如果没找到生成函数，可能的原因：

1. **函数被深度混淆**
   - 函数名被替换成 `_0xabcd` 这样的乱码
   - 需要在 Network 中追踪调用链

2. **使用了 WebAssembly**
   - h5st 可能由 WASM 生成
   - 更难逆向，但仍可能通过 JS 调用

3. **动态加载**
   - 生成函数可能在点击时才加载
   - 需要先触发点击，再查找

---

## 🎯 找到函数后的测试

### 测试脚本

```javascript
// 假设找到的函数是 window.getH5st

// 测试调用
const testResult = window.getH5st({
    appId: '35fa0',
    functionId: 'newBabelAwardCollection',
    body: JSON.stringify({
        activityId: '2v9TSJ6S56BkdN6XUwweiJnUsLLL'
    }),
    timestamp: Date.now()
});

console.log('生成的 h5st:', testResult);

// 验证格式
if (testResult && testResult.includes(';')) {
    console.log('✅ 格式正确！');

    const parts = testResult.split(';');
    console.log('时间戳:', parts[0]);
    console.log('版本号:', parts[1]);
    console.log('appId:', parts[2]);
    console.log('签名:', parts[3]);
} else {
    console.log('❌ 格式不正确，可能参数有误');
}
```

---

## 📝 记录模板

找到生成函数后，请记录以下信息：

```markdown
## h5st 调试结果

### 基本信息
- 活动页面: https://h5static.m.jd.com/mall/active/xxx/index.html
- 调试时间: 2025-10-16 16:00
- h5st 版本号: 36mwzzm9mh6qdqq7

### 生成函数
- 函数名: window.getH5st
- 函数位置: https://xxx.jd.com/xxx.js 第 1234 行

### 函数参数
```javascript
{
    appId: '35fa0',
    functionId: 'newBabelAwardCollection',
    body: '{"activityId":"..."}',
    timestamp: 1760601714044,
    // 其他参数...
}
```

### 返回值示例
```
20251016160158044;36mwzzm9mh6qdqq7;35fa0;tk03w6dc41ada18n...
```

### 依赖项
- 需要 Cookie: pt_key, pt_pin
- 需要 localStorage: h5st_token, fp
- 需要其他: shshshfp, shshshfpa, shshshfpb

### 函数代码（如果可以提取）
```javascript
// 粘贴提取的函数代码
```

---

## 🚀 下一步计划

找到生成函数后，我们可以：

### 阶段 1: 验证可行性 ✅
- [x] 调试脚本
- [ ] 找到生成函数
- [ ] 成功调用函数
- [ ] 验证返回值有效

### 阶段 2: 提取集成
- [ ] 提取函数代码
- [ ] 在 Node.js 环境重现
- [ ] 集成到我们的工具

### 阶段 3: 优化部署
- [ ] 实时生成 h5st
- [ ] 解决时效性问题
- [ ] 更新二维码工具

---

## ❓ 常见问题

### Q: 运行脚本后控制台没反应？
A: 确保：
1. 在京东页面运行，不是在调试工具页面
2. 控制台没有错误提示
3. 脚本完整复制，没有遗漏

### Q: 提示"找不到函数"？
A: 正常情况，京东函数名被混淆了。尝试：
1. 使用方法 B（监听点击）
2. 在 Network 中查看实际请求
3. 在 Sources 中手动搜索

### Q: 找到了但调用报错？
A: 可能原因：
1. 参数格式不对
2. 缺少必要的 Cookie/localStorage
3. 需要在特定环境中执行

### Q: 生成的 h5st 能用多久？
A: 通常 1-5 分钟，取决于京东的设置

---

## 📚 参考资料

### h5st 结构分析
```
h5st=20251016160158044;36mwzzm9mh6qdqq7;35fa0;tk03w6dc41ada18n...
     └─┬──┘└──┬───┘└┬─┘└──────┬──────┘
       │      │     │         │
    时间戳  版本号  appId   签名数据
```

### 可能的版本号
根据之前的抓包数据，你的版本号是：
- `36mwzzm9mh6qdqq7`

在 GitHub 搜索这个版本号，可能能找到现成的逆向代码。

---

## 💡 提示

1. **耐心很重要**：逆向需要反复尝试
2. **多试几个页面**：不同活动可能用不同版本
3. **记录详细信息**：方便后续分析
4. **注意安全**：不要在控制台运行不明代码

---

**祝调试顺利！找到后立即告诉我结果！** 🎉
```

---

## 🔖 快捷方式

### Bookmarklet（下一步创建）
我会创建一个一键调试的书签，直接拖到书签栏就能用。

---

**最后更新**: 2025-10-16
