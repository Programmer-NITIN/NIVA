"""
NIVA Backend — SQLAlchemy ORM Models.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    String, Integer, Float, Text, Boolean, DateTime, JSON,
    ForeignKey, Enum, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


# ─── Enums ────────────────────────────────────────────────────────────────

class UserRole(str, PyEnum):
    CUSTOMER = "customer"
    BANK_AGENT = "bank_agent"
    ADMIN = "admin"


class ConsentStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REVOKED = "revoked"
    EXPIRED = "expired"


class StressLevel(str, PyEnum):
    LOW = "low"
    MODERATE = "moderate"
    ELEVATED = "elevated"
    HIGH = "high"
    CRITICAL = "critical"


class GateDecision(str, PyEnum):
    RECOMMEND = "recommend"
    SUPPRESS = "suppress"
    ESCALATE = "escalate"


class TransactionType(str, PyEnum):
    DEBIT = "debit"
    CREDIT = "credit"


class TransactionMode(str, PyEnum):
    UPI = "upi"
    NEFT = "neft"
    IMPS = "imps"
    RTGS = "rtgs"
    CASH = "cash"
    CARD = "card"
    AUTO_DEBIT = "auto_debit"
    OTHER = "other"


# ─── Models ───────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    phone: Mapped[str] = mapped_column(String(15), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CUSTOMER)
    persona_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(10), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    consents: Mapped[list["Consent"]] = relationship(back_populates="user")
    accounts: Mapped[list["FinancialAccount"]] = relationship(back_populates="user")
    financial_states: Mapped[list["FinancialState"]] = relationship(back_populates="user")
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="user")


class Consent(Base):
    __tablename__ = "consents"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    aa_consent_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[ConsentStatus] = mapped_column(
        Enum(ConsentStatus), default=ConsentStatus.PENDING
    )
    purpose: Mapped[str] = mapped_column(String(200), default="Financial health analysis")
    fi_types: Mapped[dict] = mapped_column(JSON, default=lambda: ["DEPOSIT"])
    data_range_months: Mapped[int] = mapped_column(Integer, default=6)
    consent_expiry: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="consents")


class FinancialAccount(Base):
    __tablename__ = "financial_accounts"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    fip_id: Mapped[str] = mapped_column(String(50))  # e.g., "HDFC", "SBI"
    account_type: Mapped[str] = mapped_column(String(30), default="DEPOSIT")
    masked_account_number: Mapped[str] = mapped_column(String(20))  # "XXXX 4521"
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ifsc: Mapped[str | None] = mapped_column(String(11), nullable=True)
    current_balance: Mapped[float] = mapped_column(Float, default=0.0)
    last_synced: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="account")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_transactions_user_date", "user_id", "transaction_date"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("financial_accounts.id"), index=True)
    txn_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType))
    mode: Mapped[TransactionMode] = mapped_column(Enum(TransactionMode))
    amount: Mapped[float] = mapped_column(Float)
    balance_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    narration: Mapped[str] = mapped_column(Text)
    merchant_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    category_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    transaction_date: Mapped[datetime] = mapped_column(DateTime, index=True)
    value_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    account: Mapped["FinancialAccount"] = relationship(back_populates="transactions")


class FinancialState(Base):
    """Financial Digital Twin — snapshot of a customer's financial health."""
    __tablename__ = "financial_states"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)

    # Core metrics
    monthly_income: Mapped[float] = mapped_column(Float, default=0.0)
    income_stability: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100
    total_expenses: Mapped[float] = mapped_column(Float, default=0.0)
    essential_expenses: Mapped[float] = mapped_column(Float, default=0.0)
    discretionary_expenses: Mapped[float] = mapped_column(Float, default=0.0)
    savings_rate: Mapped[float] = mapped_column(Float, default=0.0)
    savings_trend: Mapped[float] = mapped_column(Float, default=0.0)  # % change
    total_emi: Mapped[float] = mapped_column(Float, default=0.0)
    emi_to_income: Mapped[float] = mapped_column(Float, default=0.0)
    debt_to_income: Mapped[float] = mapped_column(Float, default=0.0)
    available_balance: Mapped[float] = mapped_column(Float, default=0.0)
    emergency_months: Mapped[float] = mapped_column(Float, default=0.0)
    net_monthly_cashflow: Mapped[float] = mapped_column(Float, default=0.0)
    cashflow_volatility: Mapped[float] = mapped_column(Float, default=0.0)

    # Composite scores
    health_score: Mapped[int] = mapped_column(Integer, default=50)  # 0-100
    stress_score: Mapped[int] = mapped_column(Integer, default=0)   # 0-100
    anomaly_score: Mapped[int] = mapped_column(Integer, default=0)  # 0-100

    # Stress details
    stress_level: Mapped[StressLevel] = mapped_column(
        Enum(StressLevel), default=StressLevel.LOW
    )
    stress_factors: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Spending breakdown
    spending_by_category: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Changes from baseline
    changes_from_baseline: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Window
    window_days: Mapped[int] = mapped_column(Integer, default=30)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="financial_states")


class Recommendation(Base):
    """Product recommendation with responsible AI gate decision."""
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)

    # Product info
    product_type: Mapped[str] = mapped_column(String(50))  # e.g., "personal_loan"
    product_name: Mapped[str] = mapped_column(String(100))

    # Gate decision
    gate_decision: Mapped[GateDecision] = mapped_column(Enum(GateDecision))
    gate_reason: Mapped[str] = mapped_column(Text)
    policy_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Eligibility
    is_eligible: Mapped[bool] = mapped_column(Boolean, default=False)
    is_suitable: Mapped[bool] = mapped_column(Boolean, default=False)

    # Details
    eligibility_factors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    suitability_factors: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    alternative_action: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Metadata
    model_version: Mapped[str] = mapped_column(String(20), default="v1.0")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="recommendations")


class AuditLog(Base):
    """Immutable audit trail for every decision and data access."""
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    actor: Mapped[str] = mapped_column(String(100))  # "system", user_id, "setu_aa"
    action: Mapped[str] = mapped_column(String(100))  # "fi_fetch", "stress_run", "gate_decision"
    resource_type: Mapped[str] = mapped_column(String(50))  # "consent", "recommendation"
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    result: Mapped[str] = mapped_column(String(50))  # "success", "suppressed", "error"
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    policy_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    integrity_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
