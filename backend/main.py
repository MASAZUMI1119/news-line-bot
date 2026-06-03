from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import Task, Goal, Milestone, Essay, Achievement, ChatMessage
from routers import tasks, goals, milestones, essays, achievements, ai_tutor
from routers import line_webhook, notion_tasks, ai_coach
from seed import seed_initial_data

Base.metadata.create_all(bind=engine)
seed_initial_data()

app = FastAPI(title="Minerva Tutor API", version="1.0.0", redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(goals.router)
app.include_router(milestones.router)
app.include_router(essays.router)
app.include_router(achievements.router)
app.include_router(ai_tutor.router)
app.include_router(line_webhook.router)
app.include_router(notion_tasks.router)
app.include_router(ai_coach.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
