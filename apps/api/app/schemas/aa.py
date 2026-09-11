"""NIVA — Pydantic schemas for AA (Account Aggregator) operations."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ConsentCreateRequest(BaseModel):
    phone: str
    duration_months: int = 6
    fi_types: list[str] = ["DEPOSIT"]


class ConsentResponse(BaseModel):
    consent_id: str
    status: str
    redirect_url: Optional[str] = None
    created_at: datetime


class ConsentStatusResponse(BaseModel):
    consent_id: str
    status: str
    accounts_linked: int = 0
    updated_at: datetime


class FIAccountSummary(BaseModel):
    fip_id: str
    account_type: str
    masked_number: str
    branch: Optional[str] = None
    ifsc: Optional[str] = None
    current_balance: float


class FITransaction(BaseModel):
    id: str
    type: str  # "DEBIT" | "CREDIT"
    mode: str  # "UPI" | "NEFT" | etc.
    amount: float
    balance_after: Optional[float] = None
    narration: str
    merchant_name: Optional[str] = None
    category: Optional[str] = None
    transaction_date: datetime
    reference_id: Optional[str] = None


class FIDataResponse(BaseModel):
    consent_id: str
    accounts: list[FIAccountSummary]
    transactions: list[FITransaction]
    data_range_start: datetime
    data_range_end: datetime
    total_transactions: int
