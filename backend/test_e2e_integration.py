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

def login(username: str, role_title: str) -> str:
    """Helper to authenticate a user and return their JWT access token."""
    response = client.post("/api/auth/login", json={
        "username": username,
        "password": "demo123"
    })
    assert response.status_code == 200, f"Login failed for {username}: {response.text}"
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == role_title
    return data["access_token"]

# -------------------------------------------------------------
# Mini-task 10.1.1: Automated test suite verifying all 4 role logins & JWT issuance
# -------------------------------------------------------------
def test_e2e_01_all_four_role_logins_and_jwt_issuance():
    """Verify all 4 distinct military roles authenticate, receive valid JWTs, and reject invalid credentials."""
    # 1. Invalid credentials rejection
    bad_resp = client.post("/api/auth/login", json={
        "username": "CO-104-SHARMA",
        "password": "WRONG_PASSWORD_xyz"
    })
    assert bad_resp.status_code == 401
    assert "Invalid Service ID" in bad_resp.json()["detail"]

    # 2. Authenticate all 4 RBAC roles
    role_accounts = [
        ("CO-104-SHARMA", "Commanding Officer", "Col. V.K. Sharma"),
        ("MED-104-MALHOTRA", "Welfare Officer", "Dr. Rajiv Malhotra"),
        ("CT-RAMESH-84920", "Jawan", "Ct. Ramesh Kumar"),
        ("AUDIT-HQ-OFFICER", "Audit Admin", "Insp. Gen. R.S. Verma")
    ]

    for username, role, full_name in role_accounts:
        resp = client.post("/api/auth/login", json={"username": username, "password": "demo123"})
        assert resp.status_code == 200, f"Failed for {username}: {resp.text}"
        data = resp.json()
        assert len(data["access_token"]) > 30
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == role
        assert data["user"]["full_name"] == full_name

        # Verify /api/auth/me accepts token
        me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["username"] == username
        print(f"PASS: Login verified for role '{role}' ({full_name}) with valid JWT.")

# -------------------------------------------------------------
# Mini-task 10.1.2: Automated test verifying role guards block unauthorized access
# -------------------------------------------------------------
def test_e2e_02_rbac_boundary_and_firewall_enforcement():
    """Verify strict cryptographic RBAC guards block unauthorized lateral access across portals."""
    co_token = login("CO-104-SHARMA", "Commanding Officer")
    welfare_token = login("MED-104-MALHOTRA", "Welfare Officer")
    jawan_token = login("CT-RAMESH-84920", "Jawan")
    audit_token = login("AUDIT-HQ-OFFICER", "Audit Admin")

    # Violation 1: Commanding Officer attempts to access confidential clinical dossier (HTTP 403)
    resp = client.get("/api/welfare/personnel/1/dossier", headers={"Authorization": f"Bearer {co_token}"})
    assert resp.status_code == 403, f"Expected 403 Forbidden for CO on clinical dossier, got {resp.status_code}"
    print("PASS: Commanding Officer strictly blocked from unmasked clinical dossier (HTTP 403).")

    # Violation 2: Commanding Officer attempts to access Sovereign Audit Logs (HTTP 403)
    resp = client.get("/api/audit/logs", headers={"Authorization": f"Bearer {co_token}"})
    assert resp.status_code == 403, f"Expected 403 Forbidden for CO on audit logs, got {resp.status_code}"
    print("PASS: Commanding Officer strictly blocked from audit logs (HTTP 403).")

    # Violation 3: Jawan attempts to access Commander Strategic KPIs (HTTP 403)
    resp = client.get("/api/commander/readiness-kpi", headers={"Authorization": f"Bearer {jawan_token}"})
    assert resp.status_code == 403, f"Expected 403 Forbidden for Jawan on commander KPI, got {resp.status_code}"
    print("PASS: Jawan strictly blocked from Commander strategic dashboard (HTTP 403).")

    # Violation 4: Jawan attempts to access confidential triage queue (HTTP 403)
    resp = client.get("/api/welfare/triage-queue", headers={"Authorization": f"Bearer {jawan_token}"})
    assert resp.status_code == 403, f"Expected 403 Forbidden for Jawan on triage queue, got {resp.status_code}"
    print("PASS: Jawan strictly blocked from Welfare triage queue (HTTP 403).")

    # Violation 5: Welfare Officer attempts to run operational workload simulation (HTTP 403)
    sim_payload = {"company": "Alpha", "rotate_to_base_days_earlier": 10, "mandatory_rr_leave_jawans_count": 5}
    resp = client.post("/api/commander/simulate-workload", json=sim_payload, headers={"Authorization": f"Bearer {welfare_token}"})
    assert resp.status_code == 403, f"Expected 403 Forbidden for Welfare Officer on simulation, got {resp.status_code}"
    print("PASS: Welfare Officer strictly blocked from Commander workload simulator (HTTP 403).")

