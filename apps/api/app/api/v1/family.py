from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.family import create_family, household_twin, list_families

router = APIRouter()

class CreateFamilyReq(BaseModel):
    head_persona_id: str
    members: List[str] = []
    name: str = "My Family"

@router.post("/create")
async def create(req: CreateFamilyReq):
    try:
        fam = await create_family(req.head_persona_id, req.members, req.name)
        return fam
    except Exception as e:
        raise HTTPException(400, str(e))

@router.get("/list")
async def list_all():
    return {"families": list_families()}

@router.get("/{family_id}")
async def get_household(family_id: str):
    try:
        return await household_twin(family_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
