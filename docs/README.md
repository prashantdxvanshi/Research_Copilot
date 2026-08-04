# Zylabs AI Research Copilot

A production-grade AI Research Copilot built for the Zylabs Intern AI Engineer Assignment.
It uses **LangGraph** for the AI workflow, **Python (FastAPI)** for the backend, **ReactJS (Vite + TailwindCSS)** for the frontend, **MongoDB** for persistence, and **Ollama** for local LLM inference.

## Features

- **LangGraph Orchestration** — Multi-node AI workflow: `Planner → Researcher → Report Generator → Quality Check`
- **Conditional Routing** — Quality check can loop back to the researcher if report sections are missing (up to 2 retries)
- **Structured Outputs** — LangChain Pydantic schemas (`SearchQueries`, `ResearchReport`) bound to nodes via `with_structured_output()` for reliable, typed results
- **MongoDB Persistence** — Sessions and chat histories stored in MongoDB (Atlas or local)
- **Ollama Integration** — Runs fully locally using `llama3.2:1b` via Ollama's OpenAI-compatible API
- **FastAPI Backend** — Async endpoints with structured logging, error handling, and background task execution
- **ReactJS Frontend** — Responsive, animated UI with session history, workflow progress polling, and follow-up chat
- **Contextual Chat** — Follow-up Q&A grounded in the generated report

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **MongoDB** — Local (`mongodb://localhost:27017`) **or** MongoDB Atlas connection string
- **Ollama** — Running locally with `llama3.2:1b` pulled (`ollama pull llama3.2:1b`)

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   venv\Scripts\activate      # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the `backend` directory:
   ```env
   OPENAI_API_KEY=ollama
   LLM_BASE_URL=http://localhost:11434/v1
   LLM_MODEL=llama3.2:1b
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=research_copilot
   ```
   > For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`
   Interactive docs: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Documentation

- [Architecture](architecture.md)
- [Product Improvements](product-improvements.md)
- [Engineering Decisions](engineering-decisions.md)
