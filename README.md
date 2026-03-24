# RBS–TOPSIS Decision Support System

A web-based Decision Support System (DSS) framework that integrates a **Rule-Based System (RBS)** with the **TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)** method for multi-criteria decision making.

This backend service provides secure authentication, role-based authorization per decision model, and a complete recommendation pipeline that can be seamlessly integrated with a frontend application.

---

## 🚀 Key Features

- Full CRUD operations for:
  - Decision Models
  - Members (Owner / Editor / Viewer)
  - Criteria & Sub-criteria
  - Alternatives & Evaluations
  - Rules & Rule Conditions
- JWT-based authentication (Register & Login)
- Role-based authorization per decision model
- Integrated **RBS → TOPSIS recommendation pipeline**
- RESTful API ready for frontend integration
- Modular and scalable backend architecture

---

## 🧠 System Overview

This system is designed as a **generic Decision Support System framework**, allowing it to be applied to various decision-making scenarios.

### Decision Flow

Input Data  
→ Rule-Based System (Filtering / Classification)  
→ Candidate Alternatives  
→ TOPSIS Calculation  
→ Ranking Results  
→ Stored Recommendations  

### Core Concept

- **Rule-Based System (RBS)**  
  Used for filtering or classifying alternatives based on logical conditions.

- **TOPSIS Method**  
  Used for ranking alternatives based on their distance to ideal solutions.

---

## 🏗️ Backend Architecture

The backend is structured using a layered architecture:

### 1. Authentication Layer

- POST /auth/register  
- POST /auth/login  

Returns a JWT token for accessing protected endpoints.

---

### 2. User Context

Middleware: currentUser

- Extracts user information from JWT  
- Attaches user data to the request  

---

### 3. Authorization Layer

Middleware: authorizeDecisionModel

- Ensures access based on roles:
  - Owner  
  - Editor  
  - Viewer  

---

### 4. Controller Layer

- Handles business logic  
- Keeps controllers clean by delegating validation and authorization  

---

### 5. Recommendation Engine

Located in the service layer:

- Rule Engine Service  
  Filters or classifies alternatives  

- TOPSIS Service  
  Computes preference scores and ranking  

- Recommendation Service  
  Executes full pipeline:  
  RBS → TOPSIS → Result Storage  

---

## 🛠️ Tech Stack

- Backend: Node.js, Express.js  
- Database: MySQL (Sequelize ORM)  
- Authentication: JWT, bcrypt  
- Other Tools:
  - dotenv  
  - helmet  
  - cors  
  - morgan  

---

## ⚙️ Getting Started

cd backend  
npm install  
cp .env.example .env  
npm run start  

### Environment Variables

PORT=  
DB_HOST=  
DB_NAME=  
DB_USERNAME=  
DB_PASSWORD=  
JWT_SECRET=  
JWT_EXPIRES_IN=  

---

## 🔐 Authentication & Roles

1. Register or login to get a JWT token  
2. Include token in request headers:

Authorization: Bearer <TOKEN>

3. Decision model roles:

- Owner → full access  
- Editor → modify data  
- Viewer → read-only access  

---

## 👥 Member Management (Owner Only)

- GET /decision-model/:decisionModelId/members  
- POST /decision-model/:decisionModelId/members  
- PATCH /decision-model/:decisionModelId/members/:memberId  
- DELETE /decision-model/:decisionModelId/members/:memberId  

---

## 📊 Recommendation API

### Run Recommendation

POST /recommendations/decision-model/:decisionModelId  

Optional query:

?clear=true  

Clears previous results before recalculation.

---

### Example Request

curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/recommendations/decision-model/1

---

### Get Results

GET /results/decision-model/:decisionModelId  

---

## 📁 Project Structure

backend/  
│  
├── controllers/        # Business logic  
├── routes/             # API endpoints  
├── middleware/         # Authentication & authorization  
├── services/           # RBS, TOPSIS, recommendation logic  
├── models/             # Sequelize models & relations  
├── utils/              # Helper utilities  
└── config/             # Configuration files  

---

## 🔮 Future Improvements

- Automated testing (Jest / Supertest)  
- Dynamic rule builder (UI-based)  
- Analytical dashboard & visualization  
- Support for additional decision methods (AHP, SAW, etc.)  

---

## 👨‍💻 Author

Muhammad Ifzal Faidurrahman  
Diploma in Informatics Engineering  
Politeknik Elektronika Negeri Surabaya  

---

## 📄 License

This project is intended for educational and research purposes.