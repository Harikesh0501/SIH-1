from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# -------------------------------------------------------------
# 1. Authentication & RBAC Schemas
# -------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str = Field(..., description="Service ID or Officer ID")
    password: str = Field(..., description="Plaintext password")

class RegisterRequest(BaseModel):
    username: str = Field(..., description="Service ID or Officer ID")
    password: str = Field(..., description="Plaintext password")
    full_name: str = Field(..., description="Full Name")
    email: Optional[str] = Field(default="", description="Email ID")
    phone: Optional[str] = Field(default="", description="Phone Number")
    otp: Optional[str] = Field(default=None, description="One-Time Passcode")
    rank: str = Field(default="Constable", description="Rank")
    company: str = Field(default="Alpha Company", description="Company / Unit")
    role: str = Field(default="Jawan", description="Role")

class UserProfile(BaseModel):
    id: int
    username: str
    role: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    rank: str
    company: Optional[str] = None
    service_number: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int = 24
    user: UserProfile

class TokenData(BaseModel):
    user_id: int
    username: str
    role: str
    company: Optional[str] = None
    service_number: Optional[str] = None

class SendOtpRequest(BaseModel):
    email: str = Field(..., description="Recipient Email Address")
    phone: Optional[str] = Field(default="", description="Recipient Phone Number")
    full_name: Optional[str] = Field(default="Defense Personnel", description="Recipient Full Name")

class VerifyOtpRequest(BaseModel):
    email: str = Field(..., description="Recipient Email Address")
    otp: str = Field(..., description="6-digit verification code")

class OtpResponse(BaseModel):
    success: bool
    message: str
    expires_in_seconds: int = 600
    demo_phone_otp: Optional[str] = None

# -------------------------------------------------------------
# 2. Personnel & Operational Schemas
# -------------------------------------------------------------
class PersonnelResponse(BaseModel):
    id: int
    service_number: str
    masked_id: str
    full_name: str
    rank: str
    company: str
    platoon: str
    role: str
    deployment_zone: str
    deployment_type: str
    days_in_current_zone: int
    consecutive_night_duties: int
    leave_cancellations_count: int
    months_since_last_leave: float
    phone_masked: str
    stress_score: float
    risk_level: str
    risk_drivers_json: str

    class Config:
        from_attributes = True

class DutyRosterResponse(BaseModel):
    id: int
    date: str
    shift_type: str
    is_night_duty: bool
    hours_on_duty: float
    risk_level: str

    class Config:
        from_attributes = True

class LeaveRecordResponse(BaseModel):
    id: int
    leave_type: str
    days_requested: int
    start_date: str
    end_date: str
    status: str
    cancellation_reason: Optional[str] = None
    personal_reason: Optional[str] = None

    class Config:
        from_attributes = True

class JawanLeaveApplicationRequest(BaseModel):
    leave_type: str = "Casual Leave (CL)"
    days_requested: int = Field(10, ge=1, le=60)
    start_date: str
    end_date: str
    personal_reason: str
    is_emergency_welfare_request: bool = False
    confidential_notes: Optional[str] = None

# -------------------------------------------------------------
# 3. Assessment & Biometric Schemas
# -------------------------------------------------------------
class AssessmentCreate(BaseModel):
    personnel_id: int
    mood_score: int = Field(3, ge=1, le=5)
    sleep_hours: float = Field(6.5, ge=0.0, le=24.0)
    sleep_quality: int = Field(3, ge=1, le=5)
    physical_exhaustion: int = Field(2, ge=1, le=5)
    mental_stress_rating: int = Field(2, ge=1, le=5)
    phq4_score: int = Field(2, ge=0, le=12)
    voluntary_notes: Optional[str] = None
    is_offline_synced: bool = False

class AssessmentResponse(BaseModel):
    id: int
    personnel_id: int
    timestamp: datetime
    mood_score: int
    sleep_hours: float
    sleep_quality: int
    physical_exhaustion: int
    mental_stress_rating: int
    phq4_score: int
    voluntary_notes: Optional[str] = None
    is_offline_synced: bool

    class Config:
        from_attributes = True

class BiometricSyncRequest(BaseModel):
    personnel_id: int
    resting_heart_rate: int = Field(..., ge=40, le=160)
    hrv_rmssd: float = Field(..., ge=5.0, le=150.0)
    sleep_duration_hours: float = Field(..., ge=0.0, le=18.0)
    deep_sleep_pct: float = Field(..., ge=0.0, le=60.0)
    sync_source: str = "SmartBand-V2 Simulator"

class BiometricResponse(BaseModel):
    id: int
    personnel_id: int
    timestamp: datetime
    resting_heart_rate: int
    hrv_rmssd: float
    sleep_duration_hours: float
    deep_sleep_pct: float
    stress_biomarker_index: float
    sync_source: str

    class Config:
        from_attributes = True

class JawanCheckInRequest(BaseModel):
    mood_score: int = Field(3, ge=1, le=5)
    sleep_hours: float = Field(6.5, ge=0.0, le=24.0)
    sleep_quality: int = Field(3, ge=1, le=5)
    physical_exhaustion: int = Field(2, ge=1, le=5)
    mental_stress_rating: int = Field(2, ge=1, le=5)
    phq4_score: int = Field(2, ge=0, le=12)
    voluntary_notes: Optional[str] = None
    is_offline_synced: bool = False

class JawanCheckInResponse(BaseModel):
    assessment_id: int
    stress_score: float
    risk_level: str
    crisis_detected: bool
    emergency_sos_hotlines: Dict[str, str]
    resilience_message_en: str
    resilience_message_hi: str

class JawanBiometricSyncRequest(BaseModel):
    resting_heart_rate: int = Field(..., ge=40, le=160)
    hrv_rmssd: float = Field(..., ge=5.0, le=150.0)
    sleep_duration_hours: float = Field(..., ge=0.0, le=18.0)
    deep_sleep_pct: float = Field(..., ge=0.0, le=60.0)
    sync_source: str = "SmartBand-BLE Client"

class JawanBiometricSyncResponse(BaseModel):
    log_id: int
    resting_heart_rate: int
    hrv_rmssd: float
    sleep_duration_hours: float
    deep_sleep_pct: float
    stress_biomarker_index: float
    autonomic_recovery_status: str
    sync_timestamp: datetime
# -------------------------------------------------------------
# 4. Welfare Intervention Schemas
# -------------------------------------------------------------
class InterventionCreate(BaseModel):
    personnel_id: int
    intervention_type: str
    priority: str = "Routine"
    assigned_counselor: Optional[str] = None
    action_details: str
    clinical_notes: Optional[str] = None

class InterventionUpdateStatus(BaseModel):
    status: str
    clinical_notes: Optional[str] = None

class InterventionResponse(BaseModel):
    id: int
    personnel_id: int
    personnel_name: Optional[str] = None
    personnel_rank: Optional[str] = None
    personnel_company: Optional[str] = None
    personnel_service_number: Optional[str] = None
    intervention_type: str
    priority: str
    status: str
    recommended_by: str
    assigned_counselor: Optional[str] = None
    action_details: str
    clinical_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class TriageItemResponse(BaseModel):
    id: int
    service_number: str
    masked_id: str
    full_name: str
    rank: str
    company: str
    platoon: str
    role: str
    deployment_zone: str
    deployment_type: str
    days_in_current_zone: int
    leave_cancellations_count: int
    consecutive_night_duties: int
    stress_score: float
    risk_level: str
    crisis_flag: bool
    top_stress_driver: str
    active_interventions_count: int
    last_assessment_date: Optional[datetime] = None

class XAIFactor(BaseModel):
    feature: str
    feature_hi: str
    category: str
    impact_pct: float
    description: str

class XAIAttributionResponse(BaseModel):
    factors: List[XAIFactor]
    clinical_narrative_en: str
    clinical_narrative_hi: str

class PrescribedRecommendation(BaseModel):
    action_type: str
    title: str
    priority: str
    rationale: str

class PersonnelDossierResponse(BaseModel):
    personnel: PersonnelResponse
    xai_attribution: XAIAttributionResponse
    duty_history: List[DutyRosterResponse]
    leave_history: List[LeaveRecordResponse]
    recent_assessments: List[AssessmentResponse]
    recent_biometrics: List[BiometricResponse]
    interventions: List[InterventionResponse]
    prescribed_recommendations: List[PrescribedRecommendation]

class JawanHistoryResponse(BaseModel):
    service_number: str
    full_name: str
    rank: str
    company: str
    days_in_current_zone: int
    leave_cancellations_count: int
    consecutive_night_duties: int
    current_stress_score: float
    current_risk_level: str
    recent_assessments: List[AssessmentResponse]
    recent_biometrics: List[BiometricResponse]
    leave_records: List[LeaveRecordResponse]
    interventions: List[InterventionResponse]

class PranayamaGuide(BaseModel):
    cycle_name: str
    inhale_seconds: int
    hold_seconds: int
    exhale_seconds: int
    hold_after_exhale_seconds: int
    total_cycles: int
    instructions_en: str
    instructions_hi: str

