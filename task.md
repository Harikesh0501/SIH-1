# SIH 26186: RAKSHAK-AAYUSH (रक्षा-आयुष)
## AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces
### Master Architecture, Deep Problem Statement Feature Mapping, and Exhaustive Task Breakdown

**System Name**: **RAKSHAK-AAYUSH** (रक्षा-आयुष) — *Operational Stress Intelligence & Welfare Monitoring System for Uniformed Forces*  
**Problem Statement ID**: **SIH 26186** | **Ministry of Home Affairs / CAPFs / Armed Forces**  
**Applicability**: Central Armed Police Forces (CRPF, BSF, CISF, ITBP, SSB, Assam Rifles), Indian Armed Forces (Army, Navy, Air Force), State Police Forces, Disaster Response Forces (NDRF/SDRF).

---

## 1. Problem Statement Requirements to Technical Features Traceability Matrix

| Problem Statement Requirement (SIH 26186) | RAKSHAK-AAYUSH Architectural Feature | Primary Role / Access Guard |
| :--- | :--- | :--- |
| **1. HRMS Operational Data Analysis**<br>• Leave patterns & cancellation history<br>• Deployment history & continuous operational days<br>• Duty schedules (night shifts, ambush patrols)<br>• Transfer frequency & zone severity<br>• Training commitments & workload trends | **Multi-Modal Feature Extraction Engine**<br>• `Personnel`, `DutyRoster`, `LeaveRecord` database tables<br>• Automated calculation of continuous days in high-stress zones, leave cancellation ratio, and shift volatility index | **System & Data Ingestion Engine**<br>(Read by ML Engine, Aggregated for CO, Unmasked for Welfare Officer) |
| **2. Optional Self-Reporting & Wellness Assessments**<br>• 15-second daily check-in<br>• Standardized psychometric screening (PHQ-4 / military burnout)<br>• Emotional fatigue, mood, sleep quality ratings<br>• Voluntary self-journaling | **Soldier Self-Service Web Enclave**<br>• 15-second visual mood & fatigue check-in<br>• Standardized PHQ-4 screener<br>• Sleep duration & quality evaluation<br>• Crisis NLP keyword scanner on voluntary notes | **Jawan Portal (Isolated)**<br>(Strictly decoupled from APAR/ACR; no superior officer can view raw answers) |
| **3. Voluntary Biometrics & Wearable Integration**<br>• Resting Heart Rate (RHR)<br>• Heart Rate Variability (HRV RMSSD)<br>• Sleep duration & sleep cycle architecture<br>• Activity deficit & physiological strain index | **Wearable Telemetry Sync Engine**<br>• `BiometricLog` table & SmartBand sync API<br>• Autonomic Nervous System (ANS) recovery calculation<br>• HRV depression alert trigger | **Jawan Portal & Welfare Medical Officer**<br>(Voluntary data with opt-in status) |
| **4. Behavioral Stress Pattern Detection & Predictive AI**<br>• Early detection of stress, emotional fatigue & burnout<br>• Dual-tier predictive modeling (Classifier & Time-to-exhaustion)<br>• Explainable AI (XAI) feature attribution (SHAP-style) | **Military Predictive Behavioral Engine**<br>• Gradient Boosting & Random Forest models<br>• 4 Risk Tiers: *Resilient, Fatigued, Vulnerable, Critical*<br>• Mathematical percentage attribution across 5 stress drivers | **AI Engine & Welfare Desk**<br>(Surfaces actionable drivers to authorized officers) |
| **5. Automated Welfare Recommendations & Interventions**<br>• Prescriptive welfare recommendations<br>• Proactive counseling & buddy pairing<br>• Mandatory R&R leave sanctioning<br>• Clinical follow-up workflow | **Welfare Intervention Dispatch Desk**<br>• Prescriptive recommendation engine<br>• `WelfareIntervention` lifecycle: `Recommended` → `Approved` → `In-Progress` → `Resolved`<br>• Confidential clinical notes journal | **Welfare & Medical Officer Desk**<br>(Only authorized medical personnel) |
| **6. Workload Rebalancing & Duty Rotation Optimization**<br>• Assists commanders in optimizing workload<br>• Reduces fatigue-induced operational breakdowns<br>• Predictive What-If simulation | **Battalion Workload Rebalancing Simulator**<br>• What-If rotation slider & leave quota rebalancer<br>• Live mathematical calculation of burnout drop % and operational readiness gain % | **Commanding Officer Portal**<br>(Aggregated company level) |
| **7. Privacy-Preserving Architecture & Ethical Governance**<br>• Cryptographic APAR/ACR decoupling<br>• k-Anonymity aggregation for commanders<br>• Immutable cryptographic audit trail<br>• Non-punitive, trust-building welfare guarantee | **Privacy & Governance Enclave**<br>• Cryptographic firewall preventing appraisal linkage<br>• k-Anonymity filter on commander endpoints (k ≥ 5)<br>• Immutable `AuditLog` table capturing all accesses | **Security & Audit Officer Portal**<br>(Independent audit oversight) |
| **8. Emergency Crisis Response & Psychological First-Aid**<br>• Acute distress detection in real-time<br>• Immediate emergency red-flag notifications<br>• 24/7 empathetic psychological companion | **AI Sathi (साथी) & Tele-MANAS SOS Enclave**<br>• Crisis keyword NLP scanner (English, Hindi, Hinglish)<br>• Conversational psychological first-aid companion<br>• One-tap direct dialer to Tele-MANAS (`14416`) | **Jawan Portal & Emergency Dispatch** |

