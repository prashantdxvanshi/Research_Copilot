from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from database import db as mongo_db  # import the module-level db directly, safe for background threads
from agent.graph import app_graph

import logging

router = APIRouter(prefix="/workflow", tags=["workflow"])
logger = logging.getLogger(__name__)

def run_workflow_bg(session_id: str):
    """
    Runs in a FastAPI background task. Uses the module-level MongoDB db directly
    to avoid issues with generator-based FastAPI dependencies being cleaned up after
    the HTTP response is sent.
    """
    try:
        db_session = mongo_db.sessions.find_one({"_id": session_id})
        if not db_session:
            logger.warning(f"[workflow] Session {session_id} not found when background task started")
            return

        mongo_db.sessions.update_one({"_id": session_id}, {"$set": {"status": "in_progress"}})
        logger.info(f"[workflow] Starting for session {session_id} — Company: {db_session['company_name']}")

        initial_state = {
            "session_id": session_id,
            "company_name": db_session["company_name"],
            "website": db_session["website"],
            "objective": db_session["objective"],
            # All intermediate state fields must be initialized
            "plan": [],
            "search_queries": [],
            "research_results": [],
            "report": None,
            "errors": [],
            "revision_count": 0,
            "quality_passed": False,
        }

        final_state = app_graph.invoke(initial_state)

        errors = final_state.get("errors", [])
        report = final_state.get("report")

        if report:
            logger.info(f"[workflow] Completed successfully for session {session_id}")
            mongo_db.sessions.update_one({"_id": session_id}, {
                "$set": {
                    "status": "completed",
                    "report": report,
                    "errors": errors,
                    "current_step": "Research complete"
                }
            })
        else:
            logger.error(f"[workflow] Failed — no report produced. Errors: {errors}")
            mongo_db.sessions.update_one({"_id": session_id}, {
                "$set": {
                    "status": "failed",
                    "errors": errors,
                    "current_step": "Failed"
                }
            })

    except Exception as e:
        logger.error(f"[workflow] Unhandled exception for session {session_id}: {e}", exc_info=True)
        try:
            mongo_db.sessions.update_one({"_id": session_id}, {
                "$set": {
                    "status": "failed",
                    "errors": [f"Unhandled exception: {str(e)}"],
                    "current_step": "Failed"
                }
            })
        except Exception as db_err:
            logger.critical(f"[workflow] Failed to record failure status: {db_err}")


@router.post("/{session_id}/execute")
def execute_workflow(session_id: str, background_tasks: BackgroundTasks, db=Depends(lambda: mongo_db)):
    db_session = mongo_db.sessions.find_one({"_id": session_id})
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if db_session.get("status") in ("in_progress", "completed"):
        raise HTTPException(status_code=409, detail=f"Session is already {db_session['status']}")

    background_tasks.add_task(run_workflow_bg, session_id)
    logger.info(f"[workflow] Queued background task for session {session_id}")
    return {"status": "accepted", "message": "Workflow execution started"}


@router.get("/{session_id}/status")
def get_workflow_status(session_id: str):
    """
    Lightweight status-only endpoint for the frontend progress poller.
    Returns the current status, errors, and current active step, without the full report.
    """
    doc = mongo_db.sessions.find_one({"_id": session_id}, {"status": 1, "errors": 1, "current_step": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session_id,
        "status": doc.get("status", "unknown"),
        "errors": doc.get("errors", []),
        "current_step": doc.get("current_step", "Initializing research")
    }
