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
→ Rule-Based System (Classification / Eligibility Decision)  
→ Grouped Alternatives by Assistance Category  
→ TOPSIS per Ranked Category Only  
→ Grouped Ranking Results  
→ Stored Recommendations  

### Core Concept

- **Rule-Based System (RBS)**  
  Used to classify each alternative into a final assistance category such as `PKH`, `Sembako`, or `Not eligible`.

- **TOPSIS Method**  
  Used only for categories that are eligible for ranking. Rejected categories do not go through TOPSIS.

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
  RBS → Category Grouping → TOPSIS per Eligible Group → Result Storage  

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

This endpoint now uses a grouped recommendation contract.

- RBS runs first and classifies each alternative into a category
- categories with `action_type = assign_benefit` are ranked with TOPSIS
- categories with `action_type = reject` are returned as rejected and do not receive TOPSIS scores or ranks
- previous stored results for the same decision model are replaced automatically in one transaction

---

### Example Request

curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3000/recommendations/decision-model/1

---

### Response Contract

The primary payload is grouped by category.

```json
{
  "message": "Recommendation generated successfully",
  "data": {
    "ranked_groups": [
      {
        "category": "PKH",
        "action_type": "assign_benefit",
        "status": "ranked",
        "items": [
          {
            "alternative": {
              "id": 1,
              "name": "Citizen A"
            },
            "preference_score": 0.91,
            "rank": 1,
            "status": "ranked"
          }
        ]
      }
    ],
    "rejected_groups": [
      {
        "category": "Not eligible",
        "action_type": "reject",
        "status": "rejected",
        "items": [
          {
            "alternative": {
              "id": 2,
              "name": "Citizen B"
            },
            "preference_score": null,
            "rank": null,
            "status": "rejected"
          }
        ]
      }
    ]
  },
  "meta": {
    "decisionModel": {
      "id": 1,
      "name": "Social Aid Model"
    },
    "count": 2,
    "flat_results": [
      {
        "decision_model_id": 1,
        "alternative_id": 1,
        "category": "PKH",
        "preference_score": 0.91,
        "rank": 1,
        "status": "ranked"
      },
      {
        "decision_model_id": 1,
        "alternative_id": 2,
        "category": "Not eligible",
        "preference_score": null,
        "rank": null,
        "status": "rejected"
      }
    ]
  }
}
```

#### Meaning of the response

- `data.ranked_groups` contains only categories that go through TOPSIS
- `data.rejected_groups` contains categories that are rejected directly by RBS
- `meta.flat_results` is included for debugging, export, or compatibility use cases
- `rank` is local to each ranked category, not global across the whole decision model

#### Rule action types

- `assign_benefit` → category is eligible for TOPSIS ranking
- `reject` → category is final and does not go through TOPSIS

#### Fallback behavior

If an alternative does not match any rule, the backend assigns:

- `category = "Not eligible"`
- `action_type = "reject"`
- `status = "rejected"`

This guarantees deterministic recommendation output.

---

### Get Results

GET /results/decision-model/:decisionModelId  

---

## 📁 Project Structure

backend/  
│  
├── controller/         # HTTP controllers  
├── routes/             # API endpoints  
├── middleware/         # Authentication, authorization, validation  
├── service/            # RBS, TOPSIS, recommendation logic  
├── models/             # Sequelize models & relations  
├── utils/              # Shared utilities  
├── validation/         # Request schemas  
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
