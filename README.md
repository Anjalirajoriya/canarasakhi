# 🏦 CanaraSakhi
### Offline Agentic Regulatory Compliance System for Canara Bank

> Built for **SuRaksha Hackathon** by Canara Bank  
> Theme: **Agentic Regulatory Intelligence & Compliance**

---

## 🎯 What it does

CanaraSakhi is a fully offline AI system that helps bank employees stay on top of RBI/SEBI compliance obligations.

**Upload any RBI circular PDF → AI extracts every compliance task → Employees know exactly what to do, by when, and who is responsible.**

No more manually reading dense regulatory documents. No more missed deadlines.

---

## 🔒 Privacy First

| Feature | Detail |
|---|---|
| 100% Offline | No internet required after setup |
| No API Keys | Uses local Llama 3.1 via Ollama |
| No Cloud | All data stays on the bank's own machine |
| No Tracking | Zero telemetry, zero external calls |
| RBI Compliant | Meets RBI data localisation guidelines |

---

## ✨ Key Features

- **Automatic MAP extraction** — AI reads circular and creates Measurable Action Points
- **Department routing** — tasks auto-assigned to IT, Credit, Legal, HR, Treasury, Operations
- **Honest deadlines** — only shows deadlines explicitly stated in circular, never invented
- **Department progress bars** — real-time compliance % per department
- **Task management** — mark complete, add notes, move between departments, undo
- **Search & filters** — filter by department, circular name, date, completion status
- **Audit trail** — every completion recorded with timestamp and notes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Llama 3.1 8B (local, via Ollama) |
| Backend | Python + FastAPI |
| Database | SQLite (local file) |
| Frontend | React + Vite |
| PDF Reading | PyMuPDF |

---

## 🚀 Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.com) installed

### Step 1 — Download AI model (one time, needs WiFi)
```bash
ollama pull llama3.1
```

### Step 2 — Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Step 3 — Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 4 — Open browser
```
http://localhost:5173
```

### Step 5 — Upload an RBI circular PDF and watch it work

---

## 📁 Project Structure

```
canarasakhi/
├── backend/
│   ├── main.py              # FastAPI routes
│   ├── models.py            # Database models
│   ├── database.py          # SQLite setup
│   └── agents/
│       ├── parser.py        # AI circular parser (core)
│       └── validator.py     # Completion validator
└── frontend/
    └── src/
        └── App.jsx          # React dashboard
```

---

## 🎬 Demo Flow

1. Open dashboard — clean empty state
2. **Turn WiFi OFF** — proves fully offline
3. Upload a real RBI Master Circular PDF
4. Watch MAPs generate in 15–30 seconds
5. Click department filters — see tasks per dept
6. Mark a task complete — bar fills up
7. Switch to Completed tab — see full audit trail

---

## 👥 Team

- Anjali
- Bhawana Gupta  
- Bhavika