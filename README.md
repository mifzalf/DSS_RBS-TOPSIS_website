# DSS_RBS-TOPSIS_website
RBS-TOPSIS Decision Support System  A generic web-based Decision Support System (DSS) framework  that combines Rule-Based System and TOPSIS for multi-criteria  decision making.  The system is designed to be flexible and adaptable for  various decision-making scenarios.

## Overview

Decision Support Systems are widely used to assist decision makers in situations involving multiple criteria and complex conditions.  

This project integrates two approaches:

1. **Rule-Based System (RBS)**  
   Used for filtering or classifying alternatives based on predefined rules.

2. **TOPSIS Method**  
   Used to rank alternatives by measuring their distance from the ideal positive and negative solutions.

By combining both approaches, the system can:

- Filter candidates using logical rules
- Rank the qualified candidates based on multiple criteria
- Generate structured and objective recommendations

## Features

- Multi-criteria decision analysis
- Rule-based filtering mechanism
- TOPSIS ranking algorithm
- Web-based interface
- Flexible criteria and weighting system
- Adaptable for multiple decision-making scenarios

# System Workflow

The decision process in this system follows these stages:

Input Data
↓
Rule-Based System (Filtering)
↓
Candidate Selection
↓
TOPSIS Calculation
↓
Ranking Result
↓
Recommendation Output

## Tech Stack

Frontend:
- React (Vite)

Backend:
- Node.js
- Express.js

Database:
- MySQL

Other Tools:
- REST API
- Git & GitHub

## Recommendation Endpoint

Backend kini menyediakan endpoint resmi untuk menjalankan proses RBS + TOPSIS secara sinkron:

- **POST `/recommendations/decision-model/:decisionModelId`** – menjalankan rule engine dan TOPSIS untuk model keputusan tertentu. Parameter URL adalah ID decision model.
- Tambahkan query `?clear=true` bila ingin menghapus hasil lama sebelum perhitungan baru.
- Respons berisi ringkasan jumlah data yang diproses beserta array hasil terbaru. Data lengkap tetap dapat diambil melalui endpoint `/results/decision-model/:id`.

Contoh pemanggilan:

```bash
curl -X POST http://localhost:3000/recommendations/decision-model/1
```

## Author

Muhammad Ifzal Faidurrahman  
Diploma in Informatics Engineering  
Politeknik Elektronika Negeri Surabaya

---

## License

This project is intended for educational and research purposes.
