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


@router.post("/reset")
async def reset_demo():
    """One-click Judge Reset: clears uploaded state and restores personas."""
    from app.services.twin import _uploaded_twins, _uploaded_statements
    from app.api.v1.journey import _accepted_relief_actions, PERSONA_KYC
    from app.services.pots import _pots_store
    _uploaded_twins.clear()
    _uploaded_statements.clear()
    _accepted_relief_actions.clear()
    _pots_store.clear()
    # keep base personas
    _active_persona["persona_id"] = "rajesh_sharma"
    return {"status": "reset", "message": "Demo state cleared. Personas restored."}
