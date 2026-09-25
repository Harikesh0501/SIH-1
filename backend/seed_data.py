import json
import bcrypt
from datetime import datetime, timedelta
from database import SessionLocal, engine, Base
import models
from ml_engine import ml_engine_singleton
from time_utils import get_ist_now_naive

def get_password_hash(password: str) -> str:
    # Use native bcrypt without passlib wrapper for 100% compatibility
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def seed_database():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(models.User).count() > 0:
            print("INFO: Database already contains data. Clearing existing records for clean seeding...")
            db.query(models.AuditLog).delete()
            db.query(models.WelfareIntervention).delete()
            db.query(models.BiometricLog).delete()
            db.query(models.WellnessAssessment).delete()
            db.query(models.LeaveRecord).delete()
            db.query(models.DutyRoster).delete()
            db.query(models.Personnel).delete()
            db.query(models.User).delete()
            db.commit()

        # -------------------------------------------------------------
        # 1. Seed Pre-configured Users for All 4 Roles (Mini-task 1.2.3)
        # -------------------------------------------------------------
        default_pwd_hash = get_password_hash("demo123")
        
        users = [
            models.User(
                username="CO-104-SHARMA",
                hashed_password=default_pwd_hash,
                role="Commanding Officer",
                full_name="Col. V.K. Sharma",
                rank="Commandant",
                company="104 Bn HQ",
                service_number="IC-48291X",
                is_active=True
            ),
            models.User(
                username="MED-104-MALHOTRA",
                hashed_password=default_pwd_hash,
                role="Welfare Officer",
                full_name="Dr. Rajiv Malhotra",
                rank="Chief Medical Officer (SG)",
                company="Base Hospital Unit",
                service_number="MED-104-998",
                is_active=True
            ),
            models.User(
                username="CT-RAMESH-84920",
                hashed_password=default_pwd_hash,
                role="Jawan",
                full_name="Ct. Ramesh Kumar",
                rank="Constable",
                company="Alpha Company",
                service_number="CT-84920",
                is_active=True
            ),
            models.User(
                username="AUDIT-HQ-OFFICER",
                hashed_password=default_pwd_hash,
                role="Audit Admin",
                full_name="Insp. Gen. R.S. Verma",
                rank="Inspector General (Governance)",
                company="MHA Welfare Directorate",
                service_number="IPS-90214",
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()
        print(f"SUCCESS: Seeded {len(users)} authenticated users for all 4 RBAC roles.")

        # -------------------------------------------------------------
        # 2. Seed 4 Operational Companies & 64 Soldiers (Mini-task 1.2.2)
        # -------------------------------------------------------------
        companies_meta = [
            {
                "name": "Alpha Company",
                "zone": "Kargil Ridge (High Alt)",
                "type": "High-Altitude Border",
                "base_days": 115,
                "base_nights": 9,
                "stress_bias": 72.0
            },
            {
                "name": "Bravo Company",
                "zone": "Bastar FOB (LWE)",
                "type": "High-Intensity CI",
                "base_days": 140,
                "base_nights": 12,
                "stress_bias": 78.0
            },
            {
                "name": "Charlie Company",
                "zone": "Valley Transit Post",
                "type": "Static Security",
                "base_days": 55,
                "base_nights": 4,
                "stress_bias": 46.0
            },
            {
                "name": "Delta Company",
                "zone": "Base Depot (Peace Station)",
                "type": "Peace Station",
                "base_days": 25,
                "base_nights": 1,
                "stress_bias": 26.0
            }
        ]

        # Flagship soldier 1: Ct. Ramesh Kumar (Alpha Company, High Risk Demo Case)
        p1 = models.Personnel(
            service_number="CT-84920",
            masked_id="JWN-84920",
            full_name="Ct. Ramesh Kumar",
            rank="Constable",
            company="Alpha Company",
            platoon="1st Platoon (Vigilance)",
            role="Perimeter Night Ambush Guard",
            deployment_zone="Kargil Ridge (High Alt)",
            deployment_type="High-Altitude Border",
            days_in_current_zone=128,
            consecutive_night_duties=14,
            leave_cancellations_count=3,
            months_since_last_leave=8.5,
            transfer_frequency_count=3,
            phone_masked="+91-XXXXX-84920",
            stress_score=86.5,
            risk_level="Critical",
            risk_drivers_json=json.dumps([
                {"feature": "Consecutive Night Duties & Circadian Disruption", "impact_pct": 34.0},
                {"feature": "Leave Cancellation (Sister Wedding Denied)", "impact_pct": 28.0},
                {"feature": "Extreme High-Altitude Operational Duration", "impact_pct": 22.0},
                {"feature": "Low HRV RMSSD (Sympathetic Strain)", "impact_pct": 16.0}
            ])
        )
        db.add(p1)
        db.flush()

        # Flagship soldier 2: HC Suresh Patil (Bravo Company, Vulnerable Case)
        p2 = models.Personnel(
            service_number="HC-71204",
            masked_id="JWN-71204",
            full_name="HC Suresh Patil",
            rank="Head Constable",
            company="Bravo Company",
            platoon="2nd Platoon (Jungle Ops)",
            role="Combat Patrol Section Commander",
            deployment_zone="Bastar FOB (LWE)",
            deployment_type="High-Intensity CI",
            days_in_current_zone=145,
            consecutive_night_duties=8,
            leave_cancellations_count=2,
            months_since_last_leave=6.0,
            transfer_frequency_count=2,
            phone_masked="+91-XXXXX-71204",
            stress_score=71.2,
            risk_level="Vulnerable",
            risk_drivers_json=json.dumps([
                {"feature": "Extended CI Combat Deployment (145 Days)", "impact_pct": 38.0},
                {"feature": "Deferred Harvest Leave", "impact_pct": 26.0},
                {"feature": "Physical Exhaustion & Sleep Debt", "impact_pct": 22.0},
                {"feature": "Elevated Resting Pulse", "impact_pct": 14.0}
            ])
        )
        db.add(p2)
        db.flush()

        # Flagship soldier 3: SI Amit Singh (Charlie Company, Fatigued Case)
        p3 = models.Personnel(
            service_number="SI-55419",
            masked_id="JWN-55419",
            full_name="SI Amit Singh",
            rank="Sub-Inspector",
            company="Charlie Company",
            platoon="3rd Platoon (Access Control)",
            role="Outpost Commander",
            deployment_zone="Valley Transit Post",
            deployment_type="Static Security",
            days_in_current_zone=58,
            consecutive_night_duties=4,
            leave_cancellations_count=1,
            months_since_last_leave=3.2,
            transfer_frequency_count=1,
            phone_masked="+91-XXXXX-55419",
            stress_score=48.5,
            risk_level="Fatigued",
            risk_drivers_json=json.dumps([
                {"feature": "Night Vigilance Shifts", "impact_pct": 35.0},
                {"feature": "Operational Hours on Line", "impact_pct": 30.0},
                {"feature": "Deployment Duration", "impact_pct": 20.0},
                {"feature": "Resting Biometrics", "impact_pct": 15.0}
            ])
        )
        db.add(p3)
        db.flush()

        all_soldiers = [p1, p2, p3]

        # Generate 60 additional soldiers across the 4 companies (15 per company)
        ranks_distribution = ["Constable", "Constable", "Constable", "Head Constable", "ASI", "Sub-Inspector"]
        roles_pool = ["Perimeter Guard", "Combat Patrol", "QRT Driver", "Signals Operator", "Bunker Vigil", "Access Control"]
        
        distinct_names = [
            # Alpha Company (15 unique names)
            "Kavinder Rawat", "Vikram Thapa", "Sunil Patel", "Manoj Chauhan", "Deepak Bisht",
            "Sanjay Meena", "Gurpreet Singh", "Harinder Gill", "Ajay Sharma", "Pradeep Rawat",
            "Dinesh Negi", "Arun Shukla", "Santosh Giri", "Vijay Rathore", "Balram Verma",
            # Bravo Company (15 unique names)
            "Kishore Nair", "Praveen Tiwari", "Rakesh Joshi", "Kuldeep Jamwal", "Mahesh Deshmukh",
            "Suraj Kumar", "Hemant Pandey", "Anil Kadam", "Ashok Roy", "Birender Mahato",
            "Chetan Marandi", "Devendra Solanki", "Gopal Das", "Inderjeet Dhillon", "Jagdish Prasad",
            # Charlie Company (15 unique names)
            "Kamaljeet Bajwa", "Lalit Bohra", "Mohan Lal", "Naveen Kaushik", "Om Prakash",
            "Pankaj Mishra", "Ravinder Tanwar", "Satish Chand", "Tarun Boro", "Umesh Gond",
            "Varun Chutia", "Yashwant Rao", "Anand Swamy", "Bhupinder Saini", "Chandan Bauri",
            # Delta Company (15 unique names)
            "Dharmendra Lodhi", "Gajendra Sisodia", "Harishankar Pal", "Ishwar Soren", "Jitendra Bunkar",
            "Kishan Murmu", "Laxman Gavit", "Mukesh Sahni", "Nandkishore Tudu", "Premchand Oraon",
            "Rajendra Barman", "Subhash Hembram", "Trilok Bheel", "Virender Mallah", "Yogeshwar Kol"
        ]

        global_name_idx = 0
        soldier_idx = 100
        for comp in companies_meta:
            for j in range(15):
                soldier_idx += 1
                srv = f"CT-{comp['name'][0]}-{soldier_idx}"
                name = distinct_names[global_name_idx]
                global_name_idx += 1
                rank = ranks_distribution[j % len(ranks_distribution)]
                role = roles_pool[j % len(roles_pool)]
                
                # Dynamic parameters tuned for authentic distribution across tiers
                days = max(15, int(comp["base_days"] + (j * 7) - 35))
                nights = max(0, min(14, int(comp["base_nights"] + (j % 6) - 3)))
                cancellations = 2 if j in [1, 7] else (1 if j in [3, 9, 13] else (3 if j == 0 and comp["name"] == "Alpha Company" else 0))
                months_away = round(max(0.6, (days / 30.0) + (cancellations * 1.3)), 1)
                mood = max(1, min(5, 5 - int(nights / 3) - cancellations))
                sleep = round(max(3.8, min(8.0, 7.8 - (nights * 0.3) - (cancellations * 0.35))), 1)
                exhaustion = max(1, min(5, 1 + int(nights / 3) + (1 if days > 110 else 0)))
                phq4 = max(0, min(12, int((5 - mood) * 1.5 + (exhaustion - 1) * 1.2)))
                hrv = round(max(18.0, min(80.0, 68.0 - (nights * 2.8) - (days * 0.14) - (cancellations * 4.0))), 1)
                resting_hr = int(max(58, min(96, 68 + (nights * 1.8) + (cancellations * 2.5))))
                
                features = {
                    "deployment_type": comp["type"],
                    "days_in_zone": days,
                    "consecutive_night_duties": nights,
                    "leave_cancellations": cancellations,
                    "months_since_leave": months_away,
                    "mood_score": mood,
                    "sleep_hours": sleep,
                    "physical_exhaustion": exhaustion,
                    "phq4_score": phq4,
                    "hrv_rmssd": hrv,
                    "resting_hr": resting_hr,
                    "voluntary_text": ""
                }
                
                # Real ML model inference via GradientBoosting predictive engine
                ml_res = ml_engine_singleton.predict_stress(features)
                score = ml_res["stress_score"]
                tier = ml_res["risk_level"]
                xai_drivers = ml_res["explainable_factors"]
                
                p = models.Personnel(
                    service_number=srv,
                    masked_id=f"JWN-{soldier_idx}",
                    full_name=name,
                    rank=rank,
                    company=comp["name"],
                    platoon=f"{(j % 3) + 1} Platoon",
                    role=role,
                    deployment_zone=comp["zone"],
                    deployment_type=comp["type"],
                    days_in_current_zone=days,
                    consecutive_night_duties=nights,
                    leave_cancellations_count=cancellations,
                    months_since_last_leave=months_away,
                    transfer_frequency_count=1 + (j % 3),
                    phone_masked=f"+91-XXXXX-{soldier_idx}",
                    stress_score=score,
                    risk_level=tier,
                    risk_drivers_json=json.dumps(xai_drivers)
                )
                db.add(p)
                all_soldiers.append(p)

        db.commit()
        print(f"SUCCESS: Seeded total {len(all_soldiers)} personnel across all 4 operational companies.")

        # ----------------------------------------------------------------------
        # 3. Seed 7-Day History, Leaves, and Biometrics for Demo (Mini-task 1.2.4)
        # ----------------------------------------------------------------------
        today = get_ist_now_naive()
        for i in range(7):
            d_str = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            # Ramesh duty shifts
            db.add(models.DutyRoster(
                personnel_id=p1.id,
                date=d_str,
                shift_type="Night Ambush" if i < 5 else "Perimeter Guard",
                is_night_duty=True if i < 5 else False,
                hours_on_duty=10.0 if i < 5 else 8.0,
                risk_level="Extreme" if i < 5 else "Elevated"
            ))
            # Suresh duty shifts
            db.add(models.DutyRoster(
                personnel_id=p2.id,
                date=d_str,
                shift_type="Combat Patrol" if i % 2 == 0 else "Night Ambush",
                is_night_duty=True if i % 2 == 1 else False,
                hours_on_duty=9.0,
                risk_level="Elevated"
            ))

        # Seed leave records for Ramesh (including the critical cancelled sister wedding leave)
        db.add(models.LeaveRecord(
            personnel_id=p1.id,
            leave_type="Casual Leave (CL)",
            days_requested=15,
            start_date=(today - timedelta(days=45)).strftime("%Y-%m-%d"),
            end_date=(today - timedelta(days=30)).strftime("%Y-%m-%d"),
            status="Cancelled",
            cancellation_reason="Operational Freeze: Escalated High-Altitude Alert Level-3",
            personal_reason="Sister Wedding Ceremony",
            created_at=today - timedelta(days=50)
        ))
        db.add(models.LeaveRecord(
            personnel_id=p1.id,
            leave_type="Emergency R&R",
            days_requested=10,
            start_date=(today - timedelta(days=15)).strftime("%Y-%m-%d"),
            end_date=(today - timedelta(days=5)).strftime("%Y-%m-%d"),
            status="Cancelled",
            cancellation_reason="Unit Understrength: Troop Replacement Delayed in Snow",
            personal_reason="Mother Medical Treatment",
            created_at=today - timedelta(days=20)
        ))

        # Seed recent assessments and biometrics for Ramesh
        db.add(models.WellnessAssessment(
            personnel_id=p1.id,
            mood_score=1,
            sleep_hours=4.2,
            sleep_quality=1,
            physical_exhaustion=5,
            mental_stress_rating=5,
            phq4_score=9,
            voluntary_notes="Unable to sleep after continuous night patrols. Very worried about sister's marriage and delayed leave.",
            is_offline_synced=False,
            timestamp=today - timedelta(hours=8)
        ))
        db.add(models.BiometricLog(
            personnel_id=p1.id,
            resting_heart_rate=88,
            hrv_rmssd=22.4,  # Depressed HRV indicates severe autonomic stress
            sleep_duration_hours=4.2,
            deep_sleep_pct=8.5,
            stress_biomarker_index=84.0,
            sync_source="SmartBand-V2 Simulator",
            timestamp=today - timedelta(hours=6)
        ))

        # Seed initial pending welfare intervention for Ramesh
        db.add(models.WelfareIntervention(
            personnel_id=p1.id,
            intervention_type="Mandatory R&R Leave & Clinical Counseling",
            priority="Urgent - Critical",
            status="Recommended",
            recommended_by="AI Behavioral Stress Engine",
            assigned_counselor="Dr. Rajiv Malhotra (Base Hospital)",
            action_details="Sanction immediate 12-day Rest & Recuperation leave. Troop has completed 128 days on forward ridge with 3 leave deferments.",
            clinical_notes="Troop displaying acute fatigue markers with elevated fatigue and sleep debt.",
            created_at=today - timedelta(hours=5)
        ))

        # Seed Authentic Operational Audit Trail (Mini-task 4.4.1)
        audit_records = [
            models.AuditLog(
                user_role="System Admin",
                actor_id="SYSTEM_INITIALIZER",
                action="INITIALIZE_SEED_DATA",
                target_entity="Database",
                target_id="104_BN_CRPF",
                classification="UNCLASSIFIED - SYSTEM LOG",
                details="Seeded initial 63 personnel, 4 companies, and authenticated role credentials.",
                timestamp=today - timedelta(hours=24)
            ),
            models.AuditLog(
                user_role="Commanding Officer",
                actor_id="CO-104-SHARMA",
                action="LOGIN_SUCCESS",
                target_entity="UserSession",
                target_id="CO-104-SHARMA",
                classification="AUTHENTICATED SESSION",
                details="Commanding Officer Col. V.K. Sharma logged into Battalion Command Enclave.",
                timestamp=today - timedelta(hours=20)
            ),
            models.AuditLog(
                user_role="Commanding Officer",
                actor_id="CO-104-SHARMA",
                action="VIEW_COMPANY_HEATMAP",
                target_entity="BattalionHeatmap",
                target_id="Alpha Company",
                classification="RESTRICTED - OPERATIONAL READINESS",
                details="Reviewed stress index distribution for Alpha Company (Kargil Ridge). Average readiness: 68.4/100.",
                timestamp=today - timedelta(hours=18)
            ),
            models.AuditLog(
                user_role="Commanding Officer",
                actor_id="CO-104-SHARMA",
                action="SIMULATE_WORKLOAD",
                target_entity="WorkloadSimulator",
                target_id="Alpha Company",
                classification="CONFIDENTIAL - BATTALION PLANNING",
                details="Executed what-if rotation model: 14 days earlier base rotation and 6 mandatory R&R leaves simulated.",
                timestamp=today - timedelta(hours=16)
            ),
            models.AuditLog(
                user_role="Commanding Officer",
                actor_id="CO-104-SHARMA",
                action="EXPORT_REPORT",
                target_entity="ExecutiveReport",
                target_id="RPT-104-BN",
                classification="RESTRICTED - EXECUTIVE SUMMARY",
                details="Exported official Battalion Strategic Readiness & Welfare Assessment dossier.",
                timestamp=today - timedelta(hours=15)
            ),
            models.AuditLog(
                user_role="Welfare Officer",
                actor_id="MED-104-MALHOTRA",
                action="LOGIN_SUCCESS",
                target_entity="UserSession",
                target_id="MED-104-MALHOTRA",
                classification="AUTHENTICATED SESSION",
                details="Chief Medical Officer Dr. Rajiv Malhotra logged into Clinical Triage Enclave.",
                timestamp=today - timedelta(hours=12)
            ),
            models.AuditLog(
                user_role="Welfare Officer",
                actor_id="MED-104-MALHOTRA",
                action="VIEW_TRIAGE_QUEUE",
                target_entity="ClinicalTriageQueue",
                target_id="104_BN",
                classification="SECRET - CLINICAL PRIVILEGE",
                details="Screened 63 personnel risk profiles. 2 critical triage alerts reviewed.",
                timestamp=today - timedelta(hours=11)
            ),
            models.AuditLog(
                user_role="Welfare Officer",
                actor_id="MED-104-MALHOTRA",
                action="UNMASK_PERSONNEL_DOSSIER",
                target_entity="Personnel",
                target_id=str(p1.id),
                classification="CONFIDENTIAL - MEDICAL PRIVILEGE",
                details=f"CMO unmasked clinical dossier for CT-84920 with justification: 'Troop has 128 days high-altitude duty with severe fatigue and leave cancellations'.",
                timestamp=today - timedelta(hours=9)
            ),
            models.AuditLog(
                user_role="Welfare Officer",
                actor_id="MED-104-MALHOTRA",
                action="DISPATCH_INTERVENTION",
                target_entity="WelfareIntervention",
                target_id="INT-104-01",
                classification="RESTRICTED - WELFARE",
                details="Sanctioned 12-day Mandatory Rest & Recuperation (R&R) Leave and clinical tele-consultation linkage for Ct. Ramesh Kumar.",
                timestamp=today - timedelta(hours=8)
            ),
            models.AuditLog(
                user_role="Jawan",
                actor_id="CT-RAMESH-84920",
                action="LOGIN_SUCCESS",
                target_entity="UserSession",
                target_id="CT-RAMESH-84920",
                classification="AUTHENTICATED SESSION",
                details="Constable Ramesh Kumar authenticated to confidential companion enclave.",
                timestamp=today - timedelta(hours=6)
            ),
            models.AuditLog(
                user_role="Jawan",
                actor_id="CT-RAMESH-84920",
                action="SUBMIT_CHECKIN",
                target_entity="WellnessAssessment",
                target_id="1",
                classification="RESTRICTED - APAR DECOUPLED",
                details="Daily micro-checkin recorded: Mood 4/5, Sleep 7.5h. Stress score evaluated at 41.0 (Mild). Permanently quarantined from ACR/APAR.",
                timestamp=today - timedelta(hours=4)
            ),
            models.AuditLog(
                user_role="Jawan",
                actor_id="CT-RAMESH-84920",
                action="SUBMIT_LEAVE_REQUEST",
                target_entity="LeaveRecord",
                target_id="1",
                classification="RESTRICTED - WELFARE",
                details="Submitted confidential Emergency R&R leave request for family emergency.",
                timestamp=today - timedelta(hours=3)
            ),
            models.AuditLog(
                user_role="Audit Admin",
                actor_id="AUDIT-HQ-OFFICER",
                action="LOGIN_SUCCESS",
                target_entity="UserSession",
                target_id="AUDIT-HQ-OFFICER",
                classification="AUTHENTICATED SESSION",
                details="Inspector General R.S. Verma logged into Sovereign Audit & Compliance Portal.",
                timestamp=today - timedelta(hours=2)
            ),
            models.AuditLog(
                user_role="Audit Admin",
                actor_id="AUDIT-HQ-OFFICER",
                action="VERIFY_AUDIT_INTEGRITY",
                target_entity="AuditLedger",
                target_id="RootHashChain",
                classification="SECRET - INTEGRITY VERIFICATION",
                details="Completed cryptographic ledger audit. All records verified tamper-uncompromised with SHA-256 chain integrity.",
                timestamp=today - timedelta(hours=1)
            )
        ]

        import hashlib
        for log in audit_records:
            thash = hashlib.sha256(
                f"{log.id}|{log.timestamp.isoformat()}|{log.actor_id}|{log.action}|{log.classification}".encode("utf-8")
            ).hexdigest()
            log.tamper_hash = thash
            db.add(log)

        db.commit()
        print(f"SUCCESS: Seeded {len(audit_records)} authentic operational audit records.")
        print("SUCCESS: Seeded duty rosters, leave cancellations, biometrics, and interventions.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
