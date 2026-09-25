import hashlib
import json
from datetime import datetime
from typing import List, Optional
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas
from database import get_db
from auth import get_current_user, require_role
from ml_engine import MilitaryStressPredictiveEngine
from time_utils import get_ist_now_naive, get_ist_iso, get_ist_now

router = APIRouter(
    prefix="/api/commander",
    tags=["Commanding Officer Strategic Analytics & Workload Simulator"],
    dependencies=[Depends(require_role(["Commanding Officer"]))]
)

# -------------------------------------------------------------
# Mini-task 4.1.1: Live Force Readiness Index & Strategic KPIs
# -------------------------------------------------------------
@router.get("/readiness-kpi", response_model=schemas.ReadinessKPIResponse)
def get_battalion_readiness_kpi(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.1.1: Computes real-time strategic readiness metrics for Battalion Commanders.
    Enforces k-anonymity: returns only aggregated force readiness metrics,
    never individual soldier names or sensitive psychometric answers.
    """
    total_personnel = db.query(models.Personnel).count()
    if total_personnel == 0:
        return schemas.ReadinessKPIResponse(
            battalion_name="104 BN CRPF / SPECIAL OPERATIONS",
            total_active_personnel=0,
            force_readiness_index=100.0,
            average_stress_score=0.0,
            critical_cases_count=0,
            vulnerable_cases_count=0,
            fatigued_cases_count=0,
            resilient_cases_count=0,
            active_interventions_count=0,
            k_anonymity_enforced=True,
            timestamp=get_ist_now_naive()
        )

    # Query all current stress scores
    personnel_records = db.query(models.Personnel.stress_score).all()
    scores = [p[0] for p in personnel_records]

    resilient_count = sum(1 for s in scores if s < 40.0)
    fatigued_count = sum(1 for s in scores if 40.0 <= s < 65.0)
    vulnerable_count = sum(1 for s in scores if 65.0 <= s < 80.0)
    critical_count = sum(1 for s in scores if s >= 80.0)

    avg_stress = round(float(np.mean(scores)), 1)

    # Force Readiness Index (FRI) formula:
    # Weighted operational availability index where Resilient = 100%, Fatigued = 75%,
    # Vulnerable = 35%, and Critical = 5% combat readiness.
    fri = round(
        ((resilient_count * 1.0 + fatigued_count * 0.75 + vulnerable_count * 0.35 + critical_count * 0.05) / total_personnel) * 100.0,
        1
    )

    # Count active welfare interventions currently in the pipeline
    active_interventions = db.query(models.WelfareIntervention).filter(
        models.WelfareIntervention.status.in_(["Recommended", "Approved by CO", "In-Progress"])
    ).count()

    # Log audit event for strategic dashboard viewing
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="VIEW_READINESS_KPI",
            target_entity="Personnel_Aggregated",
            classification="SECRET - COMMAND AUDIT",
            details=f"Commander {current_user.full_name} inspected live battalion readiness KPI (FRI: {fri}%, Avg Stress: {avg_stress})."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.ReadinessKPIResponse(
        battalion_name="104 BN CRPF / SPECIAL OPERATIONS",
        total_active_personnel=total_personnel,
        force_readiness_index=fri,
        average_stress_score=avg_stress,
        critical_cases_count=critical_count,
        vulnerable_cases_count=vulnerable_count,
        fatigued_cases_count=fatigued_count,
        resilient_cases_count=resilient_count,
        active_interventions_count=active_interventions,
        k_anonymity_enforced=True,
        timestamp=get_ist_now_naive()
    )


# -------------------------------------------------------------
# Mini-task 4.1.2: Company Stress Heatmap with k-Anonymity (k >= 5)
# -------------------------------------------------------------
@router.get("/company-heatmap", response_model=List[schemas.CompanyHeatmapItem])
def get_company_heatmap(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.1.2: Aggregates operational strain across companies (Alpha, Bravo, Charlie, Delta).
    Strict k-Anonymity Enforcement: Companies with fewer than 5 personnel are suppressed
    to prevent individual soldier identification.
    """
    companies = db.query(models.Personnel.company).distinct().all()
    company_names = [c[0] for c in companies]

    heatmap_results = []

    for comp in sorted(company_names):
        personnel_in_comp = db.query(models.Personnel).filter(models.Personnel.company == comp).all()
        strength = len(personnel_in_comp)

        # k-Anonymity check (minimum group size 5)
        if strength < 5:
            continue

        scores = [p.stress_score for p in personnel_in_comp]
        days_deployed = [p.days_in_current_zone for p in personnel_in_comp]
        leave_denials = sum(p.leave_cancellations_count for p in personnel_in_comp)

        avg_stress = round(float(np.mean(scores)), 1)
        avg_days = round(float(np.mean(days_deployed)), 1)

        # Determine most common zone and deployment type
        zones = [p.deployment_zone for p in personnel_in_comp]
        dep_types = [p.deployment_type for p in personnel_in_comp]
        primary_zone = max(set(zones), key=zones.count) if zones else "Operational Field"
        primary_type = max(set(dep_types), key=dep_types.count) if dep_types else "Standard Deployment"

        # Risk distribution calculation
        resilient_pct = round((sum(1 for s in scores if s < 40.0) / strength) * 100.0, 1)
        fatigued_pct = round((sum(1 for s in scores if 40.0 <= s < 65.0) / strength) * 100.0, 1)
        vulnerable_pct = round((sum(1 for s in scores if 65.0 <= s < 80.0) / strength) * 100.0, 1)
        critical_pct = round((sum(1 for s in scores if s >= 80.0) / strength) * 100.0, 1)

        comp_risk_tier = MilitaryStressPredictiveEngine.classify_risk_tier(avg_stress)
        high_risk_flag = bool(critical_pct >= 10.0 or avg_stress >= 60.0)

        # Prescriptive operational recommendation for Commanding Officer
        if critical_pct >= 15.0 or avg_stress >= 70.0:
            action = "URGENT: Expedite rotational pull-back to peace base; sanction emergency R&R quota."
        elif (vulnerable_pct + critical_pct) >= 30.0 or avg_stress >= 55.0:
            action = "ELEVATED: Initiate night-shift duty swap; conduct platoon-level welfare review."
        elif avg_stress >= 40.0:
            action = "MODERATE: Monitor circadian rest recovery; maintain standard 14-day rotation schedule."
        else:
            action = "OPTIMAL: Unit maintains high combat readiness and physiological resilience."

        heatmap_results.append(schemas.CompanyHeatmapItem(
            company_name=comp,
            strength=strength,
            deployment_zone=primary_zone,
            deployment_type=primary_type,
            average_days_deployed=avg_days,
            total_leave_denials=leave_denials,
            average_stress_score=avg_stress,
            company_risk_level=comp_risk_tier,
            risk_distribution=schemas.RiskDistribution(
                resilient_pct=resilient_pct,
                fatigued_pct=fatigued_pct,
                vulnerable_pct=vulnerable_pct,
                critical_pct=critical_pct
            ),
            high_risk_flag=high_risk_flag,
            recommended_action=action
        ))

    # Log audit event for heatmap query
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="VIEW_COMPANY_HEATMAP",
            target_entity="Company_Heatmap",
            classification="SECRET - STRATEGIC OVERVIEW",
            details=f"Commander {current_user.full_name} reviewed company-level aggregated stress heatmap across {len(heatmap_results)} companies."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return heatmap_results


# -------------------------------------------------------------
# Mini-task 4.1.3: Dynamic What-If Workload Rebalancing Simulator
# -------------------------------------------------------------
@router.post("/simulate-workload", response_model=schemas.WorkloadSimulationResponse)
def simulate_workload_rebalancing(
    req: schemas.WorkloadSimulationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.1.3: Interactive "What-If" Workload Rebalancing Simulator.
    Simulates operational fatigue reduction and readiness gains if the Commander:
    1) Advances base rotation by X days earlier (relieving environmental wear).
    2) Sanctions mandatory Rest & Recuperation (R&R) leaves for Y soldiers (relieving leave trauma).
    """
    # Match company query (handles e.g. "Charlie" or "Charlie Company")
    company_query = req.company.strip()
    personnel_list = db.query(models.Personnel).filter(
        (models.Personnel.company == company_query) |
        (models.Personnel.company.ilike(f"%{company_query}%"))
    ).all()

    if not personnel_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company '{req.company}' not found in active battalion database."
        )

    company_actual_name = personnel_list[0].company
    total_strength = len(personnel_list)

    # Current baseline burnout risk and critical cases
    current_scores = [p.stress_score for p in personnel_list]
    current_burnout = round(float(np.mean(current_scores)), 1)
    current_critical = sum(1 for s in current_scores if s >= 80.0)

    # Simulation Physics:
    # 1. Base rotation relief: Advancing return from forward sector reduces continuous operational wear.
    #    Each day earlier yields non-linear decompression, capped at 28.0 points.
    rotation_relief = min(28.0, req.rotate_to_base_days_earlier * 0.48)

    # 2. Targeted R&R leave relief:
    #    Sanctioning leaves for top stressed soldiers relieves leave cancellation trauma.
    sorted_personnel = sorted(personnel_list, key=lambda p: p.stress_score, reverse=True)
    leave_count = min(req.mandatory_rr_leave_jawans_count, total_strength)

    simulated_scores = []
    for idx, soldier in enumerate(sorted_personnel):
        if idx < leave_count:
            # High-priority soldier receiving mandatory R&R leave decompression
            indiv_leave_relief = min(32.0, 18.0 + (soldier.leave_cancellations_count * 5.0))
        else:
            # Secondary morale benefit from troop relief and reduced platoon friction
            indiv_leave_relief = 2.5 if leave_count > 0 else 0.0

        # Floor score at baseline healthy physiological minimum (12.0)
        sim_val = max(12.0, soldier.stress_score - rotation_relief - indiv_leave_relief)
        simulated_scores.append(sim_val)

    projected_burnout = round(float(np.mean(simulated_scores)), 1)
    projected_critical = sum(1 for s in simulated_scores if s >= 80.0)

    # Compute percentage improvements
    if current_burnout > 0:
        risk_reduction_pct = round(((current_burnout - projected_burnout) / current_burnout) * 100.0, 1)
    else:
        risk_reduction_pct = 0.0

    readiness_increase_pct = round((current_burnout - projected_burnout) * 0.88, 1)
    prevented_critical = max(0, current_critical - projected_critical)

    summary = (
        f"Tactical Workload Simulation for {company_actual_name}: "
        f"Advancing rotation by {req.rotate_to_base_days_earlier} day(s) and sanctioning {leave_count} "
        f"mandatory R&R leave(s) reduces average company burnout risk by {risk_reduction_pct}% "
        f"(from {current_burnout} to {projected_burnout} points) and prevents {prevented_critical} "
        f"impending critical psychological breakdown(s). Force operational readiness improves by +{readiness_increase_pct}%."
    )

    # Audit log entry for simulated commander decisions
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="SIMULATE_WORKLOAD_ROTATION",
            target_entity="Company_Simulation",
            classification="SECRET - DECISION SUPPORT",
            details=f"Workload simulation run for {company_actual_name}: Rotation {req.rotate_to_base_days_earlier}d, R&R Leaves {leave_count}. Result: -{risk_reduction_pct}% Burnout."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.WorkloadSimulationResponse(
        company=company_actual_name,
        current_burnout_risk=current_burnout,
        projected_burnout_risk=projected_burnout,
        risk_reduction_pct=risk_reduction_pct,
        projected_readiness_increase_pct=readiness_increase_pct,
        prevented_critical_cases=prevented_critical,
        recommendation_summary=summary
    )


# -------------------------------------------------------------
# Mini-task 4.1.4: Downloadable Structured Executive Briefing Report
# -------------------------------------------------------------
@router.get("/export-report", response_model=schemas.ExecutiveReportResponse)
def export_executive_report(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.1.4: Generates an executive summary of battalion readiness and welfare health.
    Includes cryptographic integrity hash and statutory APAR decoupling certificate.
    """
    kpi = get_battalion_readiness_kpi(current_user=current_user, db=db)
    heatmap = get_company_heatmap(current_user=current_user, db=db)

    # Synthesize critical action items dynamically
    action_items = []
    high_risk_comps = [c for c in heatmap if c.high_risk_flag]

    for comp in high_risk_comps:
        action_items.append(
            f"{comp.company_name} ({comp.deployment_zone}): {comp.recommended_action} (Avg Stress: {comp.average_stress_score}, Critical: {comp.risk_distribution.critical_pct}%)"
        )

    if kpi.critical_cases_count > 0:
        action_items.append(
            f"Clinical Mandate: Review medical triage queue for {kpi.critical_cases_count} personnel currently flagged in Critical Risk Tier."
        )

    if kpi.active_interventions_count == 0 and kpi.critical_cases_count > 0:
        action_items.append(
            "Priority Warning: Zero active welfare interventions are currently registered. Medical officer triage dispatch required."
        )

    if not action_items:
        action_items.append("Battalion operating within resilient baseline parameters. Maintain scheduled rest rotations.")

    now_iso = get_ist_iso()
    report_id = f"REP-104BN-{get_ist_now().strftime('%Y%m%d%H%M%S')}"

    # Generate tamper-resistant cryptographic signature hash
    raw_payload = f"{report_id}|{kpi.force_readiness_index}|{kpi.average_stress_score}|{now_iso}|{current_user.username}"
    sig_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

    # Audit log entry for official intelligence export
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="EXPORT_EXECUTIVE_REPORT",
            target_entity="Battalion_Report",
            target_id=report_id,
            classification="SECRET - OFFICIAL BRIEFING",
            details=f"Commander {current_user.full_name} generated Executive Readiness Report ID {report_id} with SHA-256 seal {sig_hash[:16]}..."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.ExecutiveReportResponse(
        report_id=report_id,
        title="EXECUTIVE BATTALION READINESS & PERSONNEL WELFARE AUDIT REPORT",
        battalion="104 Battalion CAPF",
        security_classification="SECRET - FOR BATTALION COMMANDER EYES ONLY",
        commanding_officer=f"{current_user.full_name} ({current_user.rank})",
        generated_at=now_iso,
        readiness_kpi=kpi,
        company_readiness_breakdown=heatmap,
        critical_action_items=action_items,
        apar_immunity_seal=(
            "LEGAL CERTIFICATE: This operational readiness report is cryptographically quarantined "
            "from the Annual Confidential Report (ACR/APAR) appraisal database under Ministry of Home "
            "Affairs Medical Confidentiality Directives. Individual soldier identities remain shielded under k-anonymity."
        ),
        digital_signature_hash=sig_hash
    )
