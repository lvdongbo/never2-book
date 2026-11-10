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
- **拍照录入**：拍摄课本单词表照片，AI 自动识别并导入默写词库

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

### 使用网盘同步本地数据

两台电脑分别安装项目，使用同一个网盘同步文件夹。每台电脑在项目根目录的 `.env.local` 中配置本机的绝对路径，路径含空格时加引号：

```dotenv
NEVER2_DATA_DIR="/Users/你的用户名/网盘/不二集"
```

启用后，应用和数据库迁移都会使用该文件夹里的 `never2.db`，上传的本地图片保存在 `uploads/`。可在该文件夹内另建一份 `.env.local`，存放 `JWT_SECRET`、`LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL` 等共用配置。读取这份文件需要 Node.js 20.12 或更新版本。同名配置优先使用系统环境变量或项目自己的配置，若希望从网盘读取，把对应配置从项目的 `.env.local` 移到网盘文件即可。网盘文件中的 API Key 会随文件一起同步。

如果已有数据，先停止应用，再将现有 SQLite 数据库的完整备份命名为 `never2.db` 放入该文件夹，并复制原有 `uploads/`。如果旧目录仍有 `never2.db-wal`，请先用 SQLite 的备份功能生成完整备份，避免遗漏最近写入。然后运行 `npm run db:migrate` 和 `npm run dev`。首次使用时迁移命令会在指定位置创建数据库。

**两台电脑请轮流使用。** 离开一台电脑前先停止应用，等网盘同步完成。换到另一台时，等文件下载完成再启动。两边各自离线修改后，网盘无法合并数据库里的记录。

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
| `NEVER2_DATA_DIR` | 本地 SQLite、图片和共用配置所在目录的绝对路径。设置后由该目录决定数据库和图片路径 | 不设置 |
| `DATABASE_URL` | SQLite 数据库路径 | `./data/never2.db` |
| `JWT_SECRET` | JWT 签名密钥 | 内置默认值（生产环境请更换） |
| `UPLOAD_DIR` | 图片上传目录 | `./data/uploads` |
| `VOLCANO_ACCESS_KEY` | 火山云 OSS Access Key | 不配置则使用本地存储 |
| `LLM_API_KEY` | Vision 模型 API Key（用于拍照录入 OCR） | 必填（使用拍照录入功能时） |
| `LLM_BASE_URL` | Vision 模型 API 地址 | `https://dashscope.aliyuncs.com/compatible-mode/v1`（通义千问） |
| `LLM_MODEL` | Vision 模型名称 | `qwen-vl-plus`（通义千问，推荐） |
