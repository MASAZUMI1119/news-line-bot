from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Achievement
from schemas import AchievementCreate, AchievementUpdate, AchievementOut

router = APIRouter(prefix="/api/achievements", tags=["achievements"])


@router.get("", response_model=List[AchievementOut])
def list_achievements(db: Session = Depends(get_db)):
    return db.query(Achievement).order_by(Achievement.created_at.desc()).all()


@router.post("", response_model=AchievementOut)
def create_achievement(achievement: AchievementCreate, db: Session = Depends(get_db)):
    db_achievement = Achievement(**achievement.model_dump())
    db.add(db_achievement)
    db.commit()
    db.refresh(db_achievement)
    return db_achievement


@router.patch("/{achievement_id}", response_model=AchievementOut)
def update_achievement(achievement_id: int, achievement: AchievementUpdate, db: Session = Depends(get_db)):
    db_achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not db_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    for field, value in achievement.model_dump(exclude_none=True).items():
        setattr(db_achievement, field, value)
    db.commit()
    db.refresh(db_achievement)
    return db_achievement


@router.delete("/{achievement_id}")
def delete_achievement(achievement_id: int, db: Session = Depends(get_db)):
    db_achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
    if not db_achievement:
        raise HTTPException(status_code=404, detail="Achievement not found")
    db.delete(db_achievement)
    db.commit()
    return {"ok": True}
