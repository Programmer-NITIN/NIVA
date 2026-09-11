"""NIVA — Demo Mode API Routes."""

from fastapi import APIRouter

router = APIRouter()

# Active persona state (in-memory for hackathon)
_active_persona = {"persona_id": "rajesh_sharma"}


@router.get("/active")
async def get_active_persona():
    """Get the currently active demo persona."""
    return _active_persona


@router.post("/switch/{persona_id}")
async def switch_persona(persona_id: str):
    """Switch the active demo persona."""
    valid = ["rajesh_sharma", "anita_desai", "vikram_patel"]
    if persona_id not in valid:
        return {"error": f"Unknown persona. Valid: {valid}"}
    _active_persona["persona_id"] = persona_id
    return {"status": "switched", "persona_id": persona_id}
