from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Goal
from schemas import GoalCreate, GoalUpdate, GoalOut

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.get("", response_model=List[GoalOut])
def list_goals(month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Goal)
    if month:
        q = q.filter(Goal.month == month)
    if year:
        q = q.filter(Goal.year == year)
    return q.order_by(Goal.year, Goal.month, Goal.id).all()


@router.post("", response_model=GoalOut)
def create_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    db_goal = Goal(**goal.model_dump())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, goal: GoalUpdate, db: Session = Depends(get_db)):
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in goal.model_dump(exclude_none=True).items():
        setattr(db_goal, field, value)
    db.commit()
    db.refresh(db_goal)
    return db_goal


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(db_goal)
    db.commit()
    return {"ok": True}
