"""
NIVA — Setu AA Provider (Stub).

This is a plug-in adapter for the real Setu AA Bridge API.
To activate: set AA_MODE=setu in .env and provide Setu credentials.

Status: STUB — ready for real integration when Setu sandbox credentials arrive.
"""

from typing import Optional
from app.providers.aa.base import AAProvider
from app.schemas.aa import (
    ConsentCreateRequest,
    ConsentResponse,
    ConsentStatusResponse,
    FIDataResponse,
)


class SetuAAProvider(AAProvider):
    """
    Real Setu AA Bridge integration.
    
    API Reference: https://docs.setu.co/data/account-aggregator
    
    Requires:
    - SETU_CLIENT_ID
    - SETU_CLIENT_SECRET
    - SETU_PRODUCT_INSTANCE_ID
    
    To enable: Set AA_MODE=setu in .env
    """

    def __init__(self, base_url: str, client_id: str, client_secret: str, product_instance_id: str):
        self.base_url = base_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.product_instance_id = product_instance_id
        # TODO: Initialize httpx.AsyncClient with auth headers

    async def create_consent(self, request: ConsentCreateRequest) -> ConsentResponse:
        """
        POST /consents
        
        Creates a consent request on Setu AA Bridge.
        Returns a consent_id and a redirect_url for the user to approve.
        
        TODO: Implement when Setu sandbox credentials are available.
        """
        raise NotImplementedError(
            "SetuAAProvider is not yet configured. "
            "Set AA_MODE=mock to use RebitMockAAProvider, or "
            "provide Setu credentials in .env to enable live AA."
        )

    async def get_consent_status(self, consent_id: str) -> ConsentStatusResponse:
        """
        GET /consents/{consent_id}
        
        TODO: Implement polling or webhook-based status check.
        """
        raise NotImplementedError("SetuAAProvider not configured.")

    async def approve_consent(self, consent_id: str, otp: Optional[str] = None) -> ConsentStatusResponse:
        """
        In Setu mode, approval happens via Setu's hosted consent UI.
        This method would be called by the webhook handler.
        """
        raise NotImplementedError("SetuAAProvider not configured.")

    async def fetch_fi_data(self, consent_id: str) -> FIDataResponse:
        """
        POST /sessions → GET /sessions/{id}
        
        Creates a data session for an approved consent, then fetches
        the decrypted financial data.
        
        TODO: Implement FI data fetch with session creation.
        """
        raise NotImplementedError("SetuAAProvider not configured.")

    async def revoke_consent(self, consent_id: str) -> bool:
        """
        POST /consents/{consent_id}/revoke
        
        TODO: Implement consent revocation.
        """
        raise NotImplementedError("SetuAAProvider not configured.")
