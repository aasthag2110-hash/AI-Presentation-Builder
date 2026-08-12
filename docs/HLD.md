# AI Presentation Builder — High Level Design

## 1. Overview

The AI Presentation Builder is a microservice-based platform that
generates presentations from user prompts and documents.

The system consists of:

- Web application
- API Gateway
- Presentation Service
- AI Service
- Document Service
- PostgreSQL database

Each service is independently containerized and communicates with
other services through HTTP APIs.

---

## 2. Architecture

```mermaid
flowchart TD

    User["User / Browser"]

    Web["Web App<br/>Port 3000"]

    Gateway["API Gateway<br/>Port 8080"]

    Presentation["Presentation Service<br/>Port 8081"]

    AI["AI Service<br/>Port 8082"]

    Document["Document Service<br/>Port 8083"]

    DB[("PostgreSQL<br/>Port 5432")]

    User --> Web

    Web --> Gateway

    Gateway --> Presentation
    Gateway --> Document

    Presentation --> AI
    Presentation --> Document
    Presentation --> DB