from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base
from time_utils import get_ist_now_naive

class User(Base):
    """
    Role-Based Access Control (RBAC) User Entity.
    Supports authenticated users across the 4 defense portal roles.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)  # Service ID / Officer ID
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)  # 'Commanding Officer', 'Welfare Officer', 'Jawan', 'Audit Admin'
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(25), nullable=True)
    rank = Column(String(50), nullable=False)
    company = Column(String(50), nullable=True)  # Applicable for Jawans and Company Commanders
    service_number = Column(String(50), nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_ist_now_naive)

class Personnel(Base):
    """
    Uniformed Personnel Entity with Complete HRMS and Operational Parameters.
    Captures operational stressors, deployment terrain, and predictive risk scores.
    """
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    service_number = Column(String(50), unique=True, index=True, nullable=False)
    masked_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g. 'JWN-98421' for k-anonymity
    full_name = Column(String(100), nullable=False)
    rank = Column(String(50), nullable=False)  # Constable, Head Constable, ASI, Sub-Inspector, Inspector, Asst Commandant, Commandant
    company = Column(String(50), nullable=False, index=True)  # Alpha, Bravo, Charlie, Delta
    platoon = Column(String(50), nullable=False)
    role = Column(String(100), nullable=False)  # Combat Patrol, Perimeter Guard, QRT, Driver, Signals, Admin
    
    # Operational Deployment Parameters
    deployment_zone = Column(String(100), nullable=False)  # 'Bastar FOB (LWE)', 'Kargil Ridge (High Alt)', 'Valley Post', 'Base Depot'
    deployment_type = Column(String(50), nullable=False)  # 'High-Intensity CI', 'High-Altitude Border', 'Static Security', 'Peace Station'
    days_in_current_zone = Column(Integer, default=0)
    consecutive_night_duties = Column(Integer, default=0)
    leave_cancellations_count = Column(Integer, default=0)
    months_since_last_leave = Column(Float, default=1.0)
    transfer_frequency_count = Column(Integer, default=1)
    
    # Contact (Masked for privacy)
    phone_masked = Column(String(20), default="+91-XXXXX-98421")
    
    # AI Predicted Stress & Risk Metrics
    stress_score = Column(Float, default=20.0)  # 0.0 to 100.0
    risk_level = Column(String(30), default="Resilient")  # Resilient, Fatigued, Vulnerable, Critical
    risk_drivers_json = Column(Text, default="[]")  # JSON array of Explainable AI (XAI) feature contributions
    
    created_at = Column(DateTime, default=get_ist_now_naive)
    updated_at = Column(DateTime, default=get_ist_now_naive, onupdate=get_ist_now_naive)

    # Relationships
    duty_records = relationship("DutyRoster", back_populates="personnel", cascade="all, delete-orphan")
    leave_records = relationship("LeaveRecord", back_populates="personnel", cascade="all, delete-orphan")
    assessments = relationship("WellnessAssessment", back_populates="personnel", cascade="all, delete-orphan")
    biometrics = relationship("BiometricLog", back_populates="personnel", cascade="all, delete-orphan")
    interventions = relationship("WelfareIntervention", back_populates="personnel", cascade="all, delete-orphan")

class DutyRoster(Base):
    """
    Operational Duty Rosters Entity.
    Tracks night ambushes, combat patrols, QRT standby, and continuous shift strain.
    """
    __tablename__ = "duty_rosters"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    date = Column(String(20), nullable=False)  # ISO Date 'YYYY-MM-DD'
    shift_type = Column(String(50), nullable=False)  # 'Night Ambush', 'Perimeter Guard', 'QRT Standby', 'Day Patrol', 'Static Guard'
    is_night_duty = Column(Boolean, default=False)
    hours_on_duty = Column(Float, default=8.0)
    risk_level = Column(String(20), default="Standard")  # 'Standard', 'Elevated', 'Extreme'

    personnel = relationship("Personnel", back_populates="duty_records")

class LeaveRecord(Base):
    """
    Leave Management & Cancellation History Entity.
    Tracks leave sanction status and denials before family emergencies (critical stress driver).
    """
    __tablename__ = "leave_records"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    leave_type = Column(String(50), nullable=False)  # 'Casual Leave (CL)', 'Earned Leave (EL)', 'Emergency R&R', 'Medical'
    days_requested = Column(Integer, nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    status = Column(String(30), default="Pending")  # 'Sanctioned', 'Cancelled', 'Deferred', 'Completed'
    cancellation_reason = Column(String(255), nullable=True)
    personal_reason = Column(String(255), nullable=True)  # 'Sister Wedding', 'Mother Illness', 'Harvesting', 'Routine'
    created_at = Column(DateTime, default=get_ist_now_naive)

    personnel = relationship("Personnel", back_populates="leave_records")

class WellnessAssessment(Base):
    """
    Voluntary Soldier Self-Assessment Entity.
    15-second daily check-in and psychometrics. Decoupled from official APAR/ACR.
    """
    __tablename__ = "wellness_assessments"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=get_ist_now_naive)
    
    # 15-Second Daily Check-in parameters
    mood_score = Column(Integer, default=3)  # 1 (Very Low) to 5 (Excellent)
    sleep_hours = Column(Float, default=6.5)
    sleep_quality = Column(Integer, default=3)  # 1 to 5
    physical_exhaustion = Column(Integer, default=2)  # 1 (Fresh) to 5 (Severely Exhausted)
    mental_stress_rating = Column(Integer, default=2)  # 1 (Calm) to 5 (Severe)
    
    # Standardized Psychometric screener (Military-adapted PHQ-4 score: 0 to 12)
    phq4_score = Column(Integer, default=2)
    
    # Voluntary confidential notes (screened by NLP for acute crisis cues)
    voluntary_notes = Column(Text, nullable=True)
    
    # Offline sync flag (for remote border outposts with zero network)
    is_offline_synced = Column(Boolean, default=False)
    synced_at = Column(DateTime, default=get_ist_now_naive)

    personnel = relationship("Personnel", back_populates="assessments")

class BiometricLog(Base):
    """
    Voluntary Wearable SmartBand Telemetry Entity.
    Tracks physiological strain markers: Resting HR, HRV RMSSD, and sleep architecture.
    """
    __tablename__ = "biometric_logs"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=get_ist_now_naive)
    
    resting_heart_rate = Column(Integer, default=72)  # bpm (e.g. 60-100)
    hrv_rmssd = Column(Float, default=48.0)  # ms (higher is calmer, drop indicates acute physiological stress)
    sleep_duration_hours = Column(Float, default=6.5)
    deep_sleep_pct = Column(Float, default=18.0)  # %
    stress_biomarker_index = Column(Float, default=35.0)  # 0 to 100 derived biometric strain
    sync_source = Column(String(50), default="SmartBand-V2 Simulator")

    personnel = relationship("Personnel", back_populates="biometrics")

class WelfareIntervention(Base):
    """
    Welfare Action & Prescriptive Care Management Entity.
    Tracks mandatory R&R leaves, tele-counseling sessions, peer buddy pairings, and clinical notes.
    """
    __tablename__ = "welfare_interventions"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    intervention_type = Column(String(100), nullable=False)  # 'Mandatory R&R Leave', 'Tele-Counseling Session', 'Peer Buddy Pairing', 'Duty Rotation', 'Medical Officer Review'
    priority = Column(String(30), default="Routine")  # 'Routine', 'Elevated', 'Urgent - Critical'
    status = Column(String(50), default="Recommended")  # 'Recommended', 'Approved by CO', 'In-Progress', 'Completed', 'Deferred'
    
    recommended_by = Column(String(100), default="AI Behavioral Engine")
    assigned_counselor = Column(String(100), nullable=True)
    action_details = Column(Text, nullable=False)
    clinical_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=get_ist_now_naive)
    resolved_at = Column(DateTime, nullable=True)

    personnel = relationship("Personnel", back_populates="interventions")

class AuditLog(Base):
    """
    Immutable Cryptographic Audit Trail Entity.
    Logs every user query, unmasking attempt, intervention dispatch, and APAR compliance event.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=get_ist_now_naive)
    user_role = Column(String(50), nullable=False)  # 'Commanding Officer', 'Welfare Officer', 'Jawan', 'Audit Admin'
    actor_id = Column(String(50), nullable=False)  # Service ID or Username
    action = Column(String(100), nullable=False)  # 'VIEW_HEATMAP', 'UNMASK_DOSSIER', 'DISPATCH_INTERVENTION', 'SUBMIT_CHECKIN'
    target_entity = Column(String(50), nullable=True)
    target_id = Column(String(50), nullable=True)
    classification = Column(String(50), default="RESTRICTED - WELFARE ONLY")
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    tamper_hash = Column(String(64), nullable=True)  # SHA-256 integrity hash

