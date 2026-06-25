<div align="center">

# 🔧 IncidentFlow

**A full-stack internal IT support and systems monitoring platform**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

-----

IncidentFlow enables organizations to manage employees, departments, support tickets, assignments, SLA deadlines, and complete audit history through a secure role-based system.

-----

## ✨ Features

|Category             |Details                                                                                                |
|---------------------|-------------------------------------------------------------------------------------------------------|
|**Auth & Access**    |JWT authentication, user registration & login, role-based access control (Employee, IT Staff, IT Admin)|
|**Ticket Management**|Create, assign, update status, comment, archive, and full audit trail                                  |
|**SLA & Metrics**    |Priority-based SLA due dates, dashboard summary metrics                                                |
|**Data & Infra**     |PostgreSQL, Alembic migrations, Docker Compose, pagination & sorting                                   |

-----

## 🛠 Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL, Alembic
- **Auth:** JWT
- **Infrastructure:** Docker, Docker Compose

-----

## 📁 Project Structure

```
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
```

-----

## 🔌 API Highlights

|Method |Endpoint                            |Description                                             |
|-------|------------------------------------|--------------------------------------------------------|
|`POST` |`/auth/register`                    |Register a new user                                     |
|`POST` |`/auth/login`                       |Login and receive JWT token                             |
|`PATCH`|`/auth/users/{user_id}/admin-update`|Update a user’s role or department                      |
|`POST` |`/departments/`                     |Create a department                                     |
|`GET`  |`/departments/`                     |Retrieve all departments                                |
|`POST` |`/tickets/`                         |Create a support ticket                                 |
|`GET`  |`/tickets/`                         |View all tickets with filtering, pagination, and sorting|
|`GET`  |`/tickets/my`                       |View the current user’s tickets                         |
|`PATCH`|`/tickets/{ticket_id}/status`       |Update ticket status                                    |
|`PATCH`|`/tickets/{ticket_id}/assign`       |Assign a ticket to IT staff                             |
|`POST` |`/tickets/{ticket_id}/comments`     |Add a ticket comment                                    |
|`GET`  |`/tickets/{ticket_id}/comments`     |View ticket comments                                    |
|`GET`  |`/tickets/{ticket_id}/history`      |View ticket audit history                               |
|`PATCH`|`/tickets/{ticket_id}/archive`      |Archive a ticket                                        |
|`GET`  |`/tickets/metrics/summary`          |Dashboard metrics                                       |

-----

## 🚀 Running Locally

**1. Clone the repository**

```bash
git clone https://github.com/nii-here/IncidentFlow.git
cd IncidentFlow
```

**2. Start PostgreSQL**

```bash
docker compose up -d
```

**3. Set up the backend**

```bash
cd backend
python -m venv venv
```

**4. Activate the virtual environment**

macOS / Linux:

```bash
source venv/bin/activate
```

Windows:

```bash
venv\Scripts\activate
```

**5. Install dependencies**

```bash
pip install -r requirements.txt
```

**6. Run database migrations**

```bash
alembic upgrade head
```

**7. Start the server**

```bash
uvicorn app.main:app --reload
```

**8. Open the API docs**

Navigate to <http://127.0.0.1:8000/docs>

-----

## 🗺 Roadmap

- [ ] React Admin Dashboard
- [ ] Employee Self-Service Portal
- [ ] Email Notifications
- [ ] File Attachments
- [ ] Real-time Ticket Updates (WebSockets)
- [ ] Asset Management
- [ ] Advanced Search & Filtering
- [ ] Unit & Integration Tests
- [ ] Production Deployment (Docker + Nginx)

-----

## 📄 License

This project is licensed under the [MIT License](LICENSE).

-----

## 👤 Author

**Clement Nii Tetteh**

[![GitHub](https://img.shields.io/badge/GitHub-nii--here-181717?style=flat&logo=github)](https://github.com/nii-here)