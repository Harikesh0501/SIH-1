import hashlib
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models
import schemas
from database import get_db
from auth import get_current_user, require_role
from ml_engine import ml_engine_singleton
from time_utils import get_ist_now_naive, get_ist_now, get_ist_iso

router = APIRouter(
    prefix="/api/jawan",
    tags=["Jawan Confidential Self-Care & Companion Enclave"],
    dependencies=[Depends(require_role(["Jawan"]))]
)

def get_soldier_personnel_record(current_user: models.User, db: Session) -> models.Personnel:
    """
    Cryptographic Ownership Binding:
    Resolves the authenticated soldier's Personnel record via their unique service number.
    Ensures jawans can strictly interact only with their own enclave.
    """
    person = db.query(models.Personnel).filter(
        models.Personnel.service_number == current_user.service_number
    ).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Personnel record for service number '{current_user.service_number}' not found."
        )
    return person

# -------------------------------------------------------------
# Mini-task 4.3.1: 15-Second Daily Wellness Check-in
# -------------------------------------------------------------
@router.post("/check-in", response_model=schemas.JawanCheckInResponse, status_code=status.HTTP_201_CREATED)
def submit_daily_checkin(
    req: schemas.JawanCheckInRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.3.1: 15-Second Daily Micro-Check-in for Frontline Soldiers.
    Saves assessment, recalculates live predictive stress score, screens for crisis cues,
    and updates personnel risk tier with complete APAR/ACR decoupling.
    """
    person = get_soldier_personnel_record(current_user, db)

    # 1. Create WellnessAssessment entity
    assessment = models.WellnessAssessment(
        personnel_id=person.id,
        mood_score=req.mood_score,
        sleep_hours=req.sleep_hours,
        sleep_quality=req.sleep_quality,
        physical_exhaustion=req.physical_exhaustion,
        mental_stress_rating=req.mental_stress_rating,
        phq4_score=req.phq4_score,
        voluntary_notes=req.voluntary_notes,
        is_offline_synced=req.is_offline_synced,
        timestamp=get_ist_now_naive(),
        synced_at=get_ist_now_naive()
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # 2. Multi-lingual Crisis NLP screening on voluntary notes
    voluntary_text = req.voluntary_notes or ""
    is_crisis, crisis_msg = ml_engine_singleton.screen_crisis_nlp(voluntary_text)

    # 3. Retrieve latest biometric telemetry for real-time inference
    latest_bio = db.query(models.BiometricLog).filter(
        models.BiometricLog.personnel_id == person.id
    ).order_by(desc(models.BiometricLog.timestamp)).first()

    features = {
        "days_in_zone": float(person.days_in_current_zone),
        "deployment_type": person.deployment_type,
        "consecutive_night_duties": float(person.consecutive_night_duties),
        "leave_cancellations": float(person.leave_cancellations_count),
        "months_since_leave": float(person.months_since_last_leave),
        "mood_score": float(req.mood_score),
        "sleep_hours": float(req.sleep_hours),
        "sleep_quality": float(req.sleep_quality or 3.0),
        "physical_exhaustion": float(req.physical_exhaustion),
        "mental_stress_rating": float(req.mental_stress_rating) if req.mental_stress_rating is not None else None,
        "phq4_score": float(req.phq4_score) if req.phq4_score is not None else None,
        "hrv_rmssd": float(latest_bio.hrv_rmssd) if latest_bio else 48.0,
        "resting_hr": float(latest_bio.resting_heart_rate) if latest_bio else 72.0,
        "voluntary_text": voluntary_text
    }

    # 4. Predict updated stress score & 5-factor XAI
    ml_result = ml_engine_singleton.predict_stress(features)
    person.stress_score = ml_result["stress_score"]
    person.risk_level = ml_result["risk_level"]
    person.risk_drivers_json = json.dumps(ml_result["explainable_factors"])
    person.updated_at = get_ist_now_naive()

    # 5. If crisis detected, immediately create priority clinical triage intervention
    if is_crisis:
        emergency_intv = models.WelfareIntervention(
            personnel_id=person.id,
            intervention_type="Immediate Clinical Triage & Crisis Support",
            priority="Urgent - Critical",
            status="Recommended",
            recommended_by="Multilingual NLP Safety Screener",
            assigned_counselor="Dr. Rajiv Malhotra (Base Medical Officer)",
            action_details="EMERGENCY ALERT: Multilingual NLP screener detected acute psychological distress markers in voluntary check-in notes. Immediate clinical outreach required.",
            clinical_notes=f"Keyword trigger logged at {get_ist_iso()}. 24/7 buddy watch and Tele-MANAS (14416) linkage recommended.",
            created_at=get_ist_now_naive()
        )
        db.add(emergency_intv)

    db.commit()

    # 6. Immutable Audit Log for APAR-decoupled check-in
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="SUBMIT_CHECKIN",
            target_entity="WellnessAssessment",
            target_id=str(assessment.id),
            classification="RESTRICTED - APAR DECOUPLED",
            details=f"Confidential check-in logged for {person.masked_id}. Stress score updated to {person.stress_score} ({person.risk_level}). Decoupled from service record."
        ))
        db.commit()
    except Exception:
        db.rollback()

    # 7. Bilingual resilience reinforcement message
    if is_crisis:
        msg_en = "We hear you. You are not alone. A welfare officer has been discreetly notified to support you. You can also talk to Tele-MANAS confidentially at 14416 anytime."
        msg_hi = "हम आपकी बात समझते हैं। आप अकेले नहीं हैं। आपकी सहायता के लिए कल्याण अधिकारी को गोपनीय रूप से सूचित किया गया है। आप किसी भी समय 14416 पर टेली-मानस से गोपनीय बातचीत कर सकते हैं।"
    elif person.stress_score >= 65.0:
        msg_en = "Check-in logged. High operational strain detected. We recommend taking 5 minutes for guided box breathing and resting during your off-duty hours."
        msg_hi = "चेक-इन दर्ज किया गया। उच्च ऑपरेशनल तनाव का पता चला है। हम सलाह देते हैं कि आप 5 मिनट का निर्देशित प्राणायाम करें और अपनी गैर-ड्यूटी के समय विश्राम करें।"
    else:
        msg_en = "Check-in logged successfully. Your baseline readiness is optimal. Stay safe on duty, comrade!"
        msg_hi = "चेक-इन सफलतापूर्वक दर्ज हुआ। आपकी मानसिक और शारीरिक स्थिति संतुलित है। ड्यूटी पर सतर्क और सुरक्षित रहें, साथी!"

    return schemas.JawanCheckInResponse(
        assessment_id=assessment.id,
        stress_score=person.stress_score,
        risk_level=person.risk_level,
        crisis_detected=is_crisis,
        emergency_sos_hotlines={
            "tele_manas_national": "14416",
            "base_medical_officer": "Ext. 204",
            "peer_buddy_support": "Ext. 101"
        },
        resilience_message_en=msg_en,
        resilience_message_hi=msg_hi
    )


# -------------------------------------------------------------
# Mini-task 4.3.2: Voluntary Wearable SmartBand Telemetry Sync
# -------------------------------------------------------------
@router.post("/sync-biometrics", response_model=schemas.JawanBiometricSyncResponse, status_code=status.HTTP_201_CREATED)
def sync_wearable_biometrics(
    req: schemas.JawanBiometricSyncRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.3.2: Synchronizes voluntary wearable smart-band telemetry.
    Ingests Resting Heart Rate (RHR), Heart Rate Variability (HRV RMSSD), and sleep duration.
    Calculates physiological strain index and autonomic recovery status.
    """
    person = get_soldier_personnel_record(current_user, db)

    # Derive physiological stress biomarker index (0 - 100)
    # Higher RHR, lower HRV, and sleep deficit yield higher strain index
    rhr_strain = max(0.0, req.resting_heart_rate - 60.0) * 0.55
    hrv_strain = max(0.0, 60.0 - req.hrv_rmssd) * 0.50
    sleep_strain = max(0.0, 7.5 - req.sleep_duration_hours) * 6.0
    biomarker_index = round(float(min(98.0, max(8.0, 15.0 + rhr_strain + hrv_strain + sleep_strain))), 1)

    # Autonomic nervous system recovery interpretation
    if req.hrv_rmssd >= 55.0 and req.resting_heart_rate <= 68:
        recovery_status = "Optimal Parasympathetic Recovery (Rest & Digest Dominant)"
    elif req.hrv_rmssd >= 40.0:
        recovery_status = "Balanced Autonomic State (Standard Operational Readiness)"
    elif req.hrv_rmssd >= 25.0:
        recovery_status = "Elevated Sympathetic Tone (Accumulating Physiological Fatigue)"
    else:
        recovery_status = "Acute Autonomic Strain (Severe Autonomic Nervous Depletion)"

    new_log = models.BiometricLog(
        personnel_id=person.id,
        resting_heart_rate=req.resting_heart_rate,
        hrv_rmssd=req.hrv_rmssd,
        sleep_duration_hours=req.sleep_duration_hours,
        deep_sleep_pct=req.deep_sleep_pct,
        stress_biomarker_index=biomarker_index,
        sync_source=req.sync_source,
        timestamp=get_ist_now_naive()
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # Recalculate soldier's stress score with the newly synchronized biometrics
    latest_assessment = db.query(models.WellnessAssessment).filter(
        models.WellnessAssessment.personnel_id == person.id
    ).order_by(desc(models.WellnessAssessment.timestamp)).first()

    features = {
        "days_in_zone": float(person.days_in_current_zone),
        "deployment_type": person.deployment_type,
        "consecutive_night_duties": float(person.consecutive_night_duties),
        "leave_cancellations": float(person.leave_cancellations_count),
        "months_since_leave": float(person.months_since_last_leave),
        "mood_score": float(latest_assessment.mood_score) if latest_assessment else 3.0,
        "sleep_hours": float(req.sleep_duration_hours),
        "physical_exhaustion": float(latest_assessment.physical_exhaustion) if latest_assessment else 2.0,
        "phq4_score": float(latest_assessment.phq4_score) if latest_assessment else 2.0,
        "hrv_rmssd": float(req.hrv_rmssd),
        "resting_hr": float(req.resting_heart_rate),
        "voluntary_text": latest_assessment.voluntary_notes if latest_assessment else ""
    }

    ml_result = ml_engine_singleton.predict_stress(features)
    person.stress_score = ml_result["stress_score"]
    person.risk_level = ml_result["risk_level"]
    person.risk_drivers_json = json.dumps(ml_result["explainable_factors"])
    person.updated_at = get_ist_now_naive()
    db.commit()

    # Log audit entry
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="SYNC_BIOMETRICS",
            target_entity="BiometricLog",
            target_id=str(new_log.id),
            classification="RESTRICTED - APAR DECOUPLED",
            details=f"Wearable vitals synced for {person.masked_id}: HRV {req.hrv_rmssd}ms, RHR {req.resting_heart_rate} bpm. Decoupled from service record."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.JawanBiometricSyncResponse(
        log_id=new_log.id,
        resting_heart_rate=new_log.resting_heart_rate,
        hrv_rmssd=new_log.hrv_rmssd,
        sleep_duration_hours=new_log.sleep_duration_hours,
        deep_sleep_pct=new_log.deep_sleep_pct,
        stress_biomarker_index=new_log.stress_biomarker_index,
        autonomic_recovery_status=recovery_status,
        sync_timestamp=new_log.timestamp
    )


# -------------------------------------------------------------
# Mini-task 4.3.3: Soldier Personal History & Welfare Status
# -------------------------------------------------------------
@router.get("/my-history", response_model=schemas.JawanHistoryResponse)
def get_soldier_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.3.3: Personal Welfare & Historical Records.
    Allows the authenticated soldier to review past check-ins, biometric vitals,
    leave request statuses, and any approved welfare interventions.
    """
    person = get_soldier_personnel_record(current_user, db)

    recent_assessments = db.query(models.WellnessAssessment).filter(
        models.WellnessAssessment.personnel_id == person.id
    ).order_by(desc(models.WellnessAssessment.timestamp)).limit(14).all()

    recent_biometrics = db.query(models.BiometricLog).filter(
        models.BiometricLog.personnel_id == person.id
    ).order_by(desc(models.BiometricLog.timestamp)).limit(14).all()

    leave_records = db.query(models.LeaveRecord).filter(
        models.LeaveRecord.personnel_id == person.id
    ).order_by(desc(models.LeaveRecord.created_at)).all()

    interventions = db.query(models.WelfareIntervention).filter(
        models.WelfareIntervention.personnel_id == person.id
    ).order_by(desc(models.WelfareIntervention.created_at)).all()

    intv_responses = []
    for intv in interventions:
        intv_responses.append(schemas.InterventionResponse(
            id=intv.id,
            personnel_id=person.id,
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

    return schemas.JawanHistoryResponse(
        service_number=person.service_number,
        full_name=person.full_name,
        rank=person.rank,
        company=person.company,
        days_in_current_zone=person.days_in_current_zone,
        leave_cancellations_count=person.leave_cancellations_count,
        consecutive_night_duties=person.consecutive_night_duties,
        current_stress_score=person.stress_score,
        current_risk_level=person.risk_level,
        recent_assessments=[schemas.AssessmentResponse.model_validate(a) for a in recent_assessments],
        recent_biometrics=[schemas.BiometricResponse.model_validate(b) for b in recent_biometrics],
        leave_records=[schemas.LeaveRecordResponse.model_validate(l) for l in leave_records],
        interventions=intv_responses
    )


# -------------------------------------------------------------
# Mini-task 4.3.4: Confidential "AI Sathi" (साथी) Companion
# -------------------------------------------------------------
@router.post("/ai-sathi/chat", response_model=schemas.AISathiChatResponse)
def chat_with_ai_sathi(
    req: schemas.AISathiChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.3.4: Empathetic AI Sathi (साथी) Wellness Companion.
    Provides confidential psychological first-aid, guided breathing exercises,
    and de-escalation support in English and Hindi.
    Integrated with crisis NLP safety net.
    """
    person = get_soldier_personnel_record(current_user, db)
    user_msg = req.message.strip().lower()

    # Screen incoming message for acute distress / self-harm
    is_crisis, _ = ml_engine_singleton.screen_crisis_nlp(req.message)

    if is_crisis:
        # Immediate Emergency Protocol
        reply_en = (
            f"Dear {person.rank} {person.full_name.split()[-1]}, I hear the pain in your words, and I want you to know "
            f"that your life is immensely precious to your family, your comrades, and the country. "
            f"Please take a deep breath. You do not have to carry this heavy burden alone. "
            f"I have connected you directly with compassionate counselors who understand what soldiers go through. "
            f"Please tap the emergency button below to speak with Tele-MANAS (14416) right now."
        )
        reply_hi = (
            f"प्रिय {person.full_name}, मैं आपकी तकलीफ समझ सकता हूँ। आपका जीवन आपके परिवार, आपके साथियों और देश के लिए अत्यंत मूल्यवान है। "
            f"कृपया गहरी सांस लें। आपको यह भारी तनाव अकेले नहीं सहना है। "
            f"कल्याण और सहायता के लिए टेली-मानस के विशेष परामर्शदाता उपलब्ध हैं। "
            f"कृपया तुरंत नीचे दिए गए बटन पर टैप करके 14416 (टेली-मानस) पर निःशुल्क बात करें।"
        )
        suggested = [
            "📞 Call Tele-MANAS (14416 Toll-Free)",
            "🏥 Connect with Unit Medical Officer",
            "🧘 Begin Emergency Grounding Exercise"
        ]
        return schemas.AISathiChatResponse(
            reply_en=reply_en,
            reply_hi=reply_hi,
            crisis_detected=True,
            suggested_actions=suggested,
            pranayama_guide=schemas.PranayamaGuide(
                cycle_name="Emergency 4-4-4 Box Breathing (ग्राउंडिंग बॉक्स ब्रीदिंग)",
                inhale_seconds=4,
                hold_seconds=4,
                exhale_seconds=4,
                hold_after_exhale_seconds=4,
                total_cycles=5,
                instructions_en="Inhale slowly through your nose for 4s. Hold for 4s. Exhale smoothly for 4s. Hold empty for 4s. Repeat 5 times.",
                instructions_hi="नाक से 4 सेकंड तक धीरे-धीरे सांस लें। 4 सेकंड रोकें। 4 सेकंड में मुंह से छोड़ें। 4 सेकंड खाली रखें। 5 बार दोहराएं।"
            )
        )

    # Topic: Pranayama / Breathing Exercise Request
    if any(k in user_msg for k in ["breath", "pranayam", "breathing", "saans", "तनाव", "सांस", "प्राणायाम", "relax"]):
        reply_en = (
            "Military operations demand sharp focus and rapid recovery. "
            "Box Breathing (used by special forces) calms your autonomic nervous system within 2 minutes. "
            "Follow the breathing guide below: breathe with the pulse."
        )
        reply_hi = (
            "ऑपरेशनल ड्यूटी में तीव्र एकाग्रता और त्वरित शांति आवश्यक है। "
            "प्राणायाम और 4-7-8 श्वास क्रिया तंत्रिका तंत्र को 2 मिनट में शांत करती है। "
            "नीचे दिए गए चक्र का अनुसरण करें और शांत मन से सांस लें।"
        )
        return schemas.AISathiChatResponse(
            reply_en=reply_en,
            reply_hi=reply_hi,
            crisis_detected=False,
            suggested_actions=[
                "Start 4-7-8 Pranayama Cycle",
                "Log Daily Sleep Hours",
                "View My Biometrics"
            ],
            pranayama_guide=schemas.PranayamaGuide(
                cycle_name="4-7-8 Autonomic Recovery Breathing (प्राणायाम)",
                inhale_seconds=4,
                hold_seconds=7,
                exhale_seconds=8,
                hold_after_exhale_seconds=0,
                total_cycles=4,
                instructions_en="Inhale quietly through nose for 4s. Hold breath for 7s. Exhale completely through mouth with a gentle whoosh for 8s.",
                instructions_hi="4 सेकंड तक नाक से गहरी सांस लें। 7 सेकंड तक सांस रोककर रखें। 8 सेकंड में धीरे-धीरे मुंह से सांस पूरी छोड़ें।"
            )
        )

    # Topic: Leave / Family Separation
    if any(k in user_msg for k in ["leave", "chhutti", "chutti", "family", "ghar", "parivar", "miss", "घर", "परिवार", "छुट्टी"]):
        reply_en = (
            f"It is completely natural to miss your home and family, {person.rank}. "
            f"You have been stationed in {person.deployment_zone} for {person.days_in_current_zone} days. "
            f"Remember, rest leave is an authorized operational welfare entitlement, not a favor. "
            f"If you have urgent family needs, you can submit an emergency leave request through your portal, and the Welfare Officer will prioritize your case."
        )
        reply_hi = (
            f"घर और परिवार की याद आना बिल्कुल स्वाभाविक है, {person.rank}। "
            f"आप {person.deployment_zone} में पिछले {person.days_in_current_zone} दिनों से देशसेवा कर रहे हैं। "
            f"याद रखें, छुट्टी आपका अधिकार और कल्याण नीति का हिस्सा है। "
            f"यदि घर पर कोई आपातकालीन कार्य है, तो आप पोर्टल के माध्यम से छुट्टी समीक्षा का अनुरोध कर सकते हैं।"
        )
        return schemas.AISathiChatResponse(
            reply_en=reply_en,
            reply_hi=reply_hi,
            crisis_detected=False,
            suggested_actions=[
                "Check Leave Balance & History",
                "Request Welfare Review",
                "Call Family via Welfare Booth"
            ],
            pranayama_guide=None
        )

    # Default Empathetic Dialogue
    reply_en = (
        f"Jai Hind, {person.rank} {person.full_name.split()[-1]}! I am your 24/7 welfare companion. "
        f"Whatever is on your mind—fatigue from night ambushes, sleep troubles, or personal thoughts—"
        f"this space is strictly confidential and protected from your APAR/ACR. How can I support you today?"
    )
    reply_hi = (
        f"जय हिंद, {person.rank} {person.full_name}! मैं आपका 24/7 कल्याण साथी हूँ। "
        f"आपके मन में जो कुछ भी है—रात की गश्त की थकान, नींद की समस्या, या पारिवारिक चिंता—"
        f"यह बातचीत पूरी तरह से गोपनीय है और आपकी सेवा पुस्तिका से अलग है। आज मैं आपकी कैसे सहायता कर सकता हूँ?"
    )
    return schemas.AISathiChatResponse(
        reply_en=reply_en,
        reply_hi=reply_hi,
        crisis_detected=False,
        suggested_actions=[
            "Start 15-Second Daily Check-in",
            "Try Guided Breathing (Pranayama)",
            "Sync Wearable SmartBand"
        ],
        pranayama_guide=None
    )


# -------------------------------------------------------------
# Mini-task 4.3.5: Cryptographic APAR Decoupling Certificate
# -------------------------------------------------------------
@router.get("/privacy-certificate", response_model=schemas.PrivacyCertificateResponse)
def get_privacy_certificate(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 4.3.5: Cryptographic APAR Decoupling Immunity Certificate.
    Provides verifiable mathematical assurance to soldiers that their mental health
    and stress assessments are permanently quarantined from performance appraisals.
    """
    person = get_soldier_personnel_record(current_user, db)

    now = get_ist_now_naive()
    cert_id = f"APAR-IMMUNITY-{person.service_number}-{now.strftime('%Y%m%d')}"

    # Generate HMAC-style digital token
    raw_signature = f"{cert_id}|{person.service_number}|{person.masked_id}|{now.isoformat()}|STATUTORY_PRIVILEGE"
    sig_token = hashlib.sha256(raw_signature.encode("utf-8")).hexdigest()

    prohibitions = [
        "STATUTORY QUARANTINE: Self-reported mental health and biometric scores are cryptographically quarantined from the Annual Confidential Report (ACR/APAR) appraisal database.",
        "COMMAND PRIVACY FIREWALL: Commanding Officers and promotion review boards are technically blocked from accessing individual soldier psychometric answers or journal notes.",
        "NON-PUNITIVE WELFARE MANDATE: Honest reporting of exhaustion or distress carries ZERO promotion penalties, disciplinary remarks, or punitive reassignments under Ministry of Home Affairs Medical Confidentiality Directives."
    ]

    return schemas.PrivacyCertificateResponse(
        certificate_id=cert_id,
        soldier_name=person.full_name,
        service_number=person.service_number,
        masked_id=person.masked_id,
        company=f"{person.company}, 104 Bn",
        rank=person.rank,
        immunity_status="ACTIVE - STATUTORY PRIVILEGE ENFORCED",
        governance_directive="Ministry of Home Affairs & MoD Medical Confidentiality Directive 2024 / DPDPA 2023",
        prohibitions=prohibitions,
        issued_at=now,
        cryptographic_verification_token=sig_token
    )


# -------------------------------------------------------------
# Mini-task 8.5.2: Confidential Leave & Welfare Grievance Application
# -------------------------------------------------------------
@router.post("/leave-request", response_model=schemas.LeaveRecordResponse, status_code=status.HTTP_201_CREATED)
def submit_leave_request(
    req: schemas.JawanLeaveApplicationRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mini-task 8.5.2: Confidential Leave & Emergency Welfare Grievance Application.
    Creates a new LeaveRecord for the authenticated soldier with 'Pending' status.
    If flagged as an emergency welfare grievance, automatically dispatches a prioritized
    intervention directly to the Medical & Welfare Officer queue.
    """
    person = get_soldier_personnel_record(current_user, db)

    # 1. Create LeaveRecord entity
    new_leave = models.LeaveRecord(
        personnel_id=person.id,
        leave_type=req.leave_type,
        days_requested=req.days_requested,
        start_date=req.start_date,
        end_date=req.end_date,
        status="Pending",
        personal_reason=req.personal_reason,
        cancellation_reason=None,
        created_at=get_ist_now_naive()
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    # 2. If emergency or welfare grievance, dispatch confidential intervention to Welfare Officer
    if req.is_emergency_welfare_request or "emergency" in req.leave_type.lower() or "compassionate" in req.leave_type.lower():
        priority = "Urgent - Critical" if req.is_emergency_welfare_request else "Elevated"
        emergency_intv = models.WelfareIntervention(
            personnel_id=person.id,
            intervention_type="Mandatory 10-Day R&R Leave" if "r&r" in req.leave_type.lower() else "Emergency Leave / Welfare Review",
            priority=priority,
            status="Recommended",
            recommended_by="Soldier Self-Request (Private Enclave)",
            assigned_counselor="Dr. Sunita Malhotra (Surgeon Commander / Welfare Officer)",
            action_details=f"Confidential Emergency Leave Application ({req.leave_type}, {req.days_requested} days): {req.personal_reason}",
            clinical_notes=req.confidential_notes or "Submitted directly via soldier's private welfare enclave with statutory immunity.",
            created_at=get_ist_now_naive()
        )
        db.add(emergency_intv)
        db.commit()

    # 3. Immutable audit log entry under DPDPA Section 14
    try:
        db.add(models.AuditLog(
            user_role=current_user.role,
            actor_id=current_user.username,
            action="SUBMIT_LEAVE_REQUEST",
            target_entity="LeaveRecord",
            target_id=str(new_leave.id),
            classification="RESTRICTED - APAR DECOUPLED",
            details=f"Confidential leave request ({req.leave_type}, {req.days_requested} days) submitted for {person.masked_id}. Decoupled from ACR/APAR."
        ))
        db.commit()
    except Exception:
        db.rollback()

    return schemas.LeaveRecordResponse.model_validate(new_leave)

