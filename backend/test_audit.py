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

def test_audit_logs_feed_authorized():
    """Mini-task 4.4.1: Verify audit logs feed with filtering and pagination for Audit Admin."""
    token = get_auth_token("AUDIT-HQ-OFFICER", "Audit Admin")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch default paginated audit feed
    response = client.get("/api/audit/logs?limit=25", headers=headers)
    assert response.status_code == 200, f"Audit logs failed: {response.text}"
    data = response.json()

    assert data["total_count"] > 0
    assert len(data["logs"]) > 0
    assert data["limit"] == 25

    first_log = data["logs"][0]
    assert "timestamp" in first_log
    assert "user_role" in first_log
    assert "actor_id" in first_log
    assert "action" in first_log
    assert "tamper_hash" in first_log
    assert len(first_log["tamper_hash"]) == 64  # SHA-256 hex string

    # 2. Filter by role (Commanding Officer)
    resp_co = client.get("/api/audit/logs?role=Commanding+Officer", headers=headers)
    assert resp_co.status_code == 200
    co_logs = resp_co.json()
    for l in co_logs["logs"]:
        assert "Commanding Officer" in l["user_role"]

    # 3. Filter by action keyword (LOGIN)
    resp_action = client.get("/api/audit/logs?action=LOGIN", headers=headers)
    assert resp_action.status_code == 200
    login_logs = resp_action.json()
    assert len(login_logs["logs"]) > 0
    for l in login_logs["logs"]:
        assert "login" in l["action"].lower()

    print(f"PASS: Audit log feed verified. Total records: {data['total_count']}.")

def test_audit_logs_rbac_forbidden():
    """Verify non-auditors cannot access immutable security audit logs."""
    jawan_token = get_auth_token("CT-RAMESH-84920", "Jawan")
    resp_jawan = client.get("/api/audit/logs", headers={"Authorization": f"Bearer {jawan_token}"})
    assert resp_jawan.status_code == 403

    co_token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    resp_co = client.get("/api/audit/logs", headers={"Authorization": f"Bearer {co_token}"})
    assert resp_co.status_code == 403

    print("PASS: Jawan and Commanding Officer blocked from Audit Logs with HTTP 403.")

def test_audit_compliance_metrics():
    """Mini-task 4.4.2: Verify real-time APAR decoupling, k-anonymity, and DPDPA compliance metrics."""
    token = get_auth_token("AUDIT-HQ-OFFICER", "Audit Admin")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/audit/compliance-metrics", headers=headers)
    assert response.status_code == 200, f"Compliance metrics failed: {response.text}"
    metrics = response.json()

    # 1. APAR Decoupling Firewall
    apar = metrics["apar_decoupling_firewall"]
    assert "ACTIVE" in apar["status"]
    assert apar["decoupled_records_count"] >= 0
    assert "0 Promotion Linkages Detected" in apar["promotion_linkage_status"]
    assert "DPDPA 2023" in apar["statutory_shield"]

    # 2. k-Anonymity Compliance
    k_anon = metrics["k_anonymity_compliance"]
    assert k_anon["min_platoon_threshold"] == 5
    assert k_anon["battalion_companies_monitored"] == 4
    assert k_anon["suppression_violations"] == 0
    assert "100% COMPLIANT" in k_anon["anonymity_status"]

    # 3. Security Encryption
    sec = metrics["data_retention_and_security"]
    assert "AES-256" in sec["encryption_at_rest"]
    assert "TLS 1.3" in sec["encryption_in_transit"]
    assert "CERTIFIED COMPLIANT" in sec["dpdpa_compliance_rating"]
    assert "MeghRaj" in sec["sovereign_deployment_readiness"]

    # 4. Audit Ledger Health
    health = metrics["audit_ledger_health"]
    assert health["total_audit_entries"] > 0
    assert health["tampering_incidents"] == 0

    print("PASS: Compliance metrics verified (APAR Decoupling, k-Anonymity, DPDPA 2023, Ledger Health).")

def test_audit_verify_tamper():
    """Mini-task 4.4.3: Verify cryptographic SHA-256 tamper verification across audit chain."""
    token = get_auth_token("AUDIT-HQ-OFFICER", "Audit Admin")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post("/api/audit/verify-tamper", headers=headers)
    assert response.status_code == 200, f"Tamper verification failed: {response.text}"
    result = response.json()

    assert result["total_records_verified"] > 0
    assert result["integrity_status"] == "VERIFIED_UNCOMPROMISED"
    assert result["hash_algorithm"] == "SHA-256 (HMAC-Ready)"
    assert len(result["latest_ledger_root_hash"]) == 64  # SHA-256 is 64 hex chars
    assert result["tamper_evidence_detected"] is False

    print(f"PASS: Cryptographic Audit Ledger verified. Verified {result['total_records_verified']} records. Root Hash: {result['latest_ledger_root_hash'][:16]}...")

if __name__ == "__main__":
    test_audit_logs_feed_authorized()
    test_audit_logs_rbac_forbidden()
    test_audit_compliance_metrics()
    test_audit_verify_tamper()
    print("\nALL TASK 4.4 AUTOMATED TESTS PASSED SUCCESSFULLY (100%)!")
