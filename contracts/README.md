# ⚔️ Swordfish Smart Contracts

ERC-3643 合规证券型代币智能合约

## 合约架构

### 1. SwordfishSecurityToken (主代币)
- **标准**: ERC-20 + ERC-3643 兼容
- **功能**:
  - 转账限制 (KYC/AML)
  - 身份验证集成
  - 分红分配
  - 投票委托
  - 批量转账

### 2. SwordfishEnergyToken (能源资产代币)
- **功能**:
  - 能源资产代币化
  - 资产信息存证
  - 产能映射

## 快速开始

```bash
# 安装依赖
pnpm install

# 编译合约
pnpm compile

# 运行测试
pnpm test

# 启动本地节点
pnpm node

# 部署
pnpm deploy
```

## 部署配置

### 主网/测试网配置
```javascript
// hardhat.config.js
networks: {
  polygon: {
    url: process.env.POLYGON_RPC,
    accounts: [process.env.PRIVATE_KEY]
  },
  arbitrum: {
    url: process.env.ARBITRUM_RPC,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

## 合规特性

### ERC-3643 核心功能
- ✅ 转账限制规则
- ✅ 身份注册集成
- ✅ 分红权
- ✅ 投票权
- ✅ 批量操作

### 部署清单
- [ ] 部署 IdentityRegistry
- [ ] 部署 ComplianceModule
- [ ] 部署 SwordfishSecurityToken
- [ ] 设置 KYC 白名单
- [ ] 配置 Treasury 地址

---
*Swordfish Project - RWA Tokenization*
