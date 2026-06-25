# this file is the bridge between FastAPI and PostgreSQL

# app/database/db.py

# Import built-in Python package for environment variables
import os

# Loads variables from the .env file
from dotenv import load_dotenv

# SQLAlchemy tools for database connection and ORM setup
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


# --------------------------------------------------
# Load environment variables from .env
# --------------------------------------------------
load_dotenv()


# --------------------------------------------------
# Get the database URL from the .env file
# Example:
# postgresql://user:password@localhost:5432/db_name
# --------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")


# --------------------------------------------------
# Create the SQLAlchemy database engine
# This is the core connection to PostgreSQL
# --------------------------------------------------
engine = create_engine(DATABASE_URL)


# --------------------------------------------------
# Create a session factory
# Each API request will use its own database session
# --------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# --------------------------------------------------
# Base class for all database models
# Example:
# class User(Base):
# --------------------------------------------------
Base = declarative_base()


# --------------------------------------------------
# Dependency function for getting DB sessions
# FastAPI will use this in routes later
# --------------------------------------------------
def get_db():

    # Create a new database session
    db = SessionLocal()

    try:
        yield db

    finally:
        # Always close the session after request finishes
        db.close()