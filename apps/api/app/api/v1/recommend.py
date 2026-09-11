"""NIVA — Recommendation + Responsible Gate API Routes."""

from fastapi import APIRouter, HTTPException
from app.schemas.recommendation import RecommendationListResponse
from app.services.gate import ResponsibleGateService

router = APIRouter()
gate_service = ResponsibleGateService()


@router.get("/{persona_id}", response_model=RecommendationListResponse)
async def get_recommendations(persona_id: str):
    """Get all product recommendations with gate decisions for a persona."""
    try:
        return await gate_service.evaluate_all_products(persona_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{persona_id}/gate-verdict/{product_type}")
async def get_gate_verdict(persona_id: str, product_type: str):
    """Get gate verdict for a specific product type."""
    try:
        return await gate_service.evaluate_product(persona_id, product_type)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
