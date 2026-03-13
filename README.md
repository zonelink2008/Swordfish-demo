# ⚔️ Swordfish Demo

**项目代号**: Swordfish (剑鱼)  
**定位**: 日本AI电力交易代币化平台

---

## 项目结构

```
swordfish/demo/
├── frontend/          # React前端 (Vite + Tailwind)
├── backend/           # Node.js后端 (Express)
└── contracts/         # Solidity智能合约 (Hardhat)
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, Vite, Tailwind CSS, Recharts, Ethers.js |
| 后端 | Node.js, Express, REST API |
| 合约 | Solidity 0.8, Hardhat, OpenZeppelin, ERC-3643 |
| 预言机 | Chainlink (价格喂价) |

## 快速启动

### 1. 安装依赖

```bash
# 前端
cd frontend && pnpm install

# 后端  
cd backend && pnpm install

# 合约
cd contracts && pnpm install
```

### 2. 启动服务

```bash
# 终端1: 启动后端 (端口3000)
cd backend && pnpm start

# 终端2: 启动前端 (端口5173)
cd frontend && pnpm dev
```

### 3. 部署合约 (可选)

```bash
cd contracts
pnpm node     # 启动本地节点
pnpm deploy   # 部署到本地
```

## 功能模块

### 📊 前端 (http://localhost:5173)

| 页面 | 功能 |
|------|------|
| 仪表盘 | 价格预测图表、账户统计、最新订单 |
| 交易 | 买入/卖出电力订单 |
| 资产 | 投资组合、代币持仓 |
| 市场 | JEPX区域电价、实时行情 |
| 设置 | KYC状态、预警配置 |

### 📡 后端 API

```
GET  /api/prediction/hourly   # 24小时预测
GET  /api/prediction/weekly  # 7天预测
GET  /api/orders             # 订单簿
POST /api/orders             # 创建订单
GET  /api/market/stats       # 市场统计
GET  /api/market/regions    # 区域电价
GET  /api/market/history    # 历史数据
```

### ⛓️ 智能合约

| 合约 | 功能 |
|------|------|
| SwordfishSecurityToken | ERC-3643证券型代币 |
| SwordfishEnergyToken | 能源资产代币化 |

## 环境变量

### Backend
```env
PORT=3000
```

### Frontend
```env
VITE_API_BASE=http://localhost:3000
```

### Contracts
```env
PRIVATE_KEY=your_key
POLYGON_RPC=https://polygon-rpc.com
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
```

## 开发路线图

- [x] 前端多页面框架
- [x] 后端API完善
- [x] ERC-3643合约框架
- [ ] 真实JEPX数据接入
- [ ] Chainlink预言机集成
- [ ] AI预测模型训练
- [ ] 主网部署

---
*Powered by Swordfish - AI Driven Energy Trading*
