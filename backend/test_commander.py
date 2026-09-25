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

def test_commander_readiness_kpi_authorized():
    """Mini-task 4.1.1: Verify readiness KPI endpoint for Commanding Officer."""
    token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/commander/readiness-kpi", headers=headers)
    assert response.status_code == 200, f"KPI failed: {response.text}"
    data = response.json()
    
    assert data["battalion_name"] == "104 BN CRPF / SPECIAL OPERATIONS"
    assert data["total_active_personnel"] >= 63
    assert 0.0 <= data["force_readiness_index"] <= 100.0
    assert 0.0 <= data["average_stress_score"] <= 100.0
    assert data["critical_cases_count"] >= 0
    assert data["vulnerable_cases_count"] >= 0
    assert data["fatigued_cases_count"] >= 0
    assert data["resilient_cases_count"] >= 0
    assert data["k_anonymity_enforced"] is True
    assert "timestamp" in data
    
    # Check sum of tiers equals total personnel
    tier_sum = (
        data["resilient_cases_count"] +
        data["fatigued_cases_count"] +
        data["vulnerable_cases_count"] +
        data["critical_cases_count"]
    )
    assert tier_sum == data["total_active_personnel"]
    print(f"PASS: Readiness KPI verified. Total Personnel: {data['total_active_personnel']}, FRI: {data['force_readiness_index']}%, Avg Stress: {data['average_stress_score']}")

def test_commander_readiness_kpi_rbac_forbidden():
    """Verify non-commanders are blocked from commander endpoints."""
    # Jawan should receive 403 Forbidden
    jawan_token = get_auth_token("CT-RAMESH-84920", "Jawan")
    resp_jawan = client.get("/api/commander/readiness-kpi", headers={"Authorization": f"Bearer {jawan_token}"})
    assert resp_jawan.status_code == 403
    
    # Welfare Officer should receive 403 Forbidden
    welfare_token = get_auth_token("MED-104-MALHOTRA", "Welfare Officer")
    resp_welfare = client.get("/api/commander/readiness-kpi", headers={"Authorization": f"Bearer {welfare_token}"})
    assert resp_welfare.status_code == 403
    print("PASS: Non-commanders strictly blocked with HTTP 403.")

def test_commander_company_heatmap_k_anonymity():
    """Mini-task 4.1.2: Verify Company Heatmap with k-Anonymity (k >= 5)."""
    token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/commander/company-heatmap", headers=headers)
    assert response.status_code == 200, f"Heatmap failed: {response.text}"
    companies = response.json()
    
    assert len(companies) == 4, f"Expected 4 companies, got {len(companies)}"
    company_names = [c["company_name"] for c in companies]
    assert "Alpha Company" in company_names
    assert "Bravo Company" in company_names
    assert "Charlie Company" in company_names
    assert "Delta Company" in company_names
    
    for c in companies:
        # Enforce k-anonymity guarantee: group strength must be >= 5
        assert c["strength"] >= 5, f"k-Anonymity violated in {c['company_name']}: strength < 5"
        assert c["average_days_deployed"] >= 0
        assert 0.0 <= c["average_stress_score"] <= 100.0
        assert c["company_risk_level"] in ["Resilient", "Fatigued", "Vulnerable", "Critical"]
        
        # Risk distribution check
        dist = c["risk_distribution"]
        total_pct = dist["resilient_pct"] + dist["fatigued_pct"] + dist["vulnerable_pct"] + dist["critical_pct"]
        assert 98.0 <= total_pct <= 102.0, f"Distribution percentages must sum to ~100%: got {total_pct}"
        
        # Verify no individual soldier PII or names leaked in the heatmap
        assert "full_name" not in c
        assert "service_number" not in c
        assert "phone_masked" not in c
        assert "voluntary_notes" not in c
        assert len(c["recommended_action"]) > 10

    print(f"PASS: Company Heatmap verified across {len(companies)} companies with k-anonymity.")

def test_commander_simulate_workload():
    """Mini-task 4.1.3: Verify dynamic What-If workload simulator."""
    token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test Charlie Company simulation (advancing rotation by 14 days, granting 6 R&R leaves)
    payload = {
        "company": "Charlie Company",
        "rotate_to_base_days_earlier": 14,
        "mandatory_rr_leave_jawans_count": 6
    }
    response = client.post("/api/commander/simulate-workload", json=payload, headers=headers)
    assert response.status_code == 200, f"Simulation failed: {response.text}"
    sim_data = response.json()
    
    assert sim_data["company"] == "Charlie Company"
    assert sim_data["current_burnout_risk"] > sim_data["projected_burnout_risk"]
    assert sim_data["risk_reduction_pct"] > 0.0
    assert sim_data["projected_readiness_increase_pct"] > 0.0
    assert sim_data["prevented_critical_cases"] >= 0
    assert "Simulation for Charlie Company" in sim_data["recommendation_summary"]
    
    # Test partial name matching (e.g. "Bravo" instead of "Bravo Company")
    resp_partial = client.post("/api/commander/simulate-workload", json={
        "company": "Bravo",
        "rotate_to_base_days_earlier": 10,
        "mandatory_rr_leave_jawans_count": 4
    }, headers=headers)
    assert resp_partial.status_code == 200
    assert resp_partial.json()["company"] == "Bravo Company"
    
    # Test non-existent company returns 404
    resp_404 = client.post("/api/commander/simulate-workload", json={
        "company": "NonExistentEcho",
        "rotate_to_base_days_earlier": 10,
        "mandatory_rr_leave_jawans_count": 2
    }, headers=headers)
    assert resp_404.status_code == 404
    print(f"PASS: Dynamic Workload Simulator verified. Burnout dropped by {sim_data['risk_reduction_pct']}%.")

def test_commander_export_report():
    """Mini-task 4.1.4: Verify structured executive report generation with digital signature."""
    token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/commander/export-report", headers=headers)
    assert response.status_code == 200, f"Export report failed: {response.text}"
    report = response.json()
    
    assert report["report_id"].startswith("REP-104BN-")
    assert report["security_classification"] == "SECRET - FOR BATTALION COMMANDER EYES ONLY"
    assert "Col. V.K. Sharma" in report["commanding_officer"]
    assert len(report["company_readiness_breakdown"]) == 4
    assert len(report["critical_action_items"]) > 0
    assert "quarantined from the Annual Confidential Report" in report["apar_immunity_seal"]
    assert len(report["digital_signature_hash"]) == 64  # SHA-256 is 64 hex characters
    
    # Verify audit log recorded this action
    db = SessionLocal()
    last_log = db.query(models.AuditLog).filter(
        models.AuditLog.action == "EXPORT_EXECUTIVE_REPORT"
    ).order_by(models.AuditLog.id.desc()).first()
    assert last_log is not None
    assert last_log.actor_id == "CO-104-SHARMA"
    assert last_log.classification == "SECRET - OFFICIAL BRIEFING"
    db.close()
    
    print(f"PASS: Executive Report verified. Report ID: {report['report_id']}, SHA-256: {report['digital_signature_hash'][:16]}...")

if __name__ == "__main__":
    test_commander_readiness_kpi_authorized()
    test_commander_readiness_kpi_rbac_forbidden()
    test_commander_company_heatmap_k_anonymity()
    test_commander_simulate_workload()
    test_commander_export_report()
    print("\nALL TASK 4.1 AUTOMATED TESTS PASSED SUCCESSFULLY (100%)!")
