"""
NIVA — AA Provider Abstract Base Class.
Both RebitMockAAProvider and SetuAAProvider implement this interface.
"""

from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.aa import (
    ConsentCreateRequest,
    ConsentResponse,
    ConsentStatusResponse,
    FIDataResponse,
)


class AAProvider(ABC):
    """
    Abstract base class for Account Aggregator providers.
    
    This interface defines the contract for interacting with the
    RBI Account Aggregator ecosystem. Implementations include:
    - RebitMockAAProvider: Local ReBIT-spec-compliant simulation
    - SetuAAProvider: Real Setu AA Bridge integration
    
    Selected via AA_MODE environment variable ("mock" | "setu").
    """

    @abstractmethod
    async def create_consent(self, request: ConsentCreateRequest) -> ConsentResponse:
        """
        Create a consent request for financial data access.
        Returns consent_id and optional redirect URL for user approval.
        """
        ...

    @abstractmethod
    async def get_consent_status(self, consent_id: str) -> ConsentStatusResponse:
        """Check the current status of a consent request."""
        ...

    @abstractmethod
    async def approve_consent(self, consent_id: str, otp: Optional[str] = None) -> ConsentStatusResponse:
        """
        Simulate or process consent approval.
        In mock mode: auto-approves with simulated OTP.
        In Setu mode: handled via webhook from Setu's consent UI.
        """
        ...

    @abstractmethod
    async def fetch_fi_data(self, consent_id: str) -> FIDataResponse:
        """
        Fetch financial data for an approved consent.
        Returns account summaries and transaction history.
        """
        ...

    @abstractmethod
    async def revoke_consent(self, consent_id: str) -> bool:
        """Revoke an active consent. Returns True if successful."""
        ...
