# c2c-001 · 人生时间投资所

Vue 3 + TypeScript + Vite 纯前端时间资产配置工具。用户可以设置每日/每周时间预算，将时间投入健康、学习、关系、事业、娱乐、休息六类资产，查看组合配置、ROI、人生资产负债表与再平衡建议。数据保存在浏览器 `localStorage`。

## 分层

- 核心层 `src/core`：时间账户、投资记录、组合指标、ROI、资产负债表与建议规则
- 端口层 `src/ports`：时间快照仓储接口
- 适配器层 `src/adapters`：浏览器本地存储实现
- 界面层 `src/ui`：Vue 页面与原生 CSS 视图

## 命令

```bash
npm install
npm run dev
npm run build
docker compose up --build
```

访问 `http://localhost:8101`。