# -------------------------------------------------------------
# Mini-task 10.1.3: Dynamic data propagation (Jawan Check-in -> Recalculation -> Welfare Triage Queue)
# -------------------------------------------------------------
def test_e2e_03_jawan_checkin_dynamic_stress_propagation():
    """Verify that a soldier check-in immediately recalculates ML stress score and propagates to the Welfare triage queue."""
    jawan_token = login("CT-RAMESH-84920", "Jawan")
    welfare_token = login("MED-104-MALHOTRA", "Welfare Officer")

    # 1. Jawan submits an elevated strain check-in
    checkin_payload = {
        "mood_score": 2,
        "sleep_hours": 4.5,
        "sleep_quality": 2,
        "physical_exhaustion": 4,
        "mental_stress_rating": 4,
        "phq4_score": 7,
        "voluntary_notes": "Continuous counter-insurgency night ambush patrol. Experiencing severe physical fatigue and muscle stiffness.",
        "is_offline_synced": False
    }

    checkin_resp = client.post("/api/jawan/check-in", json=checkin_payload, headers={"Authorization": f"Bearer {jawan_token}"})
    assert checkin_resp.status_code == 201, f"Check-in failed: {checkin_resp.text}"
    checkin_data = checkin_resp.json()
    updated_stress_score = checkin_data["stress_score"]
    updated_risk_tier = checkin_data["risk_level"]

    assert updated_stress_score >= 50.0
    print(f"PASS: Jawan check-in computed live stress score: {updated_stress_score} ({updated_risk_tier}).")

    # 2. Welfare Officer queries triage queue and verifies Ramesh Kumar reflects the updated score
    triage_resp = client.get("/api/welfare/triage-queue", headers={"Authorization": f"Bearer {welfare_token}"})
    assert triage_resp.status_code == 200, f"Triage queue query failed: {triage_resp.text}"
    triage_list = triage_resp.json()

    ramesh_entry = next((item for item in triage_list if item["service_number"] == "CT-84920"), None)
    assert ramesh_entry is not None, "Ramesh Kumar not found in triage queue"
    assert abs(ramesh_entry["stress_score"] - updated_stress_score) < 0.1, f"Mismatch: triage has {ramesh_entry['stress_score']}, check-in returned {updated_stress_score}"
    assert ramesh_entry["risk_level"] == updated_risk_tier
    print(f"PASS: Dynamic data propagation verified! Welfare Desk displays updated score {ramesh_entry['stress_score']} for {ramesh_entry['full_name']}.")

