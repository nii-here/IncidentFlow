# IncidentFlow

IncidentFlow is a full-stack internal IT support and systems monitoring platform built with FastAPI, PostgreSQL, and Docker. It enables organizations to manage employees, departments, support tickets, assignments, SLA deadlines, and complete audit history through a secure role-based system.

⸻

Features

* User registration and login
* JWT Authentication
* Role-based access control
* Employee, IT Staff, and IT Admin roles
* Department management
* Ticket creation and assignment
* Ticket status updates
* Ticket comments
* Ticket history / audit trail
* Ticket archiving instead of deletion
* SLA due dates based on ticket priority
* Dashboard summary metrics
* Pagination and sorting
* PostgreSQL database
* Alembic database migrations
* Docker Compose support

⸻

Tech Stack

* Python
* FastAPI
* PostgreSQL
* SQLAlchemy
* Alembic
* Docker
* JWT Authentication
* Pydantic

⸻

Project Structure

IncidentFlow/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── database/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── main.py
│   └── requirements.txt
├── docker-compose.yml
└── README.md

⸻

API Highlights

Method	Endpoint	Description
POST	/auth/register	Register a new user
POST	/auth/login	Login and receive JWT token
PATCH	/auth/users/{user_id}/admin-update	Update a user’s role or department
POST	/departments/	Create a department
GET	/departments/	Retrieve all departments
POST	/tickets/	Create a support ticket
GET	/tickets/	View all tickets with filtering, pagination, and sorting
GET	/tickets/my	View the current user’s tickets
PATCH	/tickets/{ticket_id}/status	Update ticket status
PATCH	/tickets/{ticket_id}/assign	Assign a ticket to IT staff
POST	/tickets/{ticket_id}/comments	Add a ticket comment
GET	/tickets/{ticket_id}/comments	View ticket comments
GET	/tickets/{ticket_id}/history	View ticket audit history
PATCH	/tickets/{ticket_id}/archive	Archive a ticket
GET	/tickets/metrics/summary	Dashboard metrics

⸻

Running Locally

Clone the repository

git clone https://github.com/nii-here/IncidentFlow.git
cd IncidentFlow

Start PostgreSQL

docker compose up -d

Navigate to the backend

cd backend

Create a virtual environment

python -m venv venv

Activate the virtual environment

macOS / Linux

source venv/bin/activate

Windows

venv\Scripts\activate

Install dependencies

pip install -r requirements.txt

Run database migrations

alembic upgrade head

Start the FastAPI server

uvicorn app.main:app --reload

Open the API documentation

http://127.0.0.1:8000/docs

⸻

Roadmap

* React Admin Dashboard
* Employee Self-Service Portal
* Email Notifications
* File Attachments
* Real-time Ticket Updates (WebSockets)
* Asset Management
* Advanced Search & Filtering
* Unit Tests
* Integration Tests
* Production Deployment (Docker + Nginx)

⸻

License

This project is licensed under the MIT License.

⸻

Author

Clement Nii Tetteh

GitHub: https://github.com/nii-here