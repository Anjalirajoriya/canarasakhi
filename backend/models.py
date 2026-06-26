from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class MAP(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    action: str
    department: str
    deadline_days: int
    priority: str
    evidence_required: str
    status: str = "Pending"
    circular_name: str = ""
    circular_summary: str = ""
    risk_level: str = "Medium"
    penalty_if_missed: str = ""
    completion_note: str = ""
    created_at: str = Field(
        default_factory=lambda: datetime.now().isoformat()
    )