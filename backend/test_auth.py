import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

client = TestClient(app)

def test_authentication_suite():
    print("--- 1. Testing System Health Check ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("Health check PASS:", res.json()["system"])

    print("\n--- 2. Testing Invalid Login Rejection ---")
    bad_login = client.post("/api/auth/login", json={"username": "CO-104-SHARMA", "password": "WRONG_PASSWORD"})
    assert bad_login.status_code == 401, f"Expected 401, got {bad_login.status_code}"
    print("Invalid login correctly rejected PASS (401 Unauthorized)")

    print("\n--- 3. Testing Valid Login for All 4 Roles ---")
    roles = [
        ("CO-104-SHARMA", "Commanding Officer", "Col. V.K. Sharma"),
        ("MED-104-MALHOTRA", "Welfare Officer", "Dr. Rajiv Malhotra"),
        ("CT-RAMESH-84920", "Jawan", "Ct. Ramesh Kumar"),
        ("AUDIT-HQ-OFFICER", "Audit Admin", "Insp. Gen. R.S. Verma")
    ]

    tokens = {}
    for username, expected_role, expected_name in roles:
        res = client.post("/api/auth/login", json={"username": username, "password": "demo123"})
        assert res.status_code == 200, f"Login failed for {username}: {res.text}"
        data = res.json()
        assert "access_token" in data, "Token missing in response"
        assert data["user"]["role"] == expected_role, f"Expected role {expected_role}, got {data['user']['role']}"
        assert data["user"]["full_name"] == expected_name, f"Expected name {expected_name}, got {data['user']['full_name']}"
        tokens[expected_role] = data["access_token"]
        print(f"Login PASS for {expected_role}: {expected_name} (JWT issued, {len(data['access_token'])} chars)")

    print("\n--- 4. Testing /api/auth/me Profile Extraction ---")
    co_token = tokens["Commanding Officer"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {co_token}"})
    assert me_res.status_code == 200, f"Failed /api/auth/me: {me_res.text}"
    assert me_res.json()["role"] == "Commanding Officer"
    print("Verified JWT bearer token extraction PASS (/api/auth/me)")

    print("\n--- 5. Testing /api/auth/logout ---")
    logout_res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {co_token}"})
    assert logout_res.status_code == 200
    print("Session logout PASS")

    print("\n--- 6. Verifying Audit Log Entries for Auth Events ---")
    db = SessionLocal()
    recent_logs = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(20).all()
    actions = [log.action for log in recent_logs]
    print("Recent Audit Actions:", actions)
    assert "LOGIN_SUCCESS" in actions
    assert "LOGIN_FAILURE" in actions
    assert "LOGOUT" in actions
    db.close()
    print("Audit Logging PASS: All login successes, failures, and logouts recorded.")

    print("\n==============================================")
    print("ALL TASK 2.1 AUTHENTICATION TESTS PASSED 100%!")
    print("==============================================")

if __name__ == "__main__":
    test_authentication_suite()
