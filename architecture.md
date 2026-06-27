# Architecture

## Diagram

```text
+-----------------------+       +-------------------------+       +-----------------------------+
|                       |       |                         |       |                             |
|   Frontend (ReactJS)  +-------> Backend (FastAPI)       +-------> MongoDB Atlas / Local Mongo |
|   Vite + TailwindCSS  |       |                         |       |  (sessions, chat_messages)  |
|   Port: 5173          |       |  Port: 8000             |       |                             |
+-----------+-----------+       +-----------+-------------+       +-----------------------------+
            |                               |
   HTTP Polling                        Triggers Background Task
   (status / report)                        |
                                            v
                              +-------------+---------------+
                              |                             |
                              |        LangGraph            |
                              |    (AI Research Workflow)   |
                              |                             |
                              |  Planner → Researcher       |
                              |    ↓                        |
                              |  Report Generator           |
                              |    ↓                        |
                              |  Quality Check              |
                              |    ↓ (conditional loop)     |
                              |  END                        |
                              +-------------+---------------+
                                            |
                                            v
                              +-------------+---------------+
                              |                             |
                              |   Ollama (Local LLM)        |
                              |   llama3.2:1b               |
                              |   Port: 11434               |
                              |   OpenAI-compatible API     |
                              |                             |
                              +-----------------------------+
```

## Layers

### Frontend
The frontend is built with **ReactJS** using **Vite** as the bundler and **TailwindCSS v4** for styling. Framer Motion provides smooth page and component animations. The UI has three main views: a landing page, a dashboard with a session sidebar, and a session detail page that combines the research report and follow-up chat. The frontend polls the backend every 3 seconds while a workflow is executing to detect status transitions.

### Backend
The backend is a **Python + FastAPI** application. FastAPI was chosen for its native async support, automatic Swagger docs, and tight Pydantic integration. The app exposes three router groups — `sessions`, `workflow`, and `chat` — and uses `BackgroundTasks` to run the LangGraph workflow asynchronously so the `/execute` endpoint returns immediately to the client. Structured logging is implemented at every layer for observability.

### AI Workflow (LangGraph)
**LangGraph** manages the multi-step AI research pipeline via a compiled `StateGraph`. The graph has four nodes: `planner`, `researcher`, `report_generator`, and `quality_check`. The `quality_check` node uses conditional routing — if required report sections are missing and fewer than 2 revisions have occurred, it routes back to `researcher` for another attempt. This cyclic design gives the system built-in self-correction capability. LangChain's `with_structured_output()` is used with Pydantic schemas (`SearchQueries`, `ResearchReport`) so each node returns validated, typed data rather than raw strings.

### LLM (Ollama)
**Ollama** is used as the local LLM serving layer. The `llama3.2:1b` model is accessed through Ollama's OpenAI-compatible REST API (`/v1/chat/completions`). LangChain's `ChatOpenAI` client is pointed at `http://localhost:11434/v1`, making the integration drop-in replaceable with any other model or cloud provider by simply updating the `.env` file.

### Storage (MongoDB)
**MongoDB** is used for persistence. Two collections are used: `sessions` (stores session metadata, status, and the final JSON report) and `chat_messages` (stores chat history with role and timestamp). MongoDB was chosen over SQL because the report is a variable-schema JSON document — MongoDB's document model stores it natively without serialization overhead. The connection supports both local MongoDB and MongoDB Atlas.

## Data Flow..

1. User submits a company name, website, and research objective via the React form.
2. The frontend calls `POST /sessions/` to create a session record in MongoDB (`status: "created"`).
3. The frontend immediately calls `POST /workflow/{id}/execute`, which queues the LangGraph run as a background task.
4. The backend updates the session to `status: "in_progress"` and invokes `app_graph.invoke(initial_state)`.
5. The LangGraph planner generates 3 search queries (structured output via Pydantic `SearchQueries`).
6. The researcher executes DuckDuckGo searches for each query and collects raw results.
7. The report generator synthesizes results into a structured briefing (structured output via Pydantic `ResearchReport`).
8. The quality check validates that all 9 required sections are populated; on failure it routes back to step 6 (max 2 retries).
9. On success, the session is updated to `status: "completed"` and the report JSON is saved to MongoDB.
10. The frontend detects the status change via polling and renders the report sections.
11. The user can then ask follow-up questions; the chat router uses the stored report as system context for the LLM.

## Tradeoffs

- **Polling vs. WebSockets/SSE**: HTTP polling was used for simplicity. The frontend polls every 3 seconds, which creates minimal load but introduces up to 3 seconds of latency in status updates. WebSockets would give real-time updates but add connection management complexity.
- **Local LLM vs. Cloud API**: Using Ollama with `llama3.2:1b` eliminates API key dependencies and costs. The tradeoff is that a 1B parameter model is less capable than GPT-4 class models, especially for complex analytical tasks. The model choice is fully configurable via `.env`.
- **DuckDuckGo over Paid APIs**: DuckDuckGo's `duckduckgo_search` library is used to avoid requiring paid API keys. The risk is rate limiting under high load. Tavily or Exa would be more reliable alternatives for production.
- **Background Tasks vs. Celery/Redis**: FastAPI's built-in `BackgroundTasks` was used for simplicity. For production multi-user deployments, a proper task queue (Celery + Redis) would be necessary to prevent long-running LLM calls from blocking API worker processes.