class AISathiChatRequest(BaseModel):
    message: str
    language: str = "auto"
    conversation_context: Optional[List[Dict[str, str]]] = None

class AISathiChatResponse(BaseModel):
    reply_en: str
    reply_hi: str
    crisis_detected: bool
    suggested_actions: List[str]
    pranayama_guide: Optional[PranayamaGuide] = None

class PrivacyCertificateResponse(BaseModel):
    certificate_id: str
    soldier_name: str
    service_number: str
    masked_id: str
    company: Optional[str] = "Alpha Company, 104 Bn"
    rank: Optional[str] = "Constable"
    immunity_status: str
    governance_directive: str
    prohibitions: List[str]
    issued_at: datetime
    cryptographic_verification_token: str

# -------------------------------------------------------------
# 5. Commander & Simulation Schemas
# -------------------------------------------------------------
class ReadinessKPIResponse(BaseModel):
    battalion_name: str = "104 BN CRPF / SPECIAL OPERATIONS"
    total_active_personnel: int
    force_readiness_index: float
    average_stress_score: float
    critical_cases_count: int
    vulnerable_cases_count: int
    fatigued_cases_count: int
    resilient_cases_count: int
    active_interventions_count: int
    k_anonymity_enforced: bool = True
    timestamp: datetime

class RiskDistribution(BaseModel):
    resilient_pct: float
    fatigued_pct: float
    vulnerable_pct: float
    critical_pct: float

class CompanyHeatmapItem(BaseModel):
    company_name: str
    strength: int
    deployment_zone: str
    deployment_type: str
    average_days_deployed: float
    total_leave_denials: int
    average_stress_score: float
    company_risk_level: str
    risk_distribution: RiskDistribution
    high_risk_flag: bool
    recommended_action: str

class WorkloadSimulationRequest(BaseModel):
    company: str
    rotate_to_base_days_earlier: int = Field(0, ge=0, le=60)
    mandatory_rr_leave_jawans_count: int = Field(0, ge=0, le=30)

class WorkloadSimulationResponse(BaseModel):
    company: str
    current_burnout_risk: float
    projected_burnout_risk: float
    risk_reduction_pct: float
    projected_readiness_increase_pct: float
    prevented_critical_cases: int
    recommendation_summary: str

class ExecutiveReportResponse(BaseModel):
    report_id: str
    title: str
    battalion: str
    security_classification: str
    commanding_officer: str
    generated_at: str
    readiness_kpi: ReadinessKPIResponse
    company_readiness_breakdown: List[CompanyHeatmapItem]
    critical_action_items: List[str]
    apar_immunity_seal: str
    digital_signature_hash: str

# -------------------------------------------------------------
# 6. Audit & Governance Schemas
# -------------------------------------------------------------
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    user_role: str
    actor_id: str
    action: str
    target_entity: Optional[str] = None
    target_id: Optional[str] = None
    classification: str
    details: Optional[str] = None
    ip_address: Optional[str] = "127.0.0.1"
    tamper_hash: Optional[str] = None

    class Config:
        from_attributes = True

class AuditLogListResponse(BaseModel):
    total_count: int
    limit: int
    offset: int
    logs: List[AuditLogResponse]

class APARFirewallMetrics(BaseModel):
    status: str
    decoupled_records_count: int
    promotion_linkage_status: str
    statutory_shield: str

class KAnonymityMetrics(BaseModel):
    min_platoon_threshold: int = 5
    battalion_companies_monitored: int
    suppression_violations: int
    anonymity_status: str

class SecurityEncryptionMetrics(BaseModel):
    encryption_at_rest: str
    encryption_in_transit: str
    dpdpa_compliance_rating: str
    sovereign_deployment_readiness: str

class LedgerHealthMetrics(BaseModel):
    total_audit_entries: int
    unmasking_queries_count: int
    intervention_mutations_count: int
    tampering_incidents: int

class ComplianceMetricsResponse(BaseModel):
    apar_decoupling_firewall: APARFirewallMetrics
    k_anonymity_compliance: KAnonymityMetrics
    data_retention_and_security: SecurityEncryptionMetrics
    audit_ledger_health: LedgerHealthMetrics
    timestamp: datetime

class TamperVerificationResponse(BaseModel):
    total_records_verified: int
    integrity_status: str
    hash_algorithm: str
    latest_ledger_root_hash: str
    verification_timestamp: datetime
    tamper_evidence_detected: bool = False

