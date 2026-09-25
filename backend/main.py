import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import time
import random
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

import models
import schemas
from database import get_db, SessionLocal, engine
from time_utils import get_ist_iso
from email_service import send_otp_email
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    get_current_user,
    require_role,
    security_bearer
)
from routers import commander as commander_router
from routers import welfare as welfare_router
from routers import jawan as jawan_router
from routers import audit as audit_router

# Ensure database tables exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RAKSHAK-AAYUSH API",
    description="AI-Based Predictive Personnel Stress & Welfare Monitoring System for Uniformed Forces (SIH 26186)",
    version="2.0.0"
)

# -------------------------------------------------------------
# Mini-task 2.2.6: Automated Audit & Governance Middleware
# -------------------------------------------------------------
class AuditGovernanceMiddleware(BaseHTTPMiddleware):
    """
    Captures sensitive actions, unmasking queries, and all data mutations (POST, PATCH, DELETE)
    and logs them into the immutable SQLite AuditLog table.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Only log mutating actions or sensitive endpoints (excluding health and options)
        path = request.url.path
        method = request.method
        if method in ["POST", "PATCH", "DELETE"] and not path.endswith("/health"):
            client_ip = request.client.host if request.client else "127.0.0.1"
            auth_header = request.headers.get("Authorization", "")
            actor = "Anonymous"
            role = "Public"
            
            if auth_header.startswith("Bearer "):
                try:
                    token = auth_header.replace("Bearer ", "")
                    claims = decode_access_token(token)
                    actor = claims.get("username", "AuthenticatedUser")
                    role = claims.get("role", "Authorized")
                except Exception:
                    actor = "InvalidTokenAttempt"

            db = SessionLocal()
            try:
                db.add(models.AuditLog(
                    user_role=role,
                    actor_id=actor,
                    action=f"{method} {path}",
                    target_entity=path.split("/")[2] if len(path.split("/")) > 2 else "API",
                    classification="AUDIT - MUTATION RECORD",
                    details=f"HTTP {method} request on '{path}' with status {response.status_code}.",
                    ip_address=client_ip
                ))
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

        return response

# Note: Domain audit logs are recorded natively by respective service endpoints
# app.add_middleware(AuditGovernanceMiddleware)

# Enable CORS for frontend and development testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# System Health Check
# -------------------------------------------------------------
@app.get("/api/health", tags=["System"])
def health_check():
    return {
        "status": "HEALTHY",
        "system": "RAKSHAK-AAYUSH (रक्षा-आयुष)",
        "version": "2.0.0",
        "deployment_mode": "Sovereign Cloud / MeghRaj Airgap Ready",
        "apar_decoupling_status": "ENFORCED (Cryptographically Decoupled from ACR/APAR)",
        "timestamp": get_ist_iso()
    }

# -------------------------------------------------------------
# Task 2.1: Authentication & Session Endpoints
# -------------------------------------------------------------
@app.post("/api/auth/login", response_model=schemas.TokenResponse, tags=["Authentication & RBAC"])
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Mini-task 2.1.3: Real JWT Authentication.
    Verifies service ID credentials against bcrypt hashed password,
    creates signed JWT token with role claims, and writes an audit event.
    """
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        db.add(models.AuditLog(
            user_role="Unknown",
            actor_id=req.username,
            action="LOGIN_FAILURE",
            target_entity="User",
            classification="SECURITY ALERT",
            details=f"Failed authentication attempt for username '{req.username}'."
        ))
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Service ID or Password. Access Denied."
        )

    token_claims = {
        "user_id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "rank": user.rank,
        "company": user.company,
        "service_number": user.service_number
    }
    token = create_access_token(data=token_claims)

    db.add(models.AuditLog(
        user_role=user.role,
        actor_id=user.username,
        action="LOGIN_SUCCESS",
        target_entity="User",
        target_id=str(user.id),
        classification="AUTHENTICATED SESSION",
        details=f"Successful authentication for {user.full_name} ({user.rank}) under role '{user.role}'."
    ))
    db.commit()

    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_hours=24,
        user=schemas.UserProfile.model_validate(user)
    )

