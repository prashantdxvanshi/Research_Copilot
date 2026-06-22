from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers for session management, workflow execution, and chat
from routers import sessions, workflow, chat

# 1. Load environment variables from the .env file
load_dotenv()

import logging

# 2. Configure robust, human-readable logging for debuggability
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 3. Initialize the FastAPI Application
app = FastAPI(
    title="Zylabs AI Research Copilot API",
    description="Backend API powering the Research Copilot using LangGraph and FastAPI.",
    version="1.0.0"
)

# Startup event hook - fires when FastAPI starts up
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Zylabs AI Research Copilot API - Startup initialization complete.")

# 4. Configure Cross-Origin Resource Sharing (CORS) Middleware
# This allows the React frontend (running on another port like 5173) to securely communicate with the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Production origin
    allow_credentials=True,
    allow_methods=["*"], # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all custom and standard HTTP headers
)

# 5. Register APIRouters to separate concerns and modularize routes
app.include_router(sessions.router)  # Handles session creation and listing
app.include_router(workflow.router)  # Handles LangGraph research workflow execution
app.include_router(chat.router)      # Handles AI chat interactions based on research report

# 6. Basic Health-Check Endpoint
@app.get("/")
def read_root():
    """
    Root endpoint serving as a simple API health check.
    """
    return {"message": "Welcome to Zylabs AI Research Copilot API"}

