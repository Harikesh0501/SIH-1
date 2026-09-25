---
title: RAKSHAK-AAYUSH Defense Backend
emoji: 🛡️
colorFrom: gray
colorTo: zinc
sdk: docker
app_port: 7860
pinned: false
---

# RAKSHAK-AAYUSH (रक्षा-आयुष)
## AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces
### SIH Problem Statement ID: 26186

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.6-black.svg)](https://nextjs.org/)
[![Expo SDK 52](https://img.shields.io/badge/Expo-SDK%2052-darkblue.svg)](https://expo.dev/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL%20Serverless-00E599.svg)](https://neon.tech/)
[![Brevo Email API](https://img.shields.io/badge/Brevo-Transactional%20OTP-0B99FF.svg)](https://brevo.com/)

---

## 🛡️ Executive Summary
RAKSHAK-AAYUSH is a mission-critical, AI-driven defense personnel stress, fatigue, and welfare monitoring system engineered specifically for Central Armed Police Forces (CRPF, BSF, ITBP, CISF, SSB, Assam Rifles) and the Indian Armed Forces.

### Key Capabilities
- **Multi-Factor Stress Prediction Engine**: Trained on 3,000 transparent operational records (`scikit-learn` GradientBoosting & RandomForest with $R^2 \ge 0.96$).
- **Explainable AI (XAI)**: 5-Factor SHAP-calibrated feature attribution and bilingual clinical narratives (Hindi & English).
- **Crisis NLP Shield**: Real-time acute distress keyword screening across Hindi, Hinglish, and English with auto-triage dispatch.
- **Strict Role-Based Access Control (RBAC)**: 4 discrete clearance levels:
  1. **Field Jawan**: 15s micro check-in, BLE SmartBand vitals, AI Sathi & 4-7-8 Pranayama, Leave application.
  2. **Medical & Welfare Officer**: Priority clinical triage queue, 5-Factor XAI dossiers, intervention lifecycle dispatch.
  3. **Commanding Officer**: Battalion Readiness KPI gauge, $k$-Anonymized heatmap ($k \ge 5$), Workload simulator.
  4. **Audit Administrator**: Zero-trust SHA-256 tamper ledger, APAR quarantine firewall, offline sync ledger.
- **Statutory Decoupling (DPDPA 2023 §14 & MHA §21)**: Psychological data is cryptographically quarantined and decoupled from official promotion/service records (APAR).
- **Two-Step Brevo Email OTP Authentication**: Defense personnel register with official credentials and receive high-security one-time passcodes via Brevo transactional email.

---

## 🚀 Environment Variables (Hugging Face Spaces / Vercel)

Configure the following variables in Hugging Face Space Settings -> **Variables and secrets**:

| Secret Key | Description | Example / Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL Serverless Connection URI | `postgresql://neondb_owner:***@ep-icy-grass-az6t5nnw-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `BREVO_API_KEY` | Brevo Transactional Email REST API Key | `xkeysib-***` |
| `BREVO_SENDER_EMAIL` | Verified Brevo Sender Email | `cutegirlxxx038@gmail.com` |
| `BREVO_SENDER_NAME` | Display Name for Transactional Emails | `RAKSHAK-AAYUSH Portal` |
| `PORT` | Listening Port for Hugging Face | `7860` |

---

## 🏃 Local Development

### 1. Backend Service (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Web Portal (Next.js 16)
```bash
cd frontend
npm install
npm run dev
# Access portal at http://localhost:3000
```

### 3. Mobile Native App (Expo React Native)
```bash
cd mobile
npm install
npx expo start
# Press 'w' for Expo Web or scan QR code via Expo Go app
```

---

## 🧪 Verification & Automated Testing
```bash
# Run complete test suite against Neon PostgreSQL
python -m pytest backend/ -v
# Mobile TypeScript and Web Bundler Checks
cd mobile && npm run typecheck && npm run build:web
# Next.js Production Build
cd frontend && npm run build
```
