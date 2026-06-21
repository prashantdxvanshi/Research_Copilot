# Engineering Decisions

## 1. MongoDB Over SQLite for Persistence

**Decision:** Migrated from SQLite (SQLAlchemy) to MongoDB (PyMongo) for session and chat message storage.

**Alternatives Considered:**
- *SQLite (original):* Simple, zero-config, but locks on concurrent writes and doesn't suit document-shaped data.
- *PostgreSQL + SQLAlchemy:* Production-grade relational DB. Excellent for structured data, but adding a JSON column for the `report` field creates an impedance mismatch — report data is inherently variable-schema.
- *Redis:* Great for ephemeral state, but poor fit for persistent session history and chat logs.

**Tradeoffs:** MongoDB's document model is a natural fit for the research report, which is a variable-depth JSON object. Sessions and chat history are stored without schema migration overhead. The tradeoff is that MongoDB lacks native JOIN support, but since our data access patterns are simple (sessions by ID, chat by session_id), this is not a concern. MongoDB Atlas also provides a free-tier cloud deployment, eliminating infrastructure setup.

---

## 2. Ollama with Structured Output (Pydantic + `with_structured_output`) Over Raw JSON Prompting

**Decision:** Replaced `json.loads(response.content)` prompt hacking with LangChain's `llm.with_structured_output(PydanticModel)` bound to Pydantic schemas (`SearchQueries`, `ResearchReport`).

**Alternatives Considered:**
- *Raw JSON prompting:* Instruct the LLM to "output only JSON", then parse with `json.loads`. Brittle — any stray text or markdown formatting breaks the parser.
- *OutputParser (LangChain):* `JsonOutputParser` can clean up raw responses but still relies on prompt compliance and lacks type validation.
- *OpenAI Function Calling (direct):* Works well with GPT-4, but requires a cloud API key and internet access.

**Tradeoffs:** Native `with_structured_output()` uses the model's tool-calling capability to force schema compliance at the protocol level. However, to ensure 100% reliability across all local or cloud LLM backends (such as `gpt-oss:120b-cloud`, which fails native tool-calling), we built a hybrid wrapper `invoke_structured`. It attempts native tool-calling first, and if that fails, automatically triggers a fallback parser. This fallback instructs the model to return raw JSON, extracts the substring bounded by `{` and `}`, and validates/re-serializes the data using Pydantic's `model_validate()`. This gives us the protocol-level guarantees of Pydantic schemas with absolute compatibility across any OpenAI-compatible server.

---

## 3. FastAPI `BackgroundTasks` for Async Workflow Execution

**Decision:** The LangGraph workflow is triggered via FastAPI's built-in `BackgroundTasks`, allowing the `/execute` endpoint to return `202 Accepted` immediately while the workflow runs in the background.

**Alternatives Considered:**
- *Synchronous execution:* The `/execute` endpoint blocks until LangGraph completes. This would timeout long-running sessions and block the API worker.
- *Celery + Redis:* A proper distributed task queue. Supports retries, monitoring, and multi-worker scaling. However, it adds significant infrastructure complexity (Redis, Celery worker processes, flower for monitoring).
- *asyncio tasks:* Similar to `BackgroundTasks` but requires managing the event loop lifecycle manually.

**Tradeoffs:** `BackgroundTasks` is fast to implement and sufficient for single-server, low-concurrency deployments. The limitation is that background tasks share the uvicorn worker process — under high load, many concurrent workflows could exhaust worker threads. For production scale, Celery + Redis would be the correct upgrade path.

---

## Bonus: What I Would Improve with 2 Additional Weeks

1. **SSE Streaming for Real-Time Progress:** Replace the 3-second polling loop with Server-Sent Events (SSE). LangGraph's `.stream()` API can emit intermediate state updates per node, which would let the frontend show a live step-by-step progress bar (e.g., "Planner ✓ → Researcher ✓ → Report Generator...").

2. **Celery + Redis Task Queue:** Offload LangGraph execution from FastAPI's background tasks into dedicated Celery workers. This enables true horizontal scaling, task retries with exponential backoff, and workflow monitoring via Flower.

3. **RAG-Based Chat Context:** Instead of dumping the entire report as a SystemMessage (which hits token limits over long conversations), I would index the report chunks into a local FAISS or Chroma vector store and use retrieval to inject only the most relevant sections per user question — dramatically improving accuracy and reducing token costs.