---

## 2. Institutional Government Design System Standards

- **Primary Brand Color**: **Emerald Ink (`#064E3B`)** — Signifies discipline, command authority, operational stability, and official defense governance.
- **Secondary & Accent Color**: **Champagne (`#F8E7C9`)** — Signifies welfare, warmth, institutional care, and soldier well-being.
- **Surface & Background Colors**:
  - Main Page Background: Light Champagne (`#FEFBF5`)
  - Component Cards & Panels: Pure White (`#FFFFFF`)
  - Structural Borders: Slate Neutral (`#E2E8F0`, `#CBD5E1`)
  - Primary Text: Deep Slate Neutral (`#0F172A`)
  - Subdued Text: Muted Slate (`#64748B`)
- **Component Design Paradigm**:
  - Strictly **Government / Defense Institutional Grade** (inspired by `shadcn/ui`, India's NIC MeghRaj, and defense command centers).
  - Clean 1px borders, subtle drop shadows, high contrast for operations rooms, clean typography hierarchy (`Inter` for English, `Noto Sans Devanagari` for Hindi).
  - **Zero dark-mode gaming aesthetics, zero neon glows, zero gimmicks.**

---

## 3. Exhaustive Epics, Tasks, and Mini-Tasks Breakdown

### Epic 1: Database Architecture, Relational Schema & Real Data Persistence
- [x] **Task 1.1: Database Engine & Relational Schema Modeling**
  - [x] Mini-task 1.1.1: Setup SQLAlchemy engine with SQLite backend (`backend/rakshak_aayush.db`), configured with connection pooling and WAL journal mode for ACID concurrency.
  - [x] Mini-task 1.1.2: Design `User` model with fields: `id`, `username` (Service ID), `hashed_password` (`bcrypt`), `role` (`Commanding Officer`, `Welfare Officer`, `Jawan`, `Audit Admin`), `full_name`, `rank`, `company`, `created_at`, `is_active`.
  - [x] Mini-task 1.1.3: Design `Personnel` model with complete military operational attributes:
    - Service Number, Masked ID, Full Name, Rank, Company, Platoon, Operational Role
    - Deployment Zone (e.g., *Bastar FOB (LWE)*, *Kargil Ridge (High Alt)*, *Valley Post*, *Peace Depot*)
    - Deployment Type (e.g., *High-Intensity CI*, *High-Altitude Border*, *Static Security*, *Peace Station*)
    - Days in Current Zone, Consecutive Night Duties, Leave Cancellations Count, Months Since Last Leave
    - Transfer Frequency Count, Masked Phone Number
    - AI Predicted Stress Score (0-100), Risk Level Tier, Explainable Drivers JSON
  - [x] Mini-task 1.1.4: Design `DutyRoster` model: `id`, `personnel_id`, `date`, `shift_type` (Night Ambush, Day Patrol, QRT Standby, Perimeter Guard), `is_night_duty`, `hours_on_duty`, `risk_level`.
  - [x] Mini-task 1.1.5: Design `LeaveRecord` model: `id`, `personnel_id`, `leave_type` (Casual Leave, Earned Leave, Emergency R&R, Medical), `days_requested`, `start_date`, `end_date`, `status` (Sanctioned, Cancelled, Deferred, Completed), `cancellation_reason`, `personal_reason`.
  - [x] Mini-task 1.1.6: Design `WellnessAssessment` model: `id`, `personnel_id`, `timestamp`, `mood_score` (1-5), `sleep_hours`, `sleep_quality` (1-5), `physical_exhaustion` (1-5), `mental_stress_rating` (1-5), `phq4_score` (0-12), `voluntary_notes`, `is_offline_synced`, `synced_at`.
  - [x] Mini-task 1.1.7: Design `BiometricLog` model: `id`, `personnel_id`, `timestamp`, `resting_heart_rate` (bpm), `hrv_rmssd` (ms), `sleep_duration_hours`, `deep_sleep_pct`, `stress_biomarker_index`, `sync_source`.
  - [x] Mini-task 1.1.8: Design `WelfareIntervention` model: `id`, `personnel_id`, `intervention_type` (Mandatory R&R Leave, Tele-Counseling, Peer Buddy, Duty Rotation, Medical Review), `priority` (Routine, Elevated, Urgent - Critical), `status` (Recommended, Approved by CO, In-Progress, Completed, Deferred), `recommended_by`, `assigned_counselor`, `action_details`, `clinical_notes`, `created_at`, `resolved_at`.
  - [x] Mini-task 1.1.9: Design `AuditLog` model: `id`, `timestamp`, `user_role`, `actor_id`, `action`, `target_entity`, `target_id`, `classification`, `details`, `ip_address`, `tamper_hash`.

- [x] **Task 1.2: Inspectable Military Training Dataset & Seeding Engine**
  - [x] Mini-task 1.2.1: Generate a visible, inspectable CSV training dataset file at `backend/data/military_stress_training_data.csv` containing 3,000 calibrated military operational and wellness records (featuring deployment days, leave denials, shift volatility, sleep deficits, HRV, and stress scores).
  - [x] Mini-task 1.2.2: Implement `backend/seed_data.py` populating 4 realistic operational companies (Alpha, Bravo, Charlie, Delta) with 60+ soldiers across varied terrain outposts.
  - [x] Mini-task 1.2.3: Seed pre-configured default credentials for all 4 roles (`CO-104-SHARMA`, `MED-104-MALHOTRA`, `CT-RAMESH-84920`, `AUDIT-HQ-OFFICER`).
  - [x] Mini-task 1.2.4: Seed 7-day historical duty shifts, historical leave applications/cancellations, and biometric logs for all flagship demo soldiers.

---

### Epic 2: True Role-Based Access Control (RBAC) & Authentication Gateway
- [x] **Task 2.1: Cryptographic JWT Authentication & Security Engine**
  - [x] Mini-task 2.1.1: Implement password hashing and verification using `bcrypt`.
  - [x] Mini-task 2.1.2: Implement JWT token creation with HS256 algorithm, 24-hour expiration, and embedded role claims (`user_id`, `role`, `service_number`, `company`).
  - [x] Mini-task 2.1.3: Build `POST /api/auth/login` endpoint that authenticates credentials, logs the login to audit trail, and returns JWT bearer token + user profile.
  - [x] Mini-task 2.1.4: Build `GET /api/auth/me` endpoint returning the verified token owner's permissions and profile.
  - [x] Mini-task 2.1.5: Build `POST /api/auth/logout` endpoint that invalidates session and writes an audit event.

- [x] **Task 2.2: Route Authorization Guards & Privacy Middleware**
  - [x] Mini-task 2.2.1: Create reusable FastAPI dependency `get_current_user` extracting and verifying the JWT bearer token.
  - [x] Mini-task 2.2.2: Create role-check dependency factory `require_role(["Commanding Officer", "Welfare Officer"])` returning HTTP 403 Forbidden for unauthorized requests.
  - [x] Mini-task 2.2.3: Restrict `/api/welfare/*` endpoints strictly to users with `Welfare Officer` role.
  - [x] Mini-task 2.2.4: Restrict `/api/commander/*` endpoints strictly to users with `Commanding Officer` role.
  - [x] Mini-task 2.2.5: Restrict `/api/jawan/*` endpoints so soldiers can strictly access their own records (`target_personnel_id == token.user_id`).
  - [x] Mini-task 2.2.6: Enforce automated audit logging inside a custom FastAPI middleware for all mutating (`POST`, `PATCH`, `DELETE`) and sensitive query requests.

---

### Epic 3: Machine Learning Engine with Transparent Dataset & Explainable AI (XAI)
- [x] **Task 3.1: Supervised ML Model Training from Transparent CSV**
  - [x] Mini-task 3.1.1: Implement dataset loader in `backend/ml_engine.py` that reads directly from `backend/data/military_stress_training_data.csv`.
  - [x] Mini-task 3.1.2: Preprocess operational features (deployment duration, zone severity, leave denials, shift volatility) and wellness features (mood, sleep, HRV, PHQ-4).
  - [x] Mini-task 3.1.3: Train `GradientBoostingRegressor` and `RandomForestRegressor` models with hyperparameter tuning (calibrated against published military ergonomics and combat fatigue data).
  - [x] Mini-task 3.1.4: Implement risk classification logic into 4 discrete tiers:
    - *Resilient*: Score 0 to 39.9
    - *Fatigued*: Score 40.0 to 64.9
    - *Vulnerable*: Score 65.0 to 79.9
    - *Critical*: Score 80.0 to 100.0

- [x] **Task 3.2: Explainable AI (XAI) Feature Attribution Engine**
  - [x] Mini-task 3.2.1: Implement SHAP-inspired mathematical feature attribution decomposing predicted stress into 5 distinct categories:
    1. Operational Deployment Duration & Terrain Severity Impact (%)
    2. Leave Cancellation & Family Separation Impact (%)
    3. Nocturnal Ambush & Shift Volatility Impact (%)
    4. Sleep Deficit & HRV Biomarker Strain Impact (%)
    5. Psychological Fatigue & Low Mood Impact (%)
  - [x] Mini-task 3.2.2: Generate dynamic English executive clinical narratives summarizing primary stress drivers.
  - [x] Mini-task 3.2.3: Generate dynamic Hindi (हिंदी) clinical narratives for bilingual reporting.

- [x] **Task 3.3: Emergency NLP Crisis Scanner & Prescriptive Intervention Engine**
  - [x] Mini-task 3.3.1: Build regex-based multi-lingual keyword scanner for acute psychological distress cues in voluntary notes (English, Hindi, Hinglish).
  - [x] Mini-task 3.3.2: If crisis keyword is detected, automatically escalate score to ≥88 (Critical) and generate immediate clinical triage alert.
  - [x] Mini-task 3.3.3: Build prescriptive recommendation synthesizer that maps top risk drivers to concrete operational actions:
    - High leave cancellations (>2) → Sanction 10-day Mandatory R&R Leave.
    - High consecutive nights (>7) → Rotate to daytime administrative post for circadian reset.
    - Elevated PHQ-4 / psychological distress → Assign Peer-Support Buddy & Base Hospital Counselor.
    - Crisis cue detected → Immediate Clinical Triage with 24/7 buddy watch and Tele-MANAS linkage.

---

### Epic 4: 100% Dynamic RESTful API Backend (Zero Hardcoding)
- [x] **Task 4.1: Commander Analytics & Strategic Endpoints**
  - [x] Mini-task 4.1.1: `GET /api/commander/readiness-kpi` — Computes live Force Readiness Index, Average Stress, Critical Cases, and Active Interventions.
  - [x] Mini-task 4.1.2: `GET /api/commander/company-heatmap` — Aggregates company metrics (k-anonymized, no soldier names/IDs), returning strength, average days deployed, leave denials, and risk distribution.
  - [x] Mini-task 4.1.3: `POST /api/commander/simulate-workload` — Dynamic What-If rotation simulator computing burnout reduction % and readiness gain % based on operational fatigue formulas.
  - [x] Mini-task 4.1.4: `GET /api/commander/export-report` — Generates a downloadable structured executive summary of battalion welfare health.

- [x] **Task 4.2: Welfare & Medical Officer Clinical Endpoints**
  - [x] Mini-task 4.2.1: `GET /api/welfare/triage-queue` — Filtered list of personnel by company, risk level, or search query, ordered by stress risk.
  - [x] Mini-task 4.2.2: `GET /api/welfare/personnel/{id}/dossier` — Full unmasked dossier: duty roster, leave history, recent check-ins, biometric logs, and XAI factor breakdown.
  - [x] Mini-task 4.2.3: `POST /api/welfare/interventions` — Dispatches new intervention, assigns counselor, and records action in audit log.
  - [x] Mini-task 4.2.4: `PATCH /api/welfare/interventions/{id}/status` — Updates intervention status (`In-Progress`, `Completed`, `Deferred`) and appends clinical notes.
  - [x] Mini-task 4.2.5: `GET /api/welfare/interventions` — Lists all active and historical interventions across the battalion.

- [x] **Task 4.3: Jawan Self-Reporting, Biometrics & Companion Endpoints**
  - [x] Mini-task 4.3.1: `POST /api/jawan/check-in` — Submits 15-second daily assessment, updates the soldier's live stress score, triggers crisis screening, and logs APAR-decoupled audit record.
  - [x] Mini-task 4.3.2: `POST /api/jawan/sync-biometrics` — Syncs simulated or real smart-band readings (HR, HRV, sleep hours, deep sleep %).
  - [x] Mini-task 4.3.3: `GET /api/jawan/my-history` — Fetches authenticated soldier's past assessments and leave records.
  - [x] Mini-task 4.3.4: `POST /api/jawan/ai-sathi/chat` — Context-aware AI wellness companion providing empathetic support, guided Pranayama breathing, and family leave advice in English & Hindi.
  - [x] Mini-task 4.3.5: `GET /api/jawan/privacy-certificate` — Returns cryptographic proof of APAR decoupling and zero-penalty assurance.

- [x] **Task 4.4: System Governance, Security & Audit Endpoints**
  - [x] Mini-task 4.4.1: `GET /api/audit/logs` — Immutable audit log feed with pagination, filtering by role, action, and date range.
  - [x] Mini-task 4.4.2: `GET /api/audit/compliance-metrics` — System health, k-anonymity verification status, and APAR firewall integrity status.
  - [x] Mini-task 4.4.3: `POST /api/audit/verify-tamper` — Validates cryptographic hashes of the audit trail.

---

### Epic 5: Institutional Government Design System & Reusable UI Primitives
- [x] **Task 5.1: Tailwind Theme & Design Token Architecture**
  - [x] Mini-task 5.1.1: Configure `tailwind.config.js` with Emerald Ink (`#064E3B`) and Champagne (`#F8E7C9`) palette extensions.
  - [x] Mini-task 5.1.2: Enforce institutional typography styles using `Inter` and `Noto Sans Devanagari`.
  - [x] Mini-task 5.1.3: Configure custom scrollbars, selection colors, and subtle border utilities.

- [x] **Task 5.2: Reusable UI Component Primitives (shadcn/ui Inspired)**
  - [x] Mini-task 5.2.1: `Button.jsx` — Primary Emerald Ink, Outline Champagne, Secondary, and Destructive variants with crisp states.
  - [x] Mini-task 5.2.2: `Card.jsx` — Clean white container, 1px slate border (`border-slate-200`), subtle shadow, clean header/content/footer slots.
  - [x] Mini-task 5.2.3: `Badge.jsx` — Standardized risk badges: Resilient (emerald), Fatigued (amber), Vulnerable (orange), Critical (red).
  - [x] Mini-task 5.2.4: `Table.jsx` — Clean table wrapper with zebra striping, hover rows, and monospace identifiers.
  - [x] Mini-task 5.2.5: `Modal.jsx` — Accessible backdrop, clean card modal with close button and smooth transition.
  - [x] Mini-task 5.2.6: `Input.jsx` & `Select.jsx` — Clean form controls with slate borders and Emerald focus rings.
  - [x] Mini-task 5.2.7: `ProgressBar.jsx` — Clean stacked and horizontal percentage meters.

---

### Epic 6: Dedicated Commanding Officer Portal (Strategic & k-Anonymized)
- [x] **Task 6.1: Commander Top Navigation & Operational Scope**
  - [x] Mini-task 6.1.1: Header with Battalion Name (104 Bn CAPF), Ashoka emblem badge, Security Classification (`SECRET - FOR BATTALION COMMANDER USE ONLY`).
  - [x] Mini-task 6.1.2: Navigation tabs: `Battalion Strategic Dashboard`, `What-If Workload Simulator`, `Executive Briefing`.
  - [x] Mini-task 6.1.3: Real-time status indicator showing k-Anonymity compliance (`k-Anonymity Guard: ACTIVE (k≥5)`).

- [x] **Task 6.2: Battalion Strategic Readiness Dashboard**
  - [x] Mini-task 6.2.1: 4 Executive KPI Cards connected to `/api/commander/readiness-kpi`:
    - Force Readiness Index (%) with dynamic progress meter
    - Average Battalion Stress Score (0-100)
    - Acute / Critical Cases Requiring Intervention
    - Active Welfare Actions In-Progress
  - [x] Mini-task 6.2.2: Battalion Deployment & Company Heatmap connected to `/api/commander/company-heatmap`:
    - Rows for Alpha, Bravo, Charlie, Delta companies
    - Deployment zone badge, terrain severity rating, average days deployed
    - Leave cancellation count and stress score badge
    - Horizontal stacked risk distribution bar (Resilient / Fatigued / Vulnerable / Critical)
  - [x] Mini-task 6.2.3: Privacy Notice Box explaining that all troop metrics are aggregated and individual soldier identities cannot be accessed from this terminal.

- [x] **Task 6.3: Operational "What-If" Workload Rebalancing Simulator**
  - [x] Mini-task 6.3.1: Interactive simulation control panel:
    - Company selector dropdown
    - Rotation schedule advancement slider (0 to 30 days earlier)
    - Mandatory R&R leave sanction slider (0 to 20 jawans)
  - [x] Mini-task 6.3.2: Connect to `POST /api/commander/simulate-workload` API to dynamically render:
    - Current vs Projected Company Burnout Score
    - Risk Reduction Percentage (%)
    - Projected Force Readiness Gain (%)
    - Number of Prevented Acute Breakdowns
  - [x] Mini-task 6.3.3: Actionable summary card with "Approve Rebalanced Rotation" trigger.

- [x] **Task 6.4: Executive Briefing & Printable Reports**
  - [x] Mini-task 6.4.1: Printable executive briefing format with official Ministry of Home Affairs / CAPF watermark.
  - [x] Mini-task 6.4.2: Summary export table with date, time, and commander sign-off block.

---

### Epic 7: Dedicated Medical & Welfare Officer Portal (Confidential Clinical Triage)
- [x] **Task 7.1: Welfare Desk Header & Confidentiality Enforcement**
  - [x] Mini-task 7.1.1: Official Medical & Welfare mandate banner (`CONFIDENTIAL - MEDICAL & WELFARE TRIAGE ONLY`).
  - [x] Mini-task 7.1.2: Navigation tabs: `Triage Queue`, `Active Interventions Tracker`, `Audit Trail`.
  - [x] Mini-task 7.1.3: Active doctor/welfare officer badge with Unit Hospital credentials.

- [x] **Task 7.2: Confidential Clinical Triage Queue**
  - [x] Mini-task 7.2.1: Filter toolbar with Company dropdown, Risk Level filter (Critical, Vulnerable, Fatigued, Resilient), and live Search input.
  - [x] Mini-task 7.2.2: Dynamic personnel table connected to `GET /api/welfare/triage-queue`:
    - Columns: Rank & Full Name, Service Number, Company, Days in Hard Zone, Leave Cancellation Status, Stress Score, Risk Tier, Top Driver Tag, Action
    - High-contrast risk badges with subtle emerald/champagne styling
    - "Examine Dossier" action button
  - [x] Mini-task 7.2.3: Red-flag highlight for personnel with NLP crisis markers or scores ≥80.

- [x] **Task 7.3: Comprehensive Soldier Clinical Dossier Modal**
  - [x] Mini-task 7.3.1: Unmasked soldier header with photo placeholder, full name, rank, service number, platoon, and deployment zone.
  - [x] Mini-task 7.3.2: Explainable AI (XAI) Attribution Visualizer:
    - Percentage breakdown bars for Deployment Terrain, Leave Denial, Shift Volatility, Biometrics, and Mood
    - English and Hindi clinical narrative summaries explaining root causes
  - [x] Mini-task 7.3.3: Recent Operational & Leave History tab:
    - 7-day duty shift timeline (night ambush vs day patrol)
    - Leave applications, sanction dates, cancellations, and recorded emergency reasons
  - [x] Mini-task 7.3.4: Biometric telemetry tab (Resting HR, HRV RMSSD, sleep duration graph).
  - [x] Mini-task 7.3.5: Recent self-reported wellness check-in journals and psychometric ratings.

- [x] **Task 7.4: Welfare Intervention Dispatch & Tracking System**
  - [x] Mini-task 7.4.1: Action Dispatch Form inside the dossier:
    - Intervention Type selector: *Mandatory 10-Day R&R Leave*, *Tele-Counseling Session*, *Peer Buddy Pairing*, *Circadian Duty Rotation*, *Medical Review*
    - Priority selector: *Routine*, *Elevated*, *Urgent - Critical*
    - Assigned Counselor / Doctor field
    - Action details and confidential clinical notes textarea
    - "Dispatch & Sanction Intervention" button connected to `POST /api/welfare/interventions`
  - [x] Mini-task 7.4.2: Active Interventions Management View connected to `GET /api/welfare/interventions`:
    - Status pills: `Recommended`, `Approved by CO`, `In-Progress`, `Completed`, `Deferred`
    - "Update Status & Notes" action connected to `PATCH /api/welfare/interventions/{id}/status`
    - Live resolution timestamp and audit trail recording.

---

### Epic 8: Dedicated Jawan Self-Service Portal (Private Soldier Enclave)
- [x] **Task 8.1: Soldier Trust & APAR Decoupling Infrastructure**
  - [x] Mini-task 8.1.1: Prominent **APAR/ACR Decoupling Immunity Certificate**:
    - Official verification seal stating: *"Your responses are cryptographically isolated from your Annual Confidential Report (ACR/APAR). Zero career or promotion penalties."*
  - [x] Mini-task 8.1.2: Instant bilingual language switch button (English / हिंदी) with persistent preference.

- [x] **Task 8.2: 15-Second Daily Wellness Micro-Check-in**
  - [x] Mini-task 8.2.1: Visual mood selector with 5 responsive emoji/icon buttons (Very Low, Low, Neutral, Good, Excellent).
  - [x] Mini-task 8.2.2: Sleep duration slider (3 to 10 hours) and sleep quality rating (1 to 5 stars).
  - [x] Mini-task 8.2.3: Physical exhaustion and operational fatigue scale (1 = Fresh to 5 = Severely Exhausted).
  - [x] Mini-task 8.2.4: Optional confidential journal input with placeholder prompts (*"What is weighing on your mind today?"*).
  - [x] Mini-task 8.2.5: Connect to `POST /api/jawan/check-in` API:
    - Submits record to persistent database
    - Automatically updates soldier's stress score and risk tier
    - Shows positive reinforcement card and immediate resilience guidance.

- [x] **Task 8.3: Wearable SmartBand Telemetry Sync Simulator**
  - [x] Mini-task 8.3.1: SmartBand telemetry status card displaying:
    - Resting Heart Rate (bpm) with color-coded gauge
    - Heart Rate Variability (HRV RMSSD in ms) with ANS recovery interpretation
    - Sleep duration & Deep Sleep percentage (%)
  - [x] Mini-task 8.3.2: "Sync SmartBand Telemetry" button calling `POST /api/jawan/sync-biometrics` with realistic sensor fluctuation simulation.

- [x] **Task 8.4: AI Sathi (साथी) Mental Resilience Companion & Emergency SOS**
  - [x] Mini-task 8.4.1: Clean chat window for confidential conversational psychological first-aid.
  - [x] Mini-task 8.4.2: Connect to `POST /api/jawan/ai-sathi/chat` with real-time empathetic replies in English & Hindi.
  - [x] Mini-task 8.4.3: Interactive 4-7-8 Pranayama military breathing cycle guide with visual pulse animation (Inhale 4s, Hold 7s, Exhale 8s).
  - [x] Mini-task 8.4.4: Prominent high-contrast Emergency SOS button linked directly to Tele-MANAS (`14416`) and Base Hospital Psychologist hotline.

- [x] **Task 8.5: Private Leave & Welfare Request Tracker**
  - [x] Mini-task 8.5.1: Confidential leave status viewer showing pending, sanctioned, or deferred leaves.
  - [x] Mini-task 8.5.2: "Submit Welfare Grievance / Emergency Leave Request" form sending direct private request to the Welfare Officer.

---

### Epic 9: System Governance, Security & Cryptographic Audit Portal
- [x] **Task 9.1: Audit Ledger & Compliance Inspector**
  - [x] Mini-task 9.1.1: Immutable audit table displaying timestamp, actor ID, user role, action taken, and security classification.
  - [x] Mini-task 9.1.2: Filter audit logs by role, date range, or action type (`VIEW_HEATMAP`, `UNMASK_DOSSIER`, `DISPATCH_INTERVENTION`, `SUBMIT_CHECKIN`).
  - [x] Mini-task 9.1.3: Live refresh button connected to `GET /api/audit/logs`.

- [x] **Task 9.2: Privacy Guarantee Proof Panel**
  - [x] Mini-task 9.2.1: Card 1: APAR/ACR Firewall status with verified cryptographic hash.
  - [x] Mini-task 9.2.2: Card 2: k-Anonymity enforcement status (confirming no raw names shown to commanders).
  - [x] Mini-task 9.2.3: Card 3: Tactical Edge Offline Sync engine status (AES-256 local encrypted cache).

---

### Epic 10: End-to-End Dynamic Integration, Live API Testing & Verification
- [x] **Task 10.1: Full Dynamic API Verification Suite**
  - [x] Mini-task 10.1.1: Automated test suite verifying all 4 role logins and JWT token issuance.
  - [x] Mini-task 10.1.2: Automated test verifying that role guards block unauthorized access (e.g. Commander cannot access unmasked clinical dossier).
  - [x] Mini-task 10.1.3: Automated test verifying that a Jawan check-in dynamically updates the soldier's score and reflects in the Welfare Officer's triage desk.
  - [x] Mini-task 10.1.4: Automated test verifying that simulated rotation immediately recalculates company stress.
  - [x] Mini-task 10.1.5: Automated test verifying crisis keyword NLP scanner triggers immediate high-priority triage entry.

- [x] **Task 10.2: Final Institutional UI Polish & Verification**
  - [x] Mini-task 10.2.1: Verify Emerald Ink (`#064E3B`) and Champagne (`#F8E7C9`) palette consistency across all 4 role views.
  - [x] Mini-task 10.2.2: Verify responsive design on desktop, tablet, and field laptop screens.
  - [x] Mini-task 10.2.3: Verify error states, loading spinners, and toast notifications.
  - [x] Mini-task 10.2.4: Execute end-to-end user journey across all 4 roles to confirm zero static mock data.