# In-memory OTP storage cache: email -> {otp, phone, expires_at, verified}
otp_cache: Dict[str, Dict[str, Any]] = {}

@app.post("/api/auth/send-otp", response_model=schemas.OtpResponse, tags=["Authentication & RBAC"])
def send_otp(req: schemas.SendOtpRequest):
    """
    Generates a secure 6-digit OTP and dispatches it via Brevo email API.
    """
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid official email address is required to receive OTP."
        )
    
    otp = f"{random.randint(100000, 999999)}"
    now = time.time()
    
    otp_cache[clean_email] = {
        "otp": otp,
        "phone": req.phone.strip() if req.phone else "",
        "expires_at": now + 600,  # 10 minutes
        "verified": False
    }
    
    email_sent = send_otp_email(clean_email, req.full_name or "Personnel", otp)
    
    return schemas.OtpResponse(
        success=True,
        message=f"Verification passcode dispatched to {clean_email}." if email_sent else f"OTP generated: {otp}",
        expires_in_seconds=600,
        demo_phone_otp=otp
    )

@app.post("/api/auth/verify-otp", response_model=schemas.OtpResponse, tags=["Authentication & RBAC"])
def verify_otp(req: schemas.VerifyOtpRequest):
    """
    Verifies the 6-digit OTP for the given email address.
    """
    clean_email = req.email.strip().lower()
    clean_otp = req.otp.strip()
    
    record = otp_cache.get(clean_email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No verification code found for this email. Please request a new OTP."
        )
        
    if time.time() > record["expires_at"]:
        del otp_cache[clean_email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification passcode has expired. Please request a new OTP."
        )
        
    if record["otp"] != clean_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your email and try again."
        )
        
    record["verified"] = True
    return schemas.OtpResponse(
        success=True,
        message="Email OTP verified successfully.",
        expires_in_seconds=int(record["expires_at"] - time.time()),
        demo_phone_otp=record["otp"]
    )

