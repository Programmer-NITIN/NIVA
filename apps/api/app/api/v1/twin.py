"""NIVA — Financial Twin API Routes."""

from fastapi import APIRouter, HTTPException
from app.schemas.financial import FinancialTwinResponse, AffordabilityRequest, AffordabilityResponse
from app.services.twin import FinancialTwinService

router = APIRouter()
twin_service = FinancialTwinService()


@router.get("/{persona_id}", response_model=FinancialTwinResponse)
async def get_financial_twin(persona_id: str):
    """Get the complete Financial Digital Twin for a persona."""
    try:
        return await twin_service.compute_twin(persona_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{persona_id}/signals")
async def get_signals(persona_id: str):
    """Get change signals (what changed from baseline)."""
    try:
        twin = await twin_service.compute_twin(persona_id)
        return {"persona_id": persona_id, "changes": twin.changes, "stress_factors": twin.stress_factors}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{persona_id}/affordability", response_model=AffordabilityResponse)
async def check_affordability(persona_id: str, request: AffordabilityRequest):
    """Run the affordability simulation engine."""
    try:
        return await twin_service.calculate_affordability(persona_id, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
