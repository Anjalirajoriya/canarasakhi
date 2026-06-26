from fastapi import FastAPI, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
import fitz
from database import create_db, get_session
from models import MAP
from agents.parser import parse_circular

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
create_db()

class CompleteRequest(BaseModel):
    note: Optional[str] = ""

class UpdateDeptRequest(BaseModel):
    department: str

@app.post("/upload-circular")
async def upload(file: UploadFile, db: Session = Depends(get_session)):
    data = await file.read()
    doc = fitz.open(stream=data, filetype="pdf")
    text = " ".join(p.get_text() for p in doc)
    maps, summary = parse_circular(text)
    saved = []
    for m in maps:
        item = MAP(
            action=m.get("action",""),
            department=m.get("department","Operations"),
            deadline_days=m.get("deadline_days", -1),
            deadline_text=m.get("deadline_text","Not specified"),
            priority=m.get("priority","Medium"),
            risk_level=m.get("risk_level","Medium"),
            evidence_required=m.get("evidence_required","Not specified"),
            penalty_if_missed=m.get("penalty_if_missed",""),
            circular_name=file.filename,
            circular_summary=summary
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        saved.append(item)
    return {"maps": saved, "total": len(saved), "summary": summary}

@app.get("/maps")
def get_maps(db: Session = Depends(get_session)):
    return db.exec(select(MAP)).all()

@app.patch("/maps/{map_id}/complete")
def complete(map_id: int, req: CompleteRequest,
             db: Session = Depends(get_session)):
    item = db.get(MAP, map_id)
    if not item:
        return {"error": "not found"}
    item.status = "Complete"
    item.completion_note = req.note or ""
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.patch("/maps/{map_id}/undo")
def undo(map_id: int, db: Session = Depends(get_session)):
    item = db.get(MAP, map_id)
    if not item:
        return {"error": "not found"}
    item.status = "Pending"
    item.completion_note = ""
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.patch("/maps/{map_id}/department")
def update_dept(map_id: int, req: UpdateDeptRequest,
                db: Session = Depends(get_session)):
    item = db.get(MAP, map_id)
    if not item:
        return {"error": "not found"}
    item.department = req.department
    db.add(item)
    db.commit()
    db.refresh(item)
    return item