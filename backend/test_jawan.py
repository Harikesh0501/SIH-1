import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

from main import app
from database import SessionLocal
import models

client = TestClient(app)

def get_auth_token(username: str, role_title: str) -> str:
    response = client.post("/api/auth/login", json={
        "username": username,
        "password": "demo123"
    })
    assert response.status_code == 200, f"Login failed for {username}: {response.text}"
    data = response.json()
    assert data["user"]["role"] == role_title
    return data["access_token"]

def test_jawan_checkin_routine_and_crisis():
    """Mini-task 4.3.1: Verify 15-second daily check-in with dynamic stress recalculation and crisis trigger."""
    token = get_auth_token("CT-RAMESH-84920", "Jawan")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Routine daily check-in
    routine_payload = {
        "mood_score": 3,
        "sleep_hours": 6.5,
        "sleep_quality": 3,
        "physical_exhaustion": 2,
        "mental_stress_rating": 2,
        "phq4_score": 2,
        "voluntary_notes": "Completed night patrol duty smoothly. Feeling standard operational fatigue.",
        "is_offline_synced": False
    }
    resp = client.post("/api/jawan/check-in", json=routine_payload, headers=headers)
    assert resp.status_code == 201, f"Check-in failed: {resp.text}"
    data = resp.json()

    assert data["assessment_id"] > 0
    assert 0.0 <= data["stress_score"] <= 100.0
    assert data["risk_level"] in ["Resilient", "Fatigued", "Vulnerable", "Critical"]
    assert data["crisis_detected"] is False
    assert "tele_manas_national" in data["emergency_sos_hotlines"]
    assert data["emergency_sos_hotlines"]["tele_manas_national"] == "14416"
    assert len(data["resilience_message_en"]) > 10
    assert len(data["resilience_message_hi"]) > 10
    print(f"PASS: Routine check-in recorded. Stress: {data['stress_score']}, Tier: {data['risk_level']}")

    # 2. Crisis trigger check-in
    crisis_payload = {
        "mood_score": 1,
        "sleep_hours": 2.5,
        "sleep_quality": 1,
        "physical_exhaustion": 5,
        "mental_stress_rating": 5,
        "phq4_score": 11,
        "voluntary_notes": "bohot pareshan hu, ab bas marna chahta hu, koi rasta nahi bacha",
        "is_offline_synced": False
    }
    resp_crisis = client.post("/api/jawan/check-in", json=crisis_payload, headers=headers)
    assert resp_crisis.status_code == 201
    data_crisis = resp_crisis.json()

    assert data_crisis["crisis_detected"] is True
    assert data_crisis["risk_level"] == "Critical"
    assert data_crisis["stress_score"] >= 88.0
    assert "Tele-MANAS" in data_crisis["resilience_message_en"]
    assert "टेली-मानस" in data_crisis["resilience_message_hi"]

    # Verify that an urgent WelfareIntervention was automatically created in DB
    db = SessionLocal()
    ramesh = db.query(models.Personnel).filter(models.Personnel.service_number == "CT-84920").first()
    assert ramesh.stress_score >= 88.0
    assert ramesh.risk_level == "Critical"

    emergency_intv = db.query(models.WelfareIntervention).filter(
        models.WelfareIntervention.personnel_id == ramesh.id,
        models.WelfareIntervention.priority == "Urgent - Critical"
    ).order_by(models.WelfareIntervention.id.desc()).first()

    assert emergency_intv is not None
    assert "Multilingual NLP" in emergency_intv.recommended_by
    assert "Immediate Clinical Triage" in emergency_intv.intervention_type
    db.close()

    print("PASS: Crisis NLP trigger correctly escalated score to Critical and dispatched emergency intervention.")

def test_jawan_checkin_rbac_forbidden():
    """Verify non-jawan roles cannot submit jawan check-ins."""
    co_token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    resp_co = client.post("/api/jawan/check-in", json={"mood_score": 3, "sleep_hours": 7.0}, headers={"Authorization": f"Bearer {co_token}"})
    assert resp_co.status_code == 403
    print("PASS: Non-jawan strictly blocked from Jawan check-in with HTTP 403.")

def test_jawan_sync_biometrics():
    """Mini-task 4.3.2: Verify voluntary biometric sync and autonomic recovery derivation."""
    token = get_auth_token("CT-RAMESH-84920", "Jawan")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "resting_heart_rate": 78,
        "hrv_rmssd": 32.5,
        "sleep_duration_hours": 5.2,
        "deep_sleep_pct": 14.0,
        "sync_source": "SmartBand-BLE Client"
    }

    response = client.post("/api/jawan/sync-biometrics", json=payload, headers=headers)
    assert response.status_code == 201, f"Biometric sync failed: {response.text}"
    bio = response.json()

    assert bio["log_id"] > 0
    assert bio["resting_heart_rate"] == 78
    assert bio["hrv_rmssd"] == 32.5
    assert bio["sleep_duration_hours"] == 5.2
    assert 0.0 <= bio["stress_biomarker_index"] <= 100.0
    assert "Sympathetic" in bio["autonomic_recovery_status"] or "Autonomic" in bio["autonomic_recovery_status"]
    print(f"PASS: Biometrics synced. Biomarker index: {bio['stress_biomarker_index']}, Status: {bio['autonomic_recovery_status']}")

def test_jawan_my_history():
    """Mini-task 4.3.3: Verify soldier can retrieve their personal history."""
    token = get_auth_token("CT-RAMESH-84920", "Jawan")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/jawan/my-history", headers=headers)
    assert response.status_code == 200, f"History fetch failed: {response.text}"
    hist = response.json()

    assert hist["service_number"] == "CT-84920"
    assert hist["full_name"] == "Ct. Ramesh Kumar"
    assert len(hist["recent_assessments"]) > 0
    assert len(hist["recent_biometrics"]) > 0
    assert len(hist["leave_records"]) > 0
    assert len(hist["interventions"]) > 0
    print(f"PASS: Personal history fetched for {hist['full_name']} with {len(hist['recent_assessments'])} assessments.")

