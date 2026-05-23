from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Essay
from schemas import EssayCreate, EssayUpdate, EssayOut

router = APIRouter(prefix="/api/essays", tags=["essays"])


@router.get("", response_model=List[EssayOut])
def list_essays(db: Session = Depends(get_db)):
    return db.query(Essay).order_by(Essay.created_at.desc()).all()


@router.post("", response_model=EssayOut)
def create_essay(essay: EssayCreate, db: Session = Depends(get_db)):
    data = essay.model_dump()
    if data.get("draft"):
        data["word_count"] = len(data["draft"].split())
    db_essay = Essay(**data)
    db.add(db_essay)
    db.commit()
    db.refresh(db_essay)
    return db_essay


@router.get("/{essay_id}", response_model=EssayOut)
def get_essay(essay_id: int, db: Session = Depends(get_db)):
    db_essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not db_essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    return db_essay


@router.patch("/{essay_id}", response_model=EssayOut)
def update_essay(essay_id: int, essay: EssayUpdate, db: Session = Depends(get_db)):
    db_essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not db_essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    data = essay.model_dump(exclude_none=True)
    if "draft" in data:
        data["word_count"] = len(data["draft"].split()) if data["draft"] else 0
    for field, value in data.items():
        setattr(db_essay, field, value)
    db.commit()
    db.refresh(db_essay)
    return db_essay


@router.delete("/{essay_id}")
def delete_essay(essay_id: int, db: Session = Depends(get_db)):
    db_essay = db.query(Essay).filter(Essay.id == essay_id).first()
    if not db_essay:
        raise HTTPException(status_code=404, detail="Essay not found")
    db.delete(db_essay)
    db.commit()
    return {"ok": True}
