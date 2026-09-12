"""
NIVA Backend — API Router.
All v1 routes are registered here.
"""

from fastapi import APIRouter

from app.api.v1 import aa, twin, recommend, copilot, bank, demo, journey, ml

api_router = APIRouter()

api_router.include_router(aa.router, prefix="/aa", tags=["Account Aggregator"])
api_router.include_router(twin.router, prefix="/twin", tags=["Financial Twin"])
api_router.include_router(recommend.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(copilot.router, prefix="/copilot", tags=["NIVA Copilot"])
api_router.include_router(bank.router, prefix="/bank", tags=["Bank Copilot"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo"])
api_router.include_router(journey.router, prefix="/journey", tags=["Real-World Journey"])
api_router.include_router(ml.router, prefix="/ml", tags=["ML Intelligence & Explainability"])
