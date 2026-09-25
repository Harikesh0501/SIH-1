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

def test_welfare_triage_queue_authorized():
    """Mini-task 4.2.1: Verify clinical triage queue for authorized Welfare Officer."""
    token = get_auth_token("MED-104-MALHOTRA", "Welfare Officer")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch entire queue
    response = client.get("/api/welfare/triage-queue", headers=headers)
    assert response.status_code == 200, f"Triage queue failed: {response.text}"
    queue = response.json()
    assert len(queue) >= 63, f"Expected at least 63 personnel in triage queue, got {len(queue)}"

    # Verify descending sort order by stress score
    for i in range(len(queue) - 1):
        assert queue[i]["stress_score"] >= queue[i+1]["stress_score"], "Queue must be sorted descending by stress_score"

    first_item = queue[0]
    assert "service_number" in first_item
    assert "masked_id" in first_item
    assert "risk_level" in first_item
    assert "top_stress_driver" in first_item
    assert "crisis_flag" in first_item
    assert "active_interventions_count" in first_item

    # 2. Filter by company
    resp_charlie = client.get("/api/welfare/triage-queue?company=Charlie", headers=headers)
    assert resp_charlie.status_code == 200
    charlie_list = resp_charlie.json()
    assert len(charlie_list) == 16
    for item in charlie_list:
        assert "Charlie" in item["company"]

    # 3. Filter by risk tier (Critical)
    resp_critical = client.get("/api/welfare/triage-queue?risk_level=Critical", headers=headers)
    assert resp_critical.status_code == 200
    crit_list = resp_critical.json()
    for item in crit_list:
        assert item["risk_level"] == "Critical"
        assert item["stress_score"] >= 80.0

    # 4. Search by name
    resp_search = client.get("/api/welfare/triage-queue?search=Ramesh", headers=headers)
    assert resp_search.status_code == 200
    search_list = resp_search.json()
    assert len(search_list) >= 1
    assert "Ramesh" in search_list[0]["full_name"]

    print(f"PASS: Triage queue verified. {len(queue)} personnel sorted, filtered, and searched.")

def test_welfare_triage_queue_rbac_forbidden():
    """Verify Commanding Officer and Jawans are strictly blocked from triage queue."""
    co_token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    resp_co = client.get("/api/welfare/triage-queue", headers={"Authorization": f"Bearer {co_token}"})
    assert resp_co.status_code == 403

    jawan_token = get_auth_token("CT-RAMESH-84920", "Jawan")
    resp_jawan = client.get("/api/welfare/triage-queue", headers={"Authorization": f"Bearer {jawan_token}"})
    assert resp_jawan.status_code == 403

    print("PASS: CO and Jawan strictly blocked from Welfare Triage Queue with HTTP 403.")

def test_welfare_personnel_dossier():
    """Mini-task 4.2.2: Verify full unmasked dossier with 5-factor XAI and clinical narratives."""
    token = get_auth_token("MED-104-MALHOTRA", "Welfare Officer")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    ramesh = db.query(models.Personnel).filter(models.Personnel.service_number == "CT-84920").first()
    assert ramesh is not None, "Constable Ramesh not found in database"
    ramesh_id = ramesh.id
    db.close()

    response = client.get(f"/api/welfare/personnel/{ramesh_id}/dossier", headers=headers)
    assert response.status_code == 200, f"Dossier failed: {response.text}"
    dossier = response.json()

    # Verify personnel unmasked details
    p = dossier["personnel"]
    assert p["id"] == ramesh_id
    assert p["full_name"] == "Ct. Ramesh Kumar"
    assert p["service_number"] == "CT-84920"
    assert p["company"] == "Alpha Company"

    # Verify 5-factor XAI attribution
    xai = dossier["xai_attribution"]
    assert len(xai["factors"]) == 5
    for factor in xai["factors"]:
        assert factor["impact_pct"] > 0
        assert len(factor["feature"]) > 0
        assert len(factor["feature_hi"]) > 0
        assert len(factor["description"]) > 0

    assert "Overall Stress Risk is evaluated at" in xai["clinical_narrative_en"]
    assert "कुल तनाव जोखिम" in xai["clinical_narrative_hi"]

    # Verify operational histories
    assert len(dossier["duty_history"]) > 0
    assert len(dossier["leave_history"]) > 0
    assert len(dossier["recent_assessments"]) > 0
    assert len(dossier["recent_biometrics"]) > 0
    assert len(dossier["prescribed_recommendations"]) > 0

    # Verify audit log entry for unmasking
    db = SessionLocal()
    unmask_log = db.query(models.AuditLog).filter(
        models.AuditLog.action == "UNMASK_PERSONNEL_DOSSIER",
        models.AuditLog.target_id == str(ramesh_id)
    ).first()
    assert unmask_log is not None
    assert unmask_log.actor_id == "MED-104-MALHOTRA"
    assert unmask_log.classification == "CONFIDENTIAL - MEDICAL PRIVILEGE"
    db.close()

    # Verify CO cannot access dossier
    co_token = get_auth_token("CO-104-SHARMA", "Commanding Officer")
    resp_co = client.get(f"/api/welfare/personnel/{ramesh_id}/dossier", headers={"Authorization": f"Bearer {co_token}"})
    assert resp_co.status_code == 403

    print(f"PASS: Unmasked Clinical Dossier verified for {p['full_name']} with XAI and Audit Log.")

def test_welfare_intervention_lifecycle():
    """Mini-tasks 4.2.3, 4.2.4 & 4.2.5: Verify dispatching, updating status, and listing interventions."""
    token = get_auth_token("MED-104-MALHOTRA", "Welfare Officer")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    person = db.query(models.Personnel).first()
    person_id = person.id
    db.close()

    # Mini-task 4.2.3: Dispatch new intervention
    dispatch_payload = {
        "personnel_id": person_id,
        "intervention_type": "Mandatory 10-Day R&R Leave",
        "priority": "Urgent - Critical",
        "assigned_counselor": "Dr. Rajiv Malhotra",
        "action_details": "Immediate 10-day leave authorization due to continuous high-altitude border deployment.",
        "clinical_notes": "Troop reported severe sleep disruption and fatigue."
    }
    resp_create = client.post("/api/welfare/interventions", json=dispatch_payload, headers=headers)
    assert resp_create.status_code == 201, f"Create intervention failed: {resp_create.text}"
    intv = resp_create.json()
    intv_id = intv["id"]
    assert intv["status"] == "Recommended"
    assert intv["priority"] == "Urgent - Critical"
    assert intv["intervention_type"] == "Mandatory 10-Day R&R Leave"
    print(f"PASS: Dispatched intervention ID {intv_id}.")

    # Mini-task 4.2.4: Update status to In-Progress, then Completed
    patch_payload_1 = {
        "status": "In-Progress",
        "clinical_notes": "Commanding Officer approved leave; flight ticket booked."
    }
    resp_patch_1 = client.patch(f"/api/welfare/interventions/{intv_id}/status", json=patch_payload_1, headers=headers)
    assert resp_patch_1.status_code == 200
    assert resp_patch_1.json()["status"] == "In-Progress"
    assert "Commanding Officer approved leave" in resp_patch_1.json()["clinical_notes"]

    patch_payload_2 = {
        "status": "Completed",
        "clinical_notes": "Soldier reported back to base refreshed; post-leave HRV stabilized."
    }
    resp_patch_2 = client.patch(f"/api/welfare/interventions/{intv_id}/status", json=patch_payload_2, headers=headers)
    assert resp_patch_2.status_code == 200
    assert resp_patch_2.json()["status"] == "Completed"
    assert resp_patch_2.json()["resolved_at"] is not None
    print(f"PASS: Intervention ID {intv_id} transitioned to Completed with resolved timestamp.")

    # Mini-task 4.2.5: List interventions across battalion
    resp_list = client.get("/api/welfare/interventions", headers=headers)
    assert resp_list.status_code == 200
    all_intvs = resp_list.json()
    assert len(all_intvs) >= 2  # Seeded 1 + created 1

    # Filter list by status=Completed
    resp_completed = client.get("/api/welfare/interventions?status=Completed", headers=headers)
    assert resp_completed.status_code == 200
    completed_list = resp_completed.json()
    assert any(i["id"] == intv_id for i in completed_list)

    print(f"PASS: Listed battalion interventions ({len(all_intvs)} total). Lifecycle fully verified.")

if __name__ == "__main__":
    test_welfare_triage_queue_authorized()
    test_welfare_triage_queue_rbac_forbidden()
    test_welfare_personnel_dossier()
    test_welfare_intervention_lifecycle()
    print("\nALL TASK 4.2 AUTOMATED TESTS PASSED SUCCESSFULLY (100%)!")
