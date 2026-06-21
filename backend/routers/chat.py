from fastapi import APIRouter, Depends, HTTPException
import datetime
from database import db as mongo_db
from models import ChatMessageCreate, ChatMessageResponse
from agent.nodes import get_llm
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

import logging

router = APIRouter(prefix="/sessions", tags=["chat"])
logger = logging.getLogger(__name__)

@router.post("/{session_id}/chat", response_model=ChatMessageResponse)
def send_chat_message(session_id: str, message: ChatMessageCreate):
    db_session = mongo_db.sessions.find_one({"_id": session_id})
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    if db_session.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail="Chat is only available once the research report is completed."
        )

    if not message.content or not message.content.strip():
        raise HTTPException(status_code=422, detail="Message content cannot be empty")

    # Save user message
    user_msg = {
        "session_id": session_id,
        "role": "user",
        "content": message.content.strip(),
        "created_at": datetime.datetime.utcnow()
    }
    try:
        mongo_db.chat_messages.insert_one(user_msg)
    except Exception as e:
        logger.error(f"[chat] Failed to save user message for session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save message")

    # Retrieve full chat history (for context)
    try:
        history = list(mongo_db.chat_messages.find(
            {"session_id": session_id}
        ).sort("created_at", 1))
    except Exception as e:
        logger.error(f"[chat] Failed to fetch chat history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch chat history")

    # Build report context string
    report_content = ""
    if db_session.get("report"):
        report_content = "\n\n".join([
            f"### {k}\n{v}" for k, v in db_session["report"].items()
        ])

    # Build LLM message list
    messages = [
        SystemMessage(content=(
            f"You are an AI Research Copilot with deep knowledge of the company '{db_session['company_name']}'. "
            f"The user's research objective is: '{db_session['objective']}'. "
            f"Answer questions concisely and factually based on the research report below. "
            f"If the answer is not in the report, say so clearly.\n\n"
            f"--- RESEARCH REPORT ---\n{report_content}"
        ))
    ]

    for h in history:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        else:
            messages.append(AIMessage(content=h["content"]))

    # Invoke LLM
    try:
        llm = get_llm()
        response = llm.invoke(messages)
        ai_content = response.content
    except Exception as e:
        logger.error(f"[chat] LLM invocation failed for session {session_id}: {e}", exc_info=True)
        ai_content = "I'm sorry, I encountered an error while processing your question. Please try again."

    # Save assistant reply
    ai_msg = {
        "session_id": session_id,
        "role": "assistant",
        "content": ai_content,
        "created_at": datetime.datetime.utcnow()
    }
    try:
        mongo_db.chat_messages.insert_one(ai_msg)
    except Exception as e:
        logger.error(f"[chat] Failed to save assistant message: {e}", exc_info=True)

    logger.info(f"[chat] Responded to message for session {session_id}")
    return ChatMessageResponse(role="assistant", content=ai_content)


@router.get("/{session_id}/chat", response_model=list[ChatMessageResponse])
def get_chat_history(session_id: str):
    db_session = mongo_db.sessions.find_one({"_id": session_id}, {"_id": 1})
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    try:
        cursor = mongo_db.chat_messages.find(
            {"session_id": session_id}
        ).sort("created_at", 1)
        return [ChatMessageResponse(role=doc["role"], content=doc["content"]) for doc in cursor]
    except Exception as e:
        logger.error(f"[chat] Failed to fetch history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database fetch failure")
