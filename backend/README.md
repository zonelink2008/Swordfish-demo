# ⚔️ Swordfish Demo Backend

电力交易系统后端服务

## 功能

- 📊 价格预测 API (24小时/7天)
- 💱 订单管理 (创建/查询)
- 📈 市场统计 (实时价格、成交量)
- 🗾 区域电价 (日本10大区域)
- 📜 历史数据查询

## 技术栈

- Node.js + Express
- ES Modules
- REST API

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动服务
pnpm start

# 开发模式 (热重载)
pnpm dev
```

## API端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/prediction/hourly` | 24小时价格预测 |
| GET | `/api/prediction/weekly` | 7天价格预测 |
| GET | `/api/prediction/:hour` | 特定时段预测 |
| GET | `/api/orders` | 订单簿 |
| POST | `/api/orders` | 创建订单 |
| GET | `/api/market/stats` | 市场统计 |
| GET | `/api/market/regions` | 区域电价 |
| GET | `/api/market/history` | 历史数据 |
| GET | `/api/health` | 健康检查 |

## 响应示例

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "weather": "cloudy",
    "region": "東京",
    "generatedAt": "2026-03-13T11:50:00.000Z"
  }
}
```

---
*Swordfish Project - AI Power Trading*
