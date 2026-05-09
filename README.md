# 不二集 Never2

> 凡所记录，皆不再犯。

智能错题管理与练习系统，帮助孩子高效复习错题。

## 功能特性

- **用户注册/登录**：支持邮箱密码注册和登录
- **错题维护**：支持语文、数学、英语三个科目，可录入文字题目和图片（支持粘贴/拖拽上传）
- **错题练习**：手动选择或随机生成练习（可按练习次数、错误次数排序）
- **练习批改**：提交练习后由家长批改，记录正确/错误
- **练习分析**：统计每道错题的练习次数、正确次数、错误次数、连续正确次数、正确率
- **过关标记**：已掌握的错题可标记为"已过关"，不再参与练习

## 技术栈

- **框架**: Next.js 14 + TypeScript + App Router
- **样式**: Tailwind CSS
- **数据库**: SQLite (better-sqlite3)
- **ORM**: Drizzle ORM
- **认证**: JWT (jose) + bcryptjs
- **部署**: Docker

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:migrate

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### Docker 部署

```bash
# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

## 项目结构

```
├── drizzle/              # 数据库 schema 和迁移
├── src/
│   ├── app/              # Next.js App Router 页面和 API
│   ├── components/       # React 组件
│   │   ├── layout/       # 布局组件
│   │   └── mistakes/     # 错题相关组件
│   ├── lib/              # 工具库 (auth, db, storage)
│   └── types/            # TypeScript 类型定义
├── data/                 # 运行时数据 (SQLite DB, 上传图片)
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `./data/never2.db` |
| `JWT_SECRET` | JWT 签名密钥 | 内置默认值（生产环境请更换） |
| `UPLOAD_DIR` | 图片上传目录 | `./data/uploads` |
| `VOLCANO_ACCESS_KEY` | 火山云 OSS Access Key | 不配置则使用本地存储 |
