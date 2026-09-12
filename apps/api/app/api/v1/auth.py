"""
NIVA — Real Auth (OTP + JWT + RBAC).
Uses hashed OTP stored in memory + JWT httpOnly pattern.
For production swap to MSG91/Firebase verify without code changes.
"""
from datetime import datetime, timedelta
import hashlib
import secrets
import re

from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError

from app.config import settings

router = APIRouter()
security = HTTPBearer(auto_error=False)

# In-memory OTP store: phone -> {otp_hash, expires, attempts}
_otp_store: dict[str, dict] = {}

OTP_TTL_MIN = 5
OTP_MAX_ATTEMPTS = 5
PHONE_RE = re.compile(r"^\+?91[\s\-]?[6-9]\d{9}$|^[6-9]\d{9}$")

def _normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return "+91" + digits
    if len(digits) == 12 and digits.startswith("91"):
        return "+" + digits
    return phone.strip()

def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()

def _gen_otp() -> str:
    return f"{secrets.randbelow(900000)+100000:06d}"

class SendOtpRequest(BaseModel):
    phone: str

class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str

def create_access_token(phone: str, persona_id: str = "custom_user", role: str = "customer") -> str:
    payload = {
        "sub": phone,
        "persona_id": persona_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), request: Request = None):
    # Try Authorization Bearer, then cookie
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif request:
        token = request.cookies.get("niva_token")
        if not token:
            # also check header
            auth = request.headers.get("authorization", "")
            if auth.lower().startswith("bearer "):
                token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated. Please login with OTP.")
    payload = decode_token(token)
    return payload

def require_role(*roles):
    async def _checker(user=Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden: insufficient role")
        return user
    return _checker

@router.post("/send-otp")
async def send_otp(req: SendOtpRequest):
    phone = _normalize_phone(req.phone)
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    otp = _gen_otp()
    # In dev, log OTP; in prod integrate MSG91
    print(f"[NIVA AUTH] OTP for {phone}: {otp}")
    _otp_store[phone] = {
        "otp_hash": _hash_otp(otp),
        "expires": datetime.utcnow() + timedelta(minutes=OTP_TTL_MIN),
        "attempts": 0,
        "otp_plain_dev": otp,  # only for dev display
    }
    # For hackathon demo, return OTP in response when not prod
    dev_otp = otp if settings.app_env != "production" else None
    return {"status": "sent", "phone": phone, "expires_in": OTP_TTL_MIN*60, "dev_otp": dev_otp}

@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest, response: Response):
    phone = _normalize_phone(req.phone)
    rec = _otp_store.get(phone)
    if not rec:
        raise HTTPException(status_code=400, detail="No OTP sent. Please request OTP first.")
    if datetime.utcnow() > rec["expires"]:
        _otp_store.pop(phone, None)
        raise HTTPException(status_code=400, detail="OTP expired. Please resend.")
    if rec["attempts"] >= OTP_MAX_ATTEMPTS:
        _otp_store.pop(phone, None)
        raise HTTPException(status_code=429, detail="Too many attempts. Please resend OTP.")
    rec["attempts"] += 1
    if _hash_otp(req.otp.strip()) != rec["otp_hash"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    # success
    _otp_store.pop(phone, None)
    token = create_access_token(phone)
    # Set httpOnly cookie (secure false for localhost)
    response.set_cookie("niva_token", token, httponly=True, samesite="lax", max_age=settings.access_token_expire_minutes*60, path="/")
    return {"status": "verified", "phone": phone, "access_token": token, "token_type": "bearer"}

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"phone": user.get("sub"), "persona_id": user.get("persona_id"), "role": user.get("role")}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("niva_token", path="/")
    return {"status": "logged_out"}
