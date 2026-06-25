# app/main.py

# FastAPI import
from fastapi import FastAPI

# Import database engine and Base
from app.database.db import engine, Base

# Import models so SQLAlchemy knows these tables exist
from app.models.user import User
from app.models.ticket import Ticket
from app.models.ticket_comment import TicketComment

# Import authentication routes
from app.routes import auth, tickets, departments 

# Import ticket history model for audit trail table creation
from app.models.ticket_history import TicketHistory

# Import departments for better tracking
from app.models.department import Department

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

# Register authentication routes with FastAPI
app.include_router(auth.router)
app.include_router(tickets.router)
app.include_router(departments.router)

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