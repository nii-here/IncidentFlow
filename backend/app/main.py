# app/main.py

# FastAPI import
from fastapi import FastAPI

# Import database engine and Base
from app.database.db import engine, Base

# Import models so SQLAlchemy knows these tables exist
from app.models.user import User
from app.models.ticket import Ticket
from app.models.ticket_comment import TicketComment
from app.models.person import Person
from app.models.ticket_attachment import TicketAttachment
from app.models.organization_setting import OrganizationSetting

# Import authentication routes
from app.routes import (
    auth,
    tickets,
    departments,
    categories,
    assignment_groups,
    users,
    people,
    ticket_attachments,
    settings,
) 

# Import ticket history model for audit trail table creation
from app.models.ticket_history import TicketHistory

# Import departments for better tracking
from app.models.department import Department
from app.models.category import Category
from app.models.assignment_group import AssignmentGroup
from app.models.assignment_group_member import AssignmentGroupMember

from fastapi.middleware.cors import CORSMiddleware

# --------------------------------------------------
# Create database tables
# This reads all models that inherit from Base
# and creates the matching PostgreSQL tables
# --------------------------------------------------
# Base.metadata.create_all(bind=engine)
# Database schema is now managed by Alembic migrations.
# Do not use Base.metadata.create_all() in production-style setup.

# --------------------------------------------------
# Create FastAPI app
# --------------------------------------------------
app = FastAPI(
    title="IncidentFlow API",
    description="Internal IT support and systems monitoring platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register authentication routes with FastAPI
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(departments.router)
app.include_router(categories.router)
app.include_router(assignment_groups.router)
app.include_router(users.router)
app.include_router(people.router)
app.include_router(ticket_attachments.router)
app.include_router(settings.router)

# --------------------------------------------------
# Root route
# Used to confirm the API is running
# --------------------------------------------------
@app.get("/")
def root():
    return {"message": "IncidentFlow API is running"}


# --------------------------------------------------
# Health check route
# Used to confirm backend health
# --------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "healthy"}