from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Milestone
from schemas import MilestoneCreate, MilestoneUpdate, MilestoneOut

router = APIRouter(prefix="/api/milestones", tags=["milestones"])


@router.get("", response_model=List[MilestoneOut])
def list_milestones(db: Session = Depends(get_db)):
    return db.query(Milestone).order_by(Milestone.date).all()


@router.post("", response_model=MilestoneOut)
def create_milestone(milestone: MilestoneCreate, db: Session = Depends(get_db)):
    db_milestone = Milestone(**milestone.model_dump())
    db.add(db_milestone)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone


@router.patch("/{milestone_id}", response_model=MilestoneOut)
def update_milestone(milestone_id: int, milestone: MilestoneUpdate, db: Session = Depends(get_db)):
    db_milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not db_milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    for field, value in milestone.model_dump(exclude_none=True).items():
        setattr(db_milestone, field, value)
    db.commit()
    db.refresh(db_milestone)
    return db_milestone


@router.delete("/{milestone_id}")
def delete_milestone(milestone_id: int, db: Session = Depends(get_db)):
    db_milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not db_milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    db.delete(db_milestone)
    db.commit()
    return {"ok": True}