def test_jawan_ai_sathi_chat():
    """Mini-task 4.3.4: Verify empathetic AI Sathi conversational assistance and crisis de-escalation."""
    token = get_auth_token("CT-RAMESH-84920", "Jawan")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. General greeting
    resp_greeting = client.post("/api/jawan/ai-sathi/chat", json={"message": "Jai Hind, Sathi!"}, headers=headers)
    assert resp_greeting.status_code == 200
    data_greet = resp_greeting.json()
    assert "Jai Hind" in data_greet["reply_en"]
    assert "जय हिंद" in data_greet["reply_hi"]
    assert data_greet["crisis_detected"] is False

    # 2. Breathing / Pranayama request
    resp_breath = client.post("/api/jawan/ai-sathi/chat", json={"message": "Mujhe bohot stress ho raha hai, breathing exercise karao"}, headers=headers)
    assert resp_breath.status_code == 200
    data_breath = resp_breath.json()
    assert data_breath["pranayama_guide"] is not None
    assert data_breath["pranayama_guide"]["inhale_seconds"] == 4
    assert data_breath["pranayama_guide"]["hold_seconds"] == 7
    assert data_breath["pranayama_guide"]["exhale_seconds"] == 8

    # 3. Family / Leave query
    resp_leave = client.post("/api/jawan/ai-sathi/chat", json={"message": "Ghar ki bohot yaad aa rahi hai, chhutti kab milegi?"}, headers=headers)
    assert resp_leave.status_code == 200
    data_leave = resp_leave.json()
    assert "leave" in data_leave["reply_en"].lower() or "family" in data_leave["reply_en"].lower()
    assert "छुट्टी" in data_leave["reply_hi"] or "परिवार" in data_leave["reply_hi"]

    # 4. Crisis message
    resp_crisis = client.post("/api/jawan/ai-sathi/chat", json={"message": "I want to end my life, koi umeed nahi hai"}, headers=headers)
    assert resp_crisis.status_code == 200
    data_crisis = resp_crisis.json()
    assert data_crisis["crisis_detected"] is True
    assert "14416" in data_crisis["reply_en"]
    assert "14416" in data_crisis["reply_hi"]
    assert any("Tele-MANAS" in action for action in data_crisis["suggested_actions"])

    print("PASS: AI Sathi Chat fully verified for greeting, Pranayama, leave counseling, and crisis response.")

def test_jawan_privacy_certificate():
    """Mini-task 4.3.5: Verify cryptographic APAR Decoupling Immunity Certificate."""
    token = get_auth_token("CT-RAMESH-84920", "Jawan")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/jawan/privacy-certificate", headers=headers)
    assert response.status_code == 200, f"Privacy certificate failed: {response.text}"
    cert = response.json()

    assert cert["certificate_id"].startswith("APAR-IMMUNITY-CT-84920-")
    assert cert["soldier_name"] == "Ct. Ramesh Kumar"
    assert cert["service_number"] == "CT-84920"
    assert cert["immunity_status"] == "ACTIVE - STATUTORY PRIVILEGE ENFORCED"
    assert len(cert["prohibitions"]) == 3
    assert len(cert["cryptographic_verification_token"]) == 64  # SHA-256 hash
    print(f"PASS: Privacy Certificate issued. ID: {cert['certificate_id']}, Hash: {cert['cryptographic_verification_token'][:16]}...")

def test_jawan_leave_request():
    """Mini-task 8.5.2: Verify confidential leave application and emergency welfare grievance dispatch."""
    token = get_auth_token("CT-RAMESH-84920", "Jawan")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "leave_type": "Emergency R&R",
        "days_requested": 12,
        "start_date": "2026-10-05",
        "end_date": "2026-10-17",
        "personal_reason": "Urgent family welfare: sister's wedding and mother medical follow-up.",
        "is_emergency_welfare_request": True,
        "confidential_notes": "Requesting expedited consideration due to 3 previous cancellations."
    }

    response = client.post("/api/jawan/leave-request", json=payload, headers=headers)
    assert response.status_code == 201, f"Leave application failed: {response.text}"
    data = response.json()

    assert data["id"] > 0
    assert data["leave_type"] == "Emergency R&R"
    assert data["days_requested"] == 12
    assert data["status"] == "Pending"
    assert "sister's wedding" in data["personal_reason"]

    # Verify that a WelfareIntervention was dispatched
    db = SessionLocal()
    ramesh = db.query(models.Personnel).filter(models.Personnel.service_number == "CT-84920").first()
    intv = db.query(models.WelfareIntervention).filter(
        models.WelfareIntervention.personnel_id == ramesh.id,
        models.WelfareIntervention.priority == "Urgent - Critical"
    ).order_by(models.WelfareIntervention.id.desc()).first()

    assert intv is not None
    assert "Emergency" in intv.action_details or "R&R" in intv.action_details
    db.close()
    print("PASS: Confidential leave request recorded and emergency welfare dispatch verified.")

if __name__ == "__main__":
    test_jawan_checkin_routine_and_crisis()
    test_jawan_checkin_rbac_forbidden()
    test_jawan_sync_biometrics()
    test_jawan_my_history()
    test_jawan_ai_sathi_chat()
    test_jawan_privacy_certificate()
    test_jawan_leave_request()
    print("\nALL JAWAN AUTOMATED TESTS PASSED SUCCESSFULLY (100%)!")

