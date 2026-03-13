# ⚔️ Swordfish Demo - Zeabur 部署指南

## 部署方式

### 方式1: 一键部署（推荐）

1. **Fork 项目**
   - 访问 GitHub: https://github.com
   - Fork 此仓库

2. **Zeabur 部署**
   - 访问 https://zeabur.com
   - 用 GitHub 登录
   - 点击 "New Project" → "Import from GitHub"
   - 选择刚 Fork 的仓库
   - Zeabur 会自动检测 `frontend` 和 `backend` 两个服务
   - 点击部署

3. **访问**
   - 部署完成后，点击生成的链接即可访问

---

### 方式2: 手动部署后端

```bash
# 安装 Zeabur CLI
npm i -g @zeabur/cli

# 登录
zeabur login

# 部署后端
cd backend
zeabur deploy

# 部署前端
cd ../frontend  
zeabur deploy
```

---

## 服务配置

### Backend (端口 3000)
- 运行命令: `node trading-server.js`
- 自动安装依赖

### Frontend (端口 5173)
- 构建命令: `pnpm build`
- 输出目录: `dist`

---

## 部署后配置

部署完成后，可能需要：
1. 设置环境变量（如果后端需要）
2. 配置自定义域名（可选）

---
