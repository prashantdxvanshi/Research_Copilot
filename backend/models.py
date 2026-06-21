import datetime
from pydantic import BaseModel, Field

# Pydantic Schemas for validation and serialization
class SessionCreate(BaseModel):
    company_name: str = Field(..., description="The name of the company to research")
    website: str = Field(..., description="The official website of the company")
    objective: str = Field(..., description="Specific goal or objective for the research session")

class SessionResponse(BaseModel):
    id: str = Field(..., description="Unique session ID")
    company_name: str
    website: str
    objective: str
    status: str  # created, in_progress, completed, failed
    current_step: str | None = None
    report: dict | None = None
    created_at: datetime.datetime

    class Config:
        json_encoders = {
            datetime.datetime: lambda v: v.isoformat()
        }

class ChatMessageCreate(BaseModel):
    content: str = Field(..., description="Message text content")

class ChatMessageResponse(BaseModel):
    role: str = Field(..., description="The sender role: user or assistant")
    content: str = Field(..., description="Content of the message")