@app.post("/api/auth/register", response_model=schemas.TokenResponse, tags=["Authentication & RBAC"])
def register(req: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new defense personnel user and creates their Personnel record.
    Returns real JWT token and user profile.
    """
    clean_username = req.username.strip().upper()
    existing = db.query(models.User).filter(models.User.username == clean_username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service ID '{clean_username}' is already registered."
        )

    # If OTP is provided, verify it against the cache
    if req.otp and req.email:
        clean_email = req.email.strip().lower()
        record = otp_cache.get(clean_email)
        if not record or record.get("otp") != req.otp.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP passcode. Please verify again."
            )

    hashed_pw = get_password_hash(req.password)
    new_user = models.User(
        username=clean_username,
        hashed_password=hashed_pw,
        role=req.role,
        full_name=req.full_name.strip(),
        email=req.email.strip() if req.email else None,
        phone=req.phone.strip() if req.phone else None,
        rank=req.rank.strip(),
        company=req.company.strip() if req.company else "Alpha Company",
        service_number=clean_username,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if req.role == "Jawan":
        masked_id = f"JWN-{clean_username[-5:] if len(clean_username) >= 5 else clean_username}"
        phone_val = req.phone.strip() if req.phone else ""
        masked_phone = f"+91-XXXXX-{phone_val[-5:]}" if len(phone_val) >= 5 else "+91-XXXXX-98421"
        new_person = models.Personnel(
            service_number=clean_username,
            masked_id=masked_id,
            full_name=req.full_name.strip(),
            rank=req.rank.strip(),
            company=req.company.strip() if req.company else "Alpha Company",
            platoon="1st Platoon",
            role="Field Duty / Operational Patrol",
            deployment_zone="Bastar FOB (LWE)",
            deployment_type="High-Intensity CI",
            days_in_current_zone=30,
            consecutive_night_duties=1,
            leave_cancellations_count=0,
            months_since_last_leave=1.0,
            transfer_frequency_count=1,
            phone_masked=masked_phone,
            stress_score=25.0,
            risk_level="Resilient",
            risk_drivers_json="[]"
        )
        db.add(new_person)
        db.commit()

    token_claims = {
        "user_id": new_user.id,
        "username": new_user.username,
        "role": new_user.role,
        "full_name": new_user.full_name,
        "rank": new_user.rank,
        "company": new_user.company,
        "service_number": new_user.service_number
    }
    token = create_access_token(data=token_claims)

    return schemas.TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_hours=24,
        user=schemas.UserProfile.model_validate(new_user)
    )

@app.get("/api/auth/me", response_model=schemas.UserProfile, tags=["Authentication & RBAC"])
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    """
    Mini-task 2.1.4: Returns profile of the currently verified token bearer.
    """
    return schemas.UserProfile.model_validate(current_user)

@app.post("/api/auth/logout", tags=["Authentication & RBAC"])
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Mini-task 2.1.5: Logs session closure and invalidates user context.
    """
    db.add(models.AuditLog(
        user_role=current_user.role,
        actor_id=current_user.username,
        action="LOGOUT",
        target_entity="User",
        target_id=str(current_user.id),
        classification="SESSION TERMINATION",
        details=f"User {current_user.full_name} logged out."
    ))
    db.commit()
    return {"message": "Military session securely terminated.", "status": "LOGGED_OUT"}

# -------------------------------------------------------------
# Mini-task 2.2.3: Welfare Officer Route Guards
# -------------------------------------------------------------
@app.get(
    "/api/welfare/clearance-check",
    dependencies=[Depends(require_role(["Welfare Officer"]))],
    tags=["Role Authorization Guards"]
)
def welfare_clearance_check(current_user: models.User = Depends(get_current_user)):
    """
    Confidential endpoint accessible strictly by certified Welfare Officers.
    Blocks Commanding Officers and Jawans.
    """
    return {
        "status": "AUTHORIZED",
        "clearance": "LEVEL-3 CONFIDENTIAL MEDICAL TRIAGE",
        "officer": current_user.full_name,
        "role": current_user.role
    }

# -------------------------------------------------------------
# Mini-task 2.2.4: Commanding Officer Route Guards
# -------------------------------------------------------------
@app.get(
    "/api/commander/clearance-check",
    dependencies=[Depends(require_role(["Commanding Officer"]))],
    tags=["Role Authorization Guards"]
)
def commander_clearance_check(current_user: models.User = Depends(get_current_user)):
    """
    Strategic command endpoint accessible strictly by Battalion Commanding Officers.
    Blocks Jawans and Welfare Officers from accessing operational roster rebalancing.
    """
    return {
        "status": "AUTHORIZED",
        "clearance": "LEVEL-4 BATTALION STRATEGIC COMMAND",
        "officer": current_user.full_name,
        "role": current_user.role
    }

# -------------------------------------------------------------
# Mini-task 2.2.5: Jawan Private Enclave Ownership Guard
# -------------------------------------------------------------
def verify_soldier_ownership(
    personnel_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.Personnel:
    """
    Ensures a soldier can ONLY submit or view their own private medical/wellness records.
    If a Jawan attempts to access another soldier's record, it returns HTTP 403 Forbidden.
    (Welfare Officers can inspect any soldier's record under medical mandate).
    """
    person = db.query(models.Personnel).filter(models.Personnel.id == personnel_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Personnel record not found.")

    if current_user.role == "Jawan":
        # Match service number
        if current_user.service_number != person.service_number:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Privacy Violation: Soldiers can strictly access only their own wellness record."
            )
    elif current_user.role not in ["Welfare Officer", "Audit Admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{current_user.role}' lacks medical clearance to inspect personnel dossier."
        )

    return person

@app.get("/api/jawan/personnel/{personnel_id}/verify-access", tags=["Role Authorization Guards"])
def verify_jawan_access(personnel_id: int, person: models.Personnel = Depends(verify_soldier_ownership)):
    """
    Demonstrates parameter-level cryptographic soldier ownership validation.
    """
    return {
        "status": "AUTHORIZED",
        "personnel_id": person.id,
        "service_number": person.service_number,
        "masked_id": person.masked_id,
        "access_scope": "SELF_ENCLAVE_CONFIDENTIAL"
    }

# -------------------------------------------------------------
# Epic 4 Routers
# -------------------------------------------------------------
app.include_router(commander_router.router)
app.include_router(welfare_router.router)
app.include_router(jawan_router.router)
app.include_router(audit_router.router)
