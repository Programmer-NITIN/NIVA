"""NIVA — AA (Account Aggregator) API Routes."""

from fastapi import APIRouter, HTTPException
from app.schemas.aa import ConsentCreateRequest, ConsentResponse, ConsentStatusResponse, FIDataResponse
from app.providers.aa.mock_rebit import RebitMockAAProvider

router = APIRouter()
aa_provider = RebitMockAAProvider()


@router.post("/consents", response_model=ConsentResponse)
async def create_consent(request: ConsentCreateRequest):
    """Create an AA consent request for financial data access."""
    try:
        return await aa_provider.create_consent(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/consents/{consent_id}", response_model=ConsentStatusResponse)
async def get_consent_status(consent_id: str):
    """Check the status of a consent request."""
    try:
        return await aa_provider.get_consent_status(consent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/consents/{consent_id}/approve", response_model=ConsentStatusResponse)
async def approve_consent(consent_id: str, otp: str = "123456"):
    """Approve a consent (mock: any OTP works)."""
    try:
        return await aa_provider.approve_consent(consent_id, otp)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/fi-data/{consent_id}", response_model=FIDataResponse)
async def fetch_fi_data(consent_id: str, persona_id: str = "rajesh_sharma"):
    """Fetch financial data for an approved consent."""
    try:
        return await aa_provider.fetch_fi_data(consent_id, persona_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/consents/{consent_id}/revoke")
async def revoke_consent(consent_id: str):
    """Revoke an active consent."""
    success = await aa_provider.revoke_consent(consent_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Consent {consent_id} not found")
    return {"status": "revoked", "consent_id": consent_id}


@router.get("/personas")
async def list_personas():
    """List all available demo personas."""
    return {"personas": aa_provider.list_personas()}