# -------------------------------------------------------------
# Mini-task 10.1.4: Dynamic workload simulation recalculation
# -------------------------------------------------------------
def test_e2e_04_workload_simulation_dynamic_recalculation():
    """Verify that operational rotation simulation recalculates burnout risk, readiness gain, and prevented breakdowns."""
    co_token = login("CO-104-SHARMA", "Commanding Officer")

    payload = {
        "company": "Alpha",
        "rotate_to_base_days_earlier": 15,
        "mandatory_rr_leave_jawans_count": 10
    }

    resp = client.post("/api/commander/simulate-workload", json=payload, headers={"Authorization": f"Bearer {co_token}"})
    assert resp.status_code == 200, f"Simulation failed: {resp.text}"
    sim = resp.json()

    assert "Alpha" in sim["company"]
    assert sim["current_burnout_risk"] > sim["projected_burnout_risk"]
    assert sim["risk_reduction_pct"] > 5.0
    assert sim["projected_readiness_increase_pct"] > 0.0
    assert sim["prevented_critical_cases"] >= 1
    assert "sanction" in sim["recommendation_summary"].lower() or "recommend" in sim["recommendation_summary"].lower()
    print(f"PASS: Workload simulator recalculated Alpha risk: {sim['current_burnout_risk']} -> {sim['projected_burnout_risk']} (-{sim['risk_reduction_pct']}%), +{sim['projected_readiness_increase_pct']}% readiness.")

# -------------------------------------------------------------
# Mini-task 10.1.5: Multilingual Crisis NLP Scanner & Priority Intervention Trigger
# -------------------------------------------------------------
def test_e2e_05_multilingual_crisis_nlp_priority_triage_dispatch():
    """Verify that acute crisis keywords in check-in immediately trigger critical risk tier and create a priority triage intervention."""
    jawan_token = login("CT-RAMESH-84920", "Jawan")
    welfare_token = login("MED-104-MALHOTRA", "Welfare Officer")

    # 1. Jawan submits check-in with crisis notes in Hindi
    crisis_payload = {
        "mood_score": 1,
        "sleep_hours": 2.0,
        "sleep_quality": 1,
        "physical_exhaustion": 5,
        "mental_stress_rating": 5,
        "phq4_score": 12,
        "voluntary_notes": "bohot pareshan hu, ab bas marna chahta hu, koi rasta nahi bacha",
        "is_offline_synced": False
    }

    resp = client.post("/api/jawan/check-in", json=crisis_payload, headers={"Authorization": f"Bearer {jawan_token}"})
    assert resp.status_code == 201
    res_data = resp.json()

    assert res_data["crisis_detected"] is True
    assert res_data["risk_level"] == "Critical"
    assert res_data["stress_score"] >= 88.0
    assert "Tele-MANAS" in res_data["resilience_message_en"]
    assert "14416" in res_data["emergency_sos_hotlines"]["tele_manas_national"]

    # 2. Verify Welfare Officer sees the emergency intervention created in the triage queue
    intv_resp = client.get("/api/welfare/interventions", headers={"Authorization": f"Bearer {welfare_token}"})
    assert intv_resp.status_code == 200
    interventions = intv_resp.json()

    urgent_nlp_intv = next((
        i for i in interventions
        if i["personnel_service_number"] == "CT-84920" and "NLP" in (i["recommended_by"] or "")
    ), None)

    assert urgent_nlp_intv is not None, "Emergency NLP intervention was not dispatched to Welfare desk"
    assert urgent_nlp_intv["priority"] == "Urgent - Critical"
    assert urgent_nlp_intv["status"] == "Recommended"
    print("PASS: Multilingual Crisis NLP Scanner successfully detected acute distress and dispatched priority clinical intervention.")

if __name__ == "__main__":
    test_e2e_01_all_four_role_logins_and_jwt_issuance()
    test_e2e_02_rbac_boundary_and_firewall_enforcement()
    test_e2e_03_jawan_checkin_dynamic_stress_propagation()
    test_e2e_04_workload_simulation_dynamic_recalculation()
    test_e2e_05_multilingual_crisis_nlp_priority_triage_dispatch()
    print("\n=======================================================")
    print("ALL EPIC 10.1 END-TO-END INTEGRATION TESTS PASSED (100%)!")
    print("=======================================================")
