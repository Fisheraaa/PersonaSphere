# PersonaSphere

智能人脉管理系统 - 轻松管理你的人际关系网络

## 功能特性

- 📝 **信息提取** - 通过自然语言描述自动提取人物信息
- 👥 **关系网络** - 可视化展示人物之间的关系图谱
- 🏷️ **圈子管理** - 自动/手动创建圈子，方便分组管理
- 🎨 **莫兰迪配色** - 优雅的视觉设计
- 📊 **力导向布局** - 使用 D3.js 实现美观的关系图

## 技术栈

### 后端
- FastAPI - 高性能 Python Web 框架
- SQLite + SQLAlchemy - 数据存储
- Pydantic - 数据验证

### 前端
- React 18 + TypeScript - 现代前端框架
- Ant Design - UI 组件库
- Zustand - 状态管理
- Cytoscape.js - 关系图谱可视化

## 快速开始

### 后端启动

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

然后在浏览器打开 http://localhost:5173

## 项目结构

```
PersonaSphere/
├── backend/          # 后端服务
│   ├── app/
│   │   ├── main.py      # API 主文件
│   │   ├── models.py    # 数据库模型
│   │   ├── schemas.py   # Pydantic 模型
│   │   └── database.py  # 数据库配置
│   └── data/         # 数据库文件
├── frontend/         # 前端应用
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── api.ts       # API 调用
│   │   ├── store.ts     # 状态管理
│   │   └── types.ts     # 类型定义
│   └── package.json
└── MVP_v4.md        # 产品需求文档
```

## 主要功能页面

1. **信息页** - 输入文本，提取人物信息
2. **关系网** - 查看人物关系图谱，可拖拽调整布局
3. **圈子** - 管理人物分组，支持自动生成圈子

## 开发者

本项目使用 Trae AI 开发

## 许可证

MIT
