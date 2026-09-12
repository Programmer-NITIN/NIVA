"""NIVA — AA (Account Aggregator) API Routes."""

from fastapi import APIRouter, HTTPException, Query
from app.schemas.aa import ConsentCreateRequest, ConsentResponse, ConsentStatusResponse, FIDataResponse
from app.providers.aa.mock_rebit import RebitMockAAProvider
from app.providers.aa.setu import SetuAAProvider
from app.config import settings

router = APIRouter()
mock_provider = RebitMockAAProvider()
setu_provider = SetuAAProvider(
    base_url=settings.setu_base_url,
    client_id=settings.setu_client_id,
    client_secret=settings.setu_client_secret,
    product_instance_id=settings.setu_product_instance_id,
)

def get_provider(mode: str | None = None):
    chosen = mode or settings.aa_mode
    if chosen == "setu":
        return setu_provider
    return mock_provider


@router.post("/consents", response_model=ConsentResponse)
async def create_consent(request: ConsentCreateRequest, mode: str | None = Query(None)):
    """Create an AA consent request for financial data access (Mock or Setu Live)."""
    try:
        provider = get_provider(mode)
        return await provider.create_consent(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/consents/{consent_id}", response_model=ConsentStatusResponse)
async def get_consent_status(consent_id: str, mode: str | None = Query(None)):
    """Check the status of a consent request."""
    try:
        provider = get_provider(mode)
        return await provider.get_consent_status(consent_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/consents/{consent_id}/approve", response_model=ConsentStatusResponse)
async def approve_consent(consent_id: str, otp: str = "123456", mode: str | None = Query(None)):
    """Approve a consent."""
    try:
        provider = get_provider(mode)
        return await provider.approve_consent(consent_id, otp)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/fi-data/{consent_id}", response_model=FIDataResponse)
async def fetch_fi_data(consent_id: str, persona_id: str = "rajesh_sharma", mode: str | None = Query(None)):
    """Fetch financial data for an approved consent."""
    try:
        provider = get_provider(mode)
        return await provider.fetch_fi_data(consent_id, persona_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/consents/{consent_id}/revoke")
async def revoke_consent(consent_id: str, mode: str | None = Query(None)):
    """Revoke an active consent."""
    provider = get_provider(mode)
    success = await provider.revoke_consent(consent_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Consent {consent_id} not found")
    return {"status": "revoked", "consent_id": consent_id}


@router.get("/personas")
async def list_personas():
    """List all available demo personas."""
    return {"personas": mock_provider.list_personas()}


@router.get("/setu-status")
async def get_setu_status():
    """Check Setu Bridge configuration credentials."""
    return {
        "configured": bool(settings.setu_client_id and settings.setu_client_secret),
        "base_url": settings.setu_base_url,
        "client_id_masked": f"{settings.setu_client_id[:8]}...{settings.setu_client_id[-4:]}" if settings.setu_client_id else None,
        "product_instance_id": settings.setu_product_instance_id,
        "mode": settings.aa_mode,
    }

