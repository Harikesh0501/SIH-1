import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

client = TestClient(app)

def test_complete_rbac_suite():
    print("==================================================")
    print("STARTING COMPLETE RBAC & ROUTE GUARD TEST SUITE")
    print("==================================================")

    # 1. Login all 3 primary roles to get JWT tokens
    co_login = client.post("/api/auth/login", json={"username": "CO-104-SHARMA", "password": "demo123"}).json()
    co_token = co_login["access_token"]
    
    wo_login = client.post("/api/auth/login", json={"username": "MED-104-MALHOTRA", "password": "demo123"}).json()
    wo_token = wo_login["access_token"]

    jwn_login = client.post("/api/auth/login", json={"username": "CT-RAMESH-84920", "password": "demo123"}).json()
    jwn_token = jwn_login["access_token"]

    print("SUCCESS: Retrieved JWT tokens for CO, Welfare Officer, and Jawan.")

    # -----------------------------------------------------------------
    # Test Task 2.2.3: Welfare Officer Route Guard
    # -----------------------------------------------------------------
    print("\n--- Testing Task 2.2.3: Welfare Officer Route Guard ---")
    # Welfare Officer should SUCCEED
    res_wo = client.get("/api/welfare/clearance-check", headers={"Authorization": f"Bearer {wo_token}"})
    assert res_wo.status_code == 200, f"Expected 200 for WO, got {res_wo.status_code}"
    print("PASS: Welfare Officer successfully granted Level-3 medical clearance.")

    # Commanding Officer should be FORBIDDEN (403)
    res_co_wo = client.get("/api/welfare/clearance-check", headers={"Authorization": f"Bearer {co_token}"})
    assert res_co_wo.status_code == 403, f"Expected 403 for CO on welfare route, got {res_co_wo.status_code}"
    print("PASS: Commanding Officer correctly blocked with 403 Forbidden from welfare triage.")

    # Jawan should be FORBIDDEN (403)
    res_jwn_wo = client.get("/api/welfare/clearance-check", headers={"Authorization": f"Bearer {jwn_token}"})
    assert res_jwn_wo.status_code == 403, f"Expected 403 for Jawan on welfare route, got {res_jwn_wo.status_code}"
    print("PASS: Jawan correctly blocked with 403 Forbidden from welfare triage.")

    # -----------------------------------------------------------------
    # Test Task 2.2.4: Commanding Officer Route Guard
    # -----------------------------------------------------------------
    print("\n--- Testing Task 2.2.4: Commanding Officer Route Guard ---")
    # Commanding Officer should SUCCEED
    res_co = client.get("/api/commander/clearance-check", headers={"Authorization": f"Bearer {co_token}"})
    assert res_co.status_code == 200, f"Expected 200 for CO, got {res_co.status_code}"
    print("PASS: Commanding Officer successfully granted Level-4 strategic command clearance.")

    # Welfare Officer should be FORBIDDEN (403)
    res_wo_co = client.get("/api/commander/clearance-check", headers={"Authorization": f"Bearer {wo_token}"})
    assert res_wo_co.status_code == 403, f"Expected 403 for WO on commander route, got {res_wo_co.status_code}"
    print("PASS: Welfare Officer correctly blocked with 403 Forbidden from commander roster terminal.")

    # Jawan should be FORBIDDEN (403)
    res_jwn_co = client.get("/api/commander/clearance-check", headers={"Authorization": f"Bearer {jwn_token}"})
    assert res_jwn_co.status_code == 403, f"Expected 403 for Jawan on commander route, got {res_jwn_co.status_code}"
    print("PASS: Jawan correctly blocked with 403 Forbidden from commander roster terminal.")

    # -----------------------------------------------------------------
    # Test Task 2.2.5: Jawan Private Enclave Ownership Guard
    # -----------------------------------------------------------------
    print("\n--- Testing Task 2.2.5: Jawan Private Ownership Guard ---")
    db = SessionLocal()
    ramesh = db.query(models.Personnel).filter(models.Personnel.service_number == "CT-84920").first()
    suresh = db.query(models.Personnel).filter(models.Personnel.service_number == "HC-71204").first()
    db.close()

    # Ramesh accessing his own record -> MUST SUCCEED (200)
    res_own = client.get(f"/api/jawan/personnel/{ramesh.id}/verify-access", headers={"Authorization": f"Bearer {jwn_token}"})
    assert res_own.status_code == 200, f"Expected 200 for own record, got {res_own.status_code}"
    print(f"PASS: Jawan Ct. Ramesh ({ramesh.service_number}) authorized to access his own private record.")

    # Ramesh attempting to access Suresh's record -> MUST BE FORBIDDEN (403)
    res_other = client.get(f"/api/jawan/personnel/{suresh.id}/verify-access", headers={"Authorization": f"Bearer {jwn_token}"})
    assert res_other.status_code == 403, f"Expected 403 for snooping on comrade record, got {res_other.status_code}"
    print("PASS: Jawan blocked with 403 Forbidden from inspecting comrade's private health record.")

    # Welfare Officer accessing Ramesh's record -> MUST SUCCEED (200, Clinical Mandate)
    res_wo_dossier = client.get(f"/api/jawan/personnel/{ramesh.id}/verify-access", headers={"Authorization": f"Bearer {wo_token}"})
    assert res_wo_dossier.status_code == 200, f"Expected 200 for WO access, got {res_wo_dossier.status_code}"
    print("PASS: Welfare Officer authorized to inspect personnel file under clinical triage mandate.")

    # -----------------------------------------------------------------
    # Test Task 2.2.6: Automated Audit & Governance Middleware
    # -----------------------------------------------------------------
    print("\n--- Testing Task 2.2.6: Audit & Governance Middleware ---")
    db = SessionLocal()
    audit_count = db.query(models.AuditLog).count()
    assert audit_count > 0, "No audit logs found!"
    print(f"PASS: Audit table has {audit_count} immutable transaction records logged.")
    db.close()

    print("\n=======================================================")
    print("ALL TASK 2.2 RBAC & ROUTE GUARD TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_complete_rbac_suite()
