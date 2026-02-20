# PersonaSphere

Smart Relationship Management System - Easily Manage Your Social Network

## Features

- 📝 **Information Extraction** - Automatically extract person information from natural language
- 👥 **Relationship Network** - Visualize relationships between people
- 🏷️ **Circle Management** - Create circles automatically or manually for easy grouping
- 🎨 **Morandi Colors** - Elegant visual design
- 📊 **Force-directed Layout** - Beautiful relationship graph using D3.js

## Tech Stack

### Backend
- FastAPI - High performance Python web framework
- SQLite + SQLAlchemy - Data storage
- Pydantic - Data validation

### Frontend
- React 18 + TypeScript - Modern frontend framework
- Ant Design - UI component library
- Zustand - State management
- Cytoscape.js - Relationship graph visualization

## Quick Start

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 in your browser

## Project Structure

```
PersonaSphere/
├── backend/          # Backend service
│   ├── app/
│   │   ├── main.py      # API main file
│   │   ├── models.py    # Database models
│   │   ├── schemas.py   # Pydantic models
│   │   └── database.py  # Database configuration
│   └── data/         # Database files
├── frontend/         # Frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── api.ts       # API calls
│   │   ├── store.ts     # State management
│   │   └── types.ts     # Type definitions
│   └── package.json
└── MVP_v4.md        # Product requirements document
```

## Main Pages

1. **Info Page** - Input text and extract person information
2. **Graph Page** - View relationship graph with draggable layout
3. **Circles Page** - Manage person groups with automatic circle generation

## Developer

This project was developed using Trae AI

## License

MIT
