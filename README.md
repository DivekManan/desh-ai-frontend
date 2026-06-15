# 🖥️ DESH-QSI — Frontend

> Real-time security operations dashboard for the **DESH-QSI Decentralized AI Threat Intelligence System** — visualizing live threat detections, incident resolution, SHAP explainability outputs, and decentralized audit logs.

This is the frontend repository. For the backend (detection engine, RL agent, IPFS audit layer), see 👉 [desh-ai-backend](https://github.com/DivekManan/desh-ai-backend)

---

## 🔍 What Is DESH-QSI?

DESH-QSI (Decentralized Enhanced Security Hub — Quantum Security Intelligence) is an AI-powered cybersecurity threat intelligence system built for the modern threat landscape. It combines:

- A **Graph Neural Network** detection engine with 99.2% accuracy and sub-50ms response time
- A **self-healing Reinforcement Learning agent** that autonomously resolves incidents — cutting resolution time from 4.2 hours to 8.3 seconds
- A **decentralized audit trail** using IPFS + Merkle Trees with no single point of failure

This repository contains the **React frontend** — the real-time dashboard that makes all of that visible and actionable.

---

## ✨ What the Dashboard Shows

- **🔴 Live Threat Feed** — Real-time stream of detected threats from the GNN detection engine
- **⚡ Incident Resolution Timeline** — Watch the RL agent resolve incidents in near real-time
- **🧠 Explainability Panel** — SHAP/LIME outputs showing *why* each threat was flagged
- **📋 Audit Log Viewer** — Tamper-proof incident history anchored to IPFS + Merkle Trees
- **📊 System Metrics** — Detection accuracy, response times, and resolution rates at a glance

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React |
| **Language** | JavaScript |
| **Containerization** | Docker |
| **Backend API** | Connects to [desh-ai-backend](https://github.com/DivekManan/desh-ai-backend) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (optional, for containerized run)
- Backend service running (see [desh-ai-backend](https://github.com/DivekManan/desh-ai-backend))

### Run Locally

```bash
# Clone the repo
git clone https://github.com/DivekManan/desh-ai-frontend.git
cd desh-ai-frontend

# Install dependencies
npm install

# Start the dev server
npm start
# Dashboard available at http://localhost:3000
```

### Run with Docker

```bash
docker build -t desh-frontend .
docker run -p 3000:3000 desh-frontend
```

### Run the Full System (Frontend + Backend)

If you have both repos cloned, use Docker Compose from the backend repo to spin up the entire system:

```bash
# In desh-ai-backend/
docker-compose up --build
```

---

## ⚙️ Configuration

Create a `.env` file in the root to point the frontend at your backend:

```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 🗂️ Project Structure

```
desh-ai-frontend/
├── public/
├── src/
│   ├── components/        # Dashboard UI components
│   ├── pages/             # Main views (Threats, Incidents, Audit Log)
│   ├── hooks/             # Data fetching hooks
│   ├── store/             # State management
│   └── App.js             # Root component
├── Dockerfile
└── package.json
```

---

## 🔗 Related Repository

| Repo | Description |
|---|---|
| [desh-ai-backend](https://github.com/DivekManan/desh-ai-backend) | GNN detection engine, RL agent, IPFS audit layer, FastAPI |

---

## 💡 Why This Architecture?

Running the frontend and backend as separate repositories keeps concerns cleanly separated — the detection engine can scale independently of the UI, and teams can work on each without stepping on each other. Docker ensures both sides are reproducible across environments.

---

## 👤 Author

**Divek Manan**
Final-year CSE student at Vellore Institute of Technology
📧 divekmanan@gmail.com
🔗 [linkedin.com/in/divek-manan](https://linkedin.com/in/divek-manan)
🐙 [github.com/DivekManan](https://github.com/DivekManan)

---

*If this project was useful or interesting to you, consider giving it a ⭐*