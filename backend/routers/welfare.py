import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

import models
import schemas
from database import get_db
from auth import get_current_user, require_role
from ml_engine import ml_engine_singleton, MilitaryStressPredictiveEngine
from time_utils import get_ist_now_naive, get_ist_now

router = APIRouter(
    prefix="/api/welfare",
    tags=["Welfare & Medical Officer Clinical Triage Desk"],
    dependencies=[Depends(require_role(["Welfare Officer"]))]
)

# -------------------------------------------------------------
# Mini-task 4.2.1: Priority Clinical Triage Queue
# -------------------------------------------------------------
@router.get("/triage-queue", response_model=List[schemas.TriageItemResponse])
def get_triage_queue(
    company: Optional[str] = Query(None, description="Filter by company, e.g. Alpha, Bravo"),
    risk_level: Optional[str] = Query(None, description="Filter by tier: Critical, Vulnerable, Fatigued, Resilient"),
    search: Optional[str] = Query(None, description="Search by name, service number, or masked ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.2.1: Priority Clinical Triage Queue for Medical Officers.
    Retrieves filtered personnel list ranked by predictive stress score.
    Surfaces crisis flags, primary stress drivers, and active intervention counts.
    """
    query = db.query(models.Personnel)

    # Filter by Company
    if company:
        query = query.filter(models.Personnel.company.ilike(f"%{company.strip()}%"))

    # Filter by Risk Level Tier
    if risk_level:
        query = query.filter(models.Personnel.risk_level.ilike(f"%{risk_level.strip()}%"))

    # Search by full name, service number, or masked ID
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Personnel.full_name.ilike(search_term),
                models.Personnel.service_number.ilike(search_term),
                models.Personnel.masked_id.ilike(search_term)
            )
        )

    # Order descending by stress score (highest risk first)
    personnel_list = query.order_by(desc(models.Personnel.stress_score)).offset(offset).limit(limit).all()

    person_ids = [p.id for p in personnel_list]

    # Batch query active interventions count for all returned personnel
    interventions_counts = {}
    if person_ids:
        counts = db.query(
            models.WelfareIntervention.personnel_id,
            func.count(models.WelfareIntervention.id)
        ).filter(
            models.WelfareIntervention.personnel_id.in_(person_ids),
            models.WelfareIntervention.status.in_(["Recommended", "Approved by CO", "In-Progress"])
        ).group_by(models.WelfareIntervention.personnel_id).all()
        for pid, c in counts:
            interventions_counts[pid] = c

    # Batch query latest assessments for crisis NLP screening
    latest_assessments = {}
    if person_ids:
        assessments = db.query(models.WellnessAssessment).filter(
            models.WellnessAssessment.personnel_id.in_(person_ids)
        ).order_by(desc(models.WellnessAssessment.timestamp)).all()
        for a in assessments:
            if a.personnel_id not in latest_assessments:
                latest_assessments[a.personnel_id] = a

    triage_cards = []
    for p in personnel_list:
        latest_assessment = latest_assessments.get(p.id)
        last_date = latest_assessment.timestamp if latest_assessment else None

        # Check for crisis cues in notes or critical score
        crisis_in_notes = False
        if latest_assessment and latest_assessment.voluntary_notes:
            is_crisis, _ = ml_engine_singleton.screen_crisis_nlp(latest_assessment.voluntary_notes)
            crisis_in_notes = is_crisis

        crisis_flag = bool(p.stress_score >= 80.0 or crisis_in_notes)

        # Extract top stress driver
        top_driver = "Deployment & Operational Strain"
        if p.risk_drivers_json:
            try:
                drivers = json.loads(p.risk_drivers_json)
                if isinstance(drivers, list) and len(drivers) > 0:
                    top_driver = f"{drivers[0].get('feature', 'Deployment Strain')} ({drivers[0].get('impact_pct', 30)}%)"
            except Exception:
                pass

        active_interventions = interventions_counts.get(p.id, 0)

        triage_cards.append(schemas.TriageItemResponse(
            id=p.id,
            service_number=p.service_number,
            masked_id=p.masked_id,
            full_name=p.full_name,
            rank=p.rank,
            company=p.company,
            platoon=p.platoon,
            role=p.role,
            deployment_zone=p.deployment_zone,
            deployment_type=p.deployment_type,
            days_in_current_zone=p.days_in_current_zone,
            leave_cancellations_count=p.leave_cancellations_count,
            consecutive_night_duties=p.consecutive_night_duties,
            stress_score=p.stress_score,
            risk_level=p.risk_level,
            crisis_flag=crisis_flag,
            top_stress_driver=top_driver,
            active_interventions_count=active_interventions,
            last_assessment_date=last_date
        ))

    # Log audit trail for triage queue access
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="VIEW_TRIAGE_QUEUE",
            target_entity="Triage_Queue",
            classification="CONFIDENTIAL - MEDICAL TRIAGE",
            details=f"Welfare Officer {current_user.full_name} loaded triage queue ({len(triage_cards)} personnel retrieved)."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return triage_cards


# -------------------------------------------------------------
# Mini-task 4.2.2: Full Unmasked Soldier Clinical Dossier
# -------------------------------------------------------------
@router.get("/personnel/{personnel_id}/dossier", response_model=schemas.PersonnelDossierResponse)
def get_personnel_clinical_dossier(
    personnel_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.2.2: Comprehensive Soldier Clinical Dossier.
    Unmasks individual operational duty rosters, leave history, biometric logs,
    and calculates 5-factor Explainable AI (XAI) attributions with bilingual narratives.
    Protected under statutory Medical Confidentiality Privilege.
    """
    personnel = db.query(models.Personnel).filter(models.Personnel.id == personnel_id).first()
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel record ID {personnel_id} not found."
        )

    # Fetch operational duty history (last 14 days)
    duty_history_records = db.query(models.DutyRoster).filter(
        models.DutyRoster.personnel_id == personnel_id
    ).order_by(desc(models.DutyRoster.date)).limit(14).all()

    # Fetch leave application and cancellation history
    leave_records = db.query(models.LeaveRecord).filter(
        models.LeaveRecord.personnel_id == personnel_id
    ).order_by(desc(models.LeaveRecord.created_at)).all()

    # Fetch recent self-assessments (last 7)
    recent_assessments = db.query(models.WellnessAssessment).filter(
        models.WellnessAssessment.personnel_id == personnel_id
    ).order_by(desc(models.WellnessAssessment.timestamp)).limit(7).all()

    # Fetch recent biometric telemetry logs (last 7)
    recent_biometrics = db.query(models.BiometricLog).filter(
        models.BiometricLog.personnel_id == personnel_id
    ).order_by(desc(models.BiometricLog.timestamp)).limit(7).all()

    # Fetch existing welfare interventions
    interventions = db.query(models.WelfareIntervention).filter(
        models.WelfareIntervention.personnel_id == personnel_id
    ).order_by(desc(models.WelfareIntervention.created_at)).all()

    # Determine latest biometric and assessment telemetry for real-time XAI attribution
    latest_assessment = recent_assessments[0] if recent_assessments else None
    latest_biometric = recent_biometrics[0] if recent_biometrics else None

    features = {
        "days_in_zone": float(personnel.days_in_current_zone),
        "deployment_type": personnel.deployment_type,
        "consecutive_night_duties": float(personnel.consecutive_night_duties),
        "leave_cancellations": float(personnel.leave_cancellations_count),
        "months_since_leave": float(personnel.months_since_last_leave),
        "mood_score": float(latest_assessment.mood_score) if latest_assessment else 3.0,
        "sleep_hours": float(latest_biometric.sleep_duration_hours) if latest_biometric else (float(latest_assessment.sleep_hours) if latest_assessment else 6.5),
        "physical_exhaustion": float(latest_assessment.physical_exhaustion) if latest_assessment else 2.0,
        "phq4_score": float(latest_assessment.phq4_score) if latest_assessment else 2.0,
        "hrv_rmssd": float(latest_biometric.hrv_rmssd) if latest_biometric else 48.0,
        "resting_hr": float(latest_biometric.resting_heart_rate) if latest_biometric else 72.0,
        "voluntary_text": latest_assessment.voluntary_notes if latest_assessment else ""
    }

    # Execute full XAI predictive inference pipeline
    xai_result = ml_engine_singleton.predict_stress(features)

    factors = [
        schemas.XAIFactor(
            feature=f["feature"],
            feature_hi=f["feature_hi"],
            category=f["category"],
            impact_pct=f["impact_pct"],
            description=f["description"]
        )
        for f in xai_result["explainable_factors"]
    ]

    xai_attribution = schemas.XAIAttributionResponse(
        factors=factors,
        clinical_narrative_en=xai_result["narrative_summary"],
        clinical_narrative_hi=xai_result["narrative_summary_hi"]
    )

    # Synthesize concrete prescribed recommendations
    prescribed_list = [
        schemas.PrescribedRecommendation(
            action_type="Primary Clinical Prescription",
            title=xai_result["recommended_intervention"].split(":")[0] if ":" in xai_result["recommended_intervention"] else "Welfare Action",
            priority=xai_result["recommended_priority"],
            rationale=xai_result["recommended_intervention"]
        )
    ]

    if personnel.leave_cancellations_count >= 2:
        prescribed_list.append(schemas.PrescribedRecommendation(
            action_type="Administrative Relief",
            title="10-Day Mandatory Rest & Recuperation (R&R) Leave",
            priority="Elevated",
            rationale=f"Personnel has accumulated {personnel.leave_cancellations_count} cancelled leaves over {personnel.months_since_last_leave} months. Mandatory family decompression required."
        ))

    if personnel.consecutive_night_duties >= 5:
        prescribed_list.append(schemas.PrescribedRecommendation(
            action_type="Operational Duty Rebalancing",
            title="Circadian Duty Swap (Daytime Administration)",
            priority="Elevated",
            rationale=f"Troop has logged {personnel.consecutive_night_duties} consecutive nocturnal ambush shifts. Circadian reset recommended."
        ))

    # Construct intervention responses with personnel details
    intervention_responses = []
    for intv in interventions:
        intervention_responses.append(schemas.InterventionResponse(
            id=intv.id,
            personnel_id=intv.personnel_id,
            personnel_name=personnel.full_name,
            personnel_rank=personnel.rank,
            personnel_company=personnel.company,
            personnel_service_number=personnel.service_number,
            intervention_type=intv.intervention_type,
            priority=intv.priority,
            status=intv.status,
            recommended_by=intv.recommended_by,
            assigned_counselor=intv.assigned_counselor,
            action_details=intv.action_details,
            clinical_notes=intv.clinical_notes,
            created_at=intv.created_at,
            resolved_at=intv.resolved_at
        ))

    # Log audit event for unmasking a confidential medical dossier
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="UNMASK_PERSONNEL_DOSSIER",
            target_entity="Personnel",
            target_id=str(personnel.id),
            classification="CONFIDENTIAL - MEDICAL PRIVILEGE",
            details=f"Welfare Officer {current_user.full_name} unmasked complete clinical dossier for {personnel.full_name} ({personnel.service_number})."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.PersonnelDossierResponse(
        personnel=schemas.PersonnelResponse.model_validate(personnel),
        xai_attribution=xai_attribution,
        duty_history=[schemas.DutyRosterResponse.model_validate(d) for d in duty_history_records],
        leave_history=[schemas.LeaveRecordResponse.model_validate(l) for l in leave_records],
        recent_assessments=[schemas.AssessmentResponse.model_validate(a) for a in recent_assessments],
        recent_biometrics=[schemas.BiometricResponse.model_validate(b) for b in recent_biometrics],
        interventions=intervention_responses,
        prescribed_recommendations=prescribed_list
    )


# -------------------------------------------------------------
# Mini-task 4.2.3: Dispatch New Welfare Intervention
# -------------------------------------------------------------
@router.post("/interventions", response_model=schemas.InterventionResponse, status_code=status.HTTP_201_CREATED)
def create_welfare_intervention(
    req: schemas.InterventionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.2.3: Dispatches a new clinical or administrative welfare intervention.
    Enforces accountability: assigns counselor, records priority, and logs action to audit trail.
    """
    personnel = db.query(models.Personnel).filter(models.Personnel.id == req.personnel_id).first()
    if not personnel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel record ID {req.personnel_id} not found."
        )

    new_intv = models.WelfareIntervention(
        personnel_id=req.personnel_id,
        intervention_type=req.intervention_type,
        priority=req.priority,
        status="Recommended",
        recommended_by=f"{current_user.full_name} ({current_user.rank})",
        assigned_counselor=req.assigned_counselor or f"{current_user.full_name} (Base Medical Officer)",
        action_details=req.action_details,
        clinical_notes=req.clinical_notes,
        created_at=get_ist_now_naive()
    )

    db.add(new_intv)
    db.commit()
    db.refresh(new_intv)

    # Log audit event for dispatching intervention
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="DISPATCH_INTERVENTION",
            target_entity="WelfareIntervention",
            target_id=str(new_intv.id),
            classification="CONFIDENTIAL - WELFARE MANDATE",
            details=f"Dispatched '{new_intv.intervention_type}' for {personnel.full_name} ({personnel.service_number}) with priority '{new_intv.priority}'."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.InterventionResponse(
        id=new_intv.id,
        personnel_id=new_intv.personnel_id,
        personnel_name=personnel.full_name,
        personnel_rank=personnel.rank,
        personnel_company=personnel.company,
        personnel_service_number=personnel.service_number,
        intervention_type=new_intv.intervention_type,
        priority=new_intv.priority,
        status=new_intv.status,
        recommended_by=new_intv.recommended_by,
        assigned_counselor=new_intv.assigned_counselor,
        action_details=new_intv.action_details,
        clinical_notes=new_intv.clinical_notes,
        created_at=new_intv.created_at,
        resolved_at=new_intv.resolved_at
    )


# -------------------------------------------------------------
# Mini-task 4.2.4: Update Welfare Intervention Status & Notes
# -------------------------------------------------------------
@router.patch("/interventions/{intervention_id}/status", response_model=schemas.InterventionResponse)
def update_intervention_status(
    intervention_id: int,
    req: schemas.InterventionUpdateStatus,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.2.4: Updates lifecycle status of an existing intervention
    (Recommended -> Approved by CO -> In-Progress -> Completed / Deferred)
    and appends clinical progress notes.
    """
    intv = db.query(models.WelfareIntervention).filter(
        models.WelfareIntervention.id == intervention_id
    ).first()

    if not intv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intervention record ID {intervention_id} not found."
        )

    old_status = intv.status
    intv.status = req.status

    if req.status == "Completed" and not intv.resolved_at:
        intv.resolved_at = get_ist_now_naive()

    if req.clinical_notes:
        timestamp_str = get_ist_now().strftime("%Y-%m-%d %H:%M IST")
        officer_note = f"\n[{timestamp_str} - {current_user.full_name} ({current_user.rank})]: {req.clinical_notes}"
        intv.clinical_notes = (intv.clinical_notes or "") + officer_note

    db.commit()
    db.refresh(intv)

    personnel = db.query(models.Personnel).filter(models.Personnel.id == intv.personnel_id).first()

    # Log audit event for status update
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="UPDATE_INTERVENTION_STATUS",
            target_entity="WelfareIntervention",
            target_id=str(intv.id),
            classification="CONFIDENTIAL - WELFARE MANDATE",
            details=f"Intervention ID {intv.id} status changed from '{old_status}' to '{intv.status}' by {current_user.full_name}."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.InterventionResponse(
        id=intv.id,
        personnel_id=intv.personnel_id,
        personnel_name=personnel.full_name if personnel else "Personnel",
        personnel_rank=personnel.rank if personnel else "Rank",
        personnel_company=personnel.company if personnel else "Company",
        personnel_service_number=personnel.service_number if personnel else "SRV",
        intervention_type=intv.intervention_type,
        priority=intv.priority,
        status=intv.status,
        recommended_by=intv.recommended_by,
        assigned_counselor=intv.assigned_counselor,
        action_details=intv.action_details,
        clinical_notes=intv.clinical_notes,
        created_at=intv.created_at,
        resolved_at=intv.resolved_at
    )


# -------------------------------------------------------------
# Mini-task 4.2.5: List All Interventions Across Battalion
# -------------------------------------------------------------
@router.get("/interventions", response_model=List[schemas.InterventionResponse])
def list_welfare_interventions(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: Recommended, Approved by CO, In-Progress, Completed"),
    priority_filter: Optional[str] = Query(None, alias="priority", description="Filter by priority: Routine, Elevated, Urgent - Critical"),
    company_filter: Optional[str] = Query(None, alias="company", description="Filter by company"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.2.5: Comprehensive list of active and historical welfare interventions.
    Allows medical officers to track battalion-wide psychological support and R&R leave status.
    """
    query = db.query(models.WelfareIntervention, models.Personnel).join(
        models.Personnel, models.WelfareIntervention.personnel_id == models.Personnel.id
    )

    if status_filter:
        query = query.filter(models.WelfareIntervention.status.ilike(f"%{status_filter.strip()}%"))

    if priority_filter:
        query = query.filter(models.WelfareIntervention.priority.ilike(f"%{priority_filter.strip()}%"))

    if company_filter:
        query = query.filter(models.Personnel.company.ilike(f"%{company_filter.strip()}%"))

    results = query.order_by(desc(models.WelfareIntervention.created_at)).offset(offset).limit(limit).all()

    response_list = []
    for intv, person in results:
        response_list.append(schemas.InterventionResponse(
            id=intv.id,
            personnel_id=intv.personnel_id,
            personnel_name=person.full_name,
            personnel_rank=person.rank,
            personnel_company=person.company,
            personnel_service_number=person.service_number,
            intervention_type=intv.intervention_type,
            priority=intv.priority,
            status=intv.status,
            recommended_by=intv.recommended_by,
            assigned_counselor=intv.assigned_counselor,
            action_details=intv.action_details,
            clinical_notes=intv.clinical_notes,
            created_at=intv.created_at,
            resolved_at=intv.resolved_at
        ))

    return response_list
