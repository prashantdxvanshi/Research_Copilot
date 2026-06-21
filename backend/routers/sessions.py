from fastapi import APIRouter, Depends, HTTPException
import uuid
import datetime
from database import get_db
from models import SessionCreate, SessionResponse

import logging

router = APIRouter(prefix="/sessions", tags=["sessions"])
logger = logging.getLogger(__name__)

@router.post("/", response_model=SessionResponse)
def create_session(session_data: SessionCreate, db = Depends(get_db)):
    session_id = str(uuid.uuid4())
    created_at = datetime.datetime.utcnow()
    
    db_session = {
        "_id": session_id,
        "company_name": session_data.company_name,
        "website": session_data.website,
        "objective": session_data.objective,
        "status": "created",
        "report": None,
        "created_at": created_at
    }
    
    try:
        db.sessions.insert_one(db_session)
        logger.info(f"Created new session in MongoDB: {session_id} for company: {session_data.company_name}")
    except Exception as e:
        logger.error(f"Failed to insert session to MongoDB: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database write failure")
    
    return SessionResponse(
        id=session_id,
        company_name=session_data.company_name,
        website=session_data.website,
        objective=session_data.objective,
        status="created",
        current_step="Created",
        report=None,
        created_at=created_at
    )

@router.get("/", response_model=list[SessionResponse])
def list_sessions(db = Depends(get_db)):
    try:
        cursor = db.sessions.find().sort("created_at", -1)
        results = []
        for doc in cursor:
            results.append(SessionResponse(
                id=doc["_id"],
                company_name=doc["company_name"],
                website=doc["website"],
                objective=doc["objective"],
                status=doc["status"],
                current_step=doc.get("current_step"),
                report=doc.get("report"),
                created_at=doc["created_at"]
            ))
        return results
    except Exception as e:
        logger.error(f"Failed to list sessions from MongoDB: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database read failure")

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db = Depends(get_db)):
    try:
        doc = db.sessions.find_one({"_id": session_id})
        if not doc:
            raise HTTPException(status_code=404, detail="Session not found")
        return SessionResponse(
            id=doc["_id"],
            company_name=doc["company_name"],
            website=doc["website"],
            objective=doc["objective"],
            status=doc["status"],
            current_step=doc.get("current_step"),
            report=doc.get("report"),
            created_at=doc["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch session from MongoDB: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database fetch failure")
