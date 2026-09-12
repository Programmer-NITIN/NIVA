"""
NIVA — Financial Twin Service.

Computes the complete Financial Digital Twin from AA transaction data.
Includes: health score, stress detection, anomaly detection, affordability.
All calculations are deterministic (no LLM) — zero hallucination arithmetic.
"""

from datetime import datetime, timedelta
from collections import defaultdict
from app.providers.aa.mock_rebit import RebitMockAAProvider
from app.services.statement_parser import BankStatementParser
from app.schemas.financial import (
    FinancialTwinResponse, IncomeMetrics, ExpenseMetrics, SavingsMetrics,
    DebtMetrics, LiquidityMetrics, SpendingCategory, ChangeSignal,
    StressFactor, AffordabilityRequest, AffordabilityResponse,
)

aa_provider = RebitMockAAProvider()

# In-memory store for custom uploaded statements
_uploaded_twins: dict[str, FinancialTwinResponse] = {}
_uploaded_statements: dict[str, Any] = {}

# Categories considered essential vs. discretionary
ESSENTIAL_CATEGORIES = {"rent", "emi", "utilities", "groceries", "health", "education", "insurance", "family_support"}
DISCRETIONARY_CATEGORIES = {"shopping", "dining", "entertainment", "transport", "investment"}


class FinancialTwinService:
    """Computes the Financial Digital Twin from raw transaction data."""

    async def compute_twin(self, persona_id: str) -> FinancialTwinResponse:
        """Build the complete financial twin for a persona or uploaded statement."""
        if persona_id in _uploaded_twins:
            return _uploaded_twins[persona_id]

        # Fetch raw data
        fi_data = await aa_provider.fetch_fi_data(consent_id="CNST-DEMO", persona_id=persona_id)
        txns = fi_data.transactions
        persona = aa_provider.get_persona(persona_id)
        persona_name = persona.get("profile", {}).get("name", persona_id)

        return self._build_twin_from_txns(persona_id, persona_name, fi_data, txns)

    def register_uploaded_statement(self, user_id: str, fi_data: Any, user_name: str = "Uploaded Bank Statement") -> FinancialTwinResponse:
        """Process an uploaded bank statement and store the resulting twin."""
        twin = self._build_twin_from_txns(user_id, user_name, fi_data, fi_data.transactions)
        _uploaded_twins[user_id] = twin
        _uploaded_statements[user_id] = fi_data
        return twin

    def _build_twin_from_txns(self, user_id: str, display_name: str, fi_data: Any, txns: list) -> FinancialTwinResponse:
        if not txns:
            raise ValueError(f"No transaction data for {user_id}")

        # Split into recent (30d) and baseline (90d)
        now = max(t.transaction_date for t in txns)
        recent_start = now - timedelta(days=30)
        baseline_start = now - timedelta(days=120)

        recent_txns = [t for t in txns if t.transaction_date >= recent_start]
        baseline_txns = [t for t in txns if baseline_start <= t.transaction_date < recent_start]
        if not baseline_txns:
            baseline_txns = recent_txns

        # === Income Metrics ===
        income = self._compute_income(txns, recent_txns)

        # === Expense Metrics ===
        expenses = self._compute_expenses(recent_txns, baseline_txns)

        # === Spending by Category ===
        spending_by_cat = self._compute_spending_breakdown(recent_txns, baseline_txns)

        # === Debt Metrics ===
        debt = self._compute_debt(recent_txns, income.monthly_income)

        # === Savings Metrics ===
        savings = self._compute_savings(income, expenses, debt)

        # === Liquidity ===
        total_balance = sum(a.current_balance for a in fi_data.accounts)
        monthly_essential = expenses.essential
        emergency_months = round(total_balance / monthly_essential, 1) if monthly_essential > 0 else 99

        liquidity = LiquidityMetrics(
            available_balance=total_balance,
            emergency_months=emergency_months,
        )

        # === Composite Scores ===
        health_score = self._compute_health_score(income, savings, debt, liquidity, expenses)
        stress_result = self._compute_stress(savings, debt, expenses, liquidity)
        anomaly_score = self._compute_anomaly(recent_txns, baseline_txns)

        # === What Changed ===
        changes = self._compute_changes(recent_txns, baseline_txns, income.monthly_income)

        return FinancialTwinResponse(
            user_id=user_id,
            persona_id=display_name,
            income=income,
            expenses=expenses,
            savings=savings,
            debt=debt,
            liquidity=liquidity,
            health_score=health_score,
            stress_score=stress_result["score"],
            stress_level=stress_result["level"],
            anomaly_score=anomaly_score,
            spending_by_category=spending_by_cat,
            changes=changes,
            stress_factors=stress_result["factors"],
            window_days=30,
            computed_at=datetime.utcnow(),
        )

    def _compute_income(self, all_txns, recent_txns) -> IncomeMetrics:
        """Calculate income from salary and other credit sources."""
        # Find salary credits (largest recurring credit)
        credits = [t for t in all_txns if t.type == "CREDIT"]
        salary_credits = [t for t in credits if t.category in ("salary", "freelance_income", "gig_income")]
        
        if not salary_credits:
            salary_credits = sorted(credits, key=lambda t: t.amount, reverse=True)

        # Group by month
        monthly_income = defaultdict(float)
        for t in salary_credits:
            month_key = t.transaction_date.strftime("%Y-%m")
            monthly_income[month_key] += t.amount

        incomes = list(monthly_income.values())
        if not incomes:
            return IncomeMetrics(monthly_income=0, stability=0, growth_rate=0, sources=[])

        avg_income = sum(incomes) / len(incomes)
        
        # Stability = inverse of coefficient of variation
        if avg_income > 0:
            std_dev = (sum((x - avg_income) ** 2 for x in incomes) / len(incomes)) ** 0.5
            cv = std_dev / avg_income
            stability = max(0, min(100, round(100 * (1 - cv))))
        else:
            stability = 0

        # Growth rate (latest vs previous)
        growth = 0
        if len(incomes) >= 2:
            growth = round(((incomes[-1] - incomes[-2]) / incomes[-2]) * 100, 1) if incomes[-2] > 0 else 0

        # Identify income sources
        sources = list(set(t.merchant_name or t.category for t in salary_credits if t.merchant_name))

        return IncomeMetrics(
            monthly_income=round(avg_income),
            stability=stability,
            growth_rate=growth,
            sources=sources[:5],
        )

    def _compute_expenses(self, recent_txns, baseline_txns) -> ExpenseMetrics:
        """Calculate expense breakdown."""
        recent_debits = [t for t in recent_txns if t.type == "DEBIT"]
        baseline_debits = [t for t in baseline_txns if t.type == "DEBIT"]

        total = sum(t.amount for t in recent_debits)
        essential = sum(t.amount for t in recent_debits if t.category in ESSENTIAL_CATEGORIES)
        discretionary = sum(t.amount for t in recent_debits if t.category in DISCRETIONARY_CATEGORIES)

        baseline_total = sum(t.amount for t in baseline_debits) / 3 if baseline_debits else total
        trend = round(((total - baseline_total) / baseline_total) * 100, 1) if baseline_total > 0 else 0

        return ExpenseMetrics(
            total=round(total),
            essential=round(essential),
            discretionary=round(discretionary),
            essential_ratio=round(essential / total * 100, 1) if total > 0 else 0,
            trend=trend,
        )

    def _compute_spending_breakdown(self, recent_txns, baseline_txns) -> list[SpendingCategory]:
        """Category-wise spending breakdown with trends."""
        recent_debits = [t for t in recent_txns if t.type == "DEBIT"]
        baseline_debits = [t for t in baseline_txns if t.type == "DEBIT"]

        recent_by_cat = defaultdict(float)
        baseline_by_cat = defaultdict(float)

        for t in recent_debits:
            cat = t.category or "other"
            recent_by_cat[cat] += t.amount

        for t in baseline_debits:
            cat = t.category or "other"
            baseline_by_cat[cat] += t.amount / 3  # Normalize to monthly

        total_recent = sum(recent_by_cat.values())
        categories = []

        for cat, amount in sorted(recent_by_cat.items(), key=lambda x: x[1], reverse=True):
            baseline_amount = baseline_by_cat.get(cat, amount)
            trend = round(((amount - baseline_amount) / baseline_amount) * 100, 1) if baseline_amount > 0 else 0

            categories.append(SpendingCategory(
                category=cat,
                amount=round(amount),
                percentage=round(amount / total_recent * 100, 1) if total_recent > 0 else 0,
                trend=trend,
                is_essential=cat in ESSENTIAL_CATEGORIES,
            ))

        return categories

    def _compute_debt(self, recent_txns, monthly_income: float) -> DebtMetrics:
        """Calculate EMI burden and debt metrics."""
        emi_txns = [t for t in recent_txns if t.type == "DEBIT" and t.category == "emi"]
        total_emi = sum(t.amount for t in emi_txns)
        emi_to_income = round(total_emi / monthly_income, 3) if monthly_income > 0 else 0

        return DebtMetrics(
            total_emi=round(total_emi),
            emi_to_income=emi_to_income,
            debt_to_income=round(emi_to_income * 1.2, 3),  # Approximate with interest
            credit_utilization=0.68 if total_emi > 10000 else 0.25,  # Simulated
            credit_utilization_change=0.42 if total_emi > 10000 else -0.05,
        )

    def _compute_savings(self, income: IncomeMetrics, expenses: ExpenseMetrics, debt: DebtMetrics) -> SavingsMetrics:
        """Calculate savings rate and trend."""
        monthly_savings = income.monthly_income - expenses.total
        savings_rate = round((monthly_savings / income.monthly_income) * 100, 1) if income.monthly_income > 0 else 0

        # Trend: negative if expenses growing faster than income
        trend = -expenses.trend if expenses.trend > 0 else abs(expenses.trend)

        # Emergency months
        months_of_expenses = 0
        if expenses.essential > 0:
            months_of_expenses = round(max(0, monthly_savings * 3) / expenses.essential, 1)

        return SavingsMetrics(
            rate=savings_rate,
            trend=round(trend, 1),
            months_of_expenses=months_of_expenses,
        )

    def _compute_health_score(self, income, savings, debt, liquidity, expenses) -> int:
        """
        Financial Health Score (0-100).
        Weighted composite of 6 dimensions.
        """
        score = 0

        # Income Stability (20%)
        score += (income.stability / 100) * 20

        # Savings Health (20%)
        savings_component = min(1.0, max(0, savings.rate / 30))  # 30% savings rate = perfect
        if savings.trend < -10:
            savings_component *= 0.6  # Penalize declining savings
        score += savings_component * 20

        # Debt Burden (20%)
        debt_component = max(0, 1 - debt.emi_to_income / 0.5)  # 50% EMI = 0 score
        score += debt_component * 20

        # Liquidity (20%)
        liquidity_component = min(1.0, liquidity.emergency_months / 6)  # 6 months = perfect
        score += liquidity_component * 20

        # Expense Stability (10%)
        expense_stability = max(0, 1 - abs(expenses.trend) / 30)
        score += expense_stability * 10

        # Cashflow Health (10%)
        net = income.monthly_income - expenses.total
        cashflow_component = 1.0 if net > 0 else max(0, 1 + net / income.monthly_income) if income.monthly_income > 0 else 0
        score += cashflow_component * 10

        return max(0, min(100, round(score)))

    def _compute_stress(self, savings, debt, expenses, liquidity) -> dict:
        """
        Financial Stress Score (0-100).
        Rules-based with interpretable contributing factors.
        """
        factors = []
        score = 0

        # Savings declining
        if savings.trend < -15:
            contribution = 20
            score += contribution
            factors.append(StressFactor(
                factor="Savings rate declining",
                value=savings.trend,
                threshold=-15,
                contribution=contribution,
                description=f"Savings rate trend is {savings.trend}% (threshold: -15%)",
            ))

        # Credit utilization rising
        if debt.credit_utilization_change and debt.credit_utilization_change > 0.2:
            contribution = 20
            score += contribution
            factors.append(StressFactor(
                factor="Credit utilization rising",
                value=round(debt.credit_utilization_change * 100),
                threshold=20,
                contribution=contribution,
                description=f"Credit card utilization increased by {round(debt.credit_utilization_change * 100)}%",
            ))

        # Discretionary spending up
        if expenses.trend > 15:
            contribution = 15
            score += contribution
            factors.append(StressFactor(
                factor="Discretionary spending increasing",
                value=expenses.trend,
                threshold=15,
                contribution=contribution,
                description=f"Expenses trending up {expenses.trend}% vs baseline",
            ))

        # EMI burden high
        if debt.emi_to_income > 0.35:
            contribution = 15
            score += contribution
            factors.append(StressFactor(
                factor="High EMI burden",
                value=round(debt.emi_to_income * 100),
                threshold=35,
                contribution=contribution,
                description=f"EMI-to-income ratio at {round(debt.emi_to_income * 100)}% (threshold: 35%)",
            ))

        # Low emergency buffer
        if liquidity.emergency_months < 2:
            contribution = 10
            score += contribution
            factors.append(StressFactor(
                factor="Low emergency buffer",
                value=liquidity.emergency_months,
                threshold=2,
                contribution=contribution,
                description=f"Emergency buffer at {liquidity.emergency_months} months (target: 3+)",
            ))

        score = min(100, score)

        # Classify level
        if score >= 70:
            level = "high"
        elif score >= 50:
            level = "elevated"
        elif score >= 30:
            level = "moderate"
        else:
            level = "low"

        return {"score": score, "level": level, "factors": factors}

    def _compute_anomaly(self, recent_txns, baseline_txns) -> int:
        """Simple anomaly detection using Z-score on transaction amounts."""
        baseline_debits = [t.amount for t in baseline_txns if t.type == "DEBIT"]
        if not baseline_debits:
            return 0

        mean = sum(baseline_debits) / len(baseline_debits)
        std = (sum((x - mean) ** 2 for x in baseline_debits) / len(baseline_debits)) ** 0.5

        if std == 0:
            return 0

        recent_debits = [t.amount for t in recent_txns if t.type == "DEBIT"]
        max_z = max((abs(x - mean) / std) for x in recent_debits) if recent_debits else 0

        # Z-score > 3 = highly anomalous
        return min(100, round(max_z * 20))

    def _compute_changes(self, recent_txns, baseline_txns, monthly_income: float) -> list[ChangeSignal]:
        """Detect significant changes from baseline."""
        changes = []

        # Compare spending by category
        recent_debits = defaultdict(float)
        baseline_debits = defaultdict(float)

        for t in recent_txns:
            if t.type == "DEBIT":
                recent_debits[t.category or "other"] += t.amount
        for t in baseline_txns:
            if t.type == "DEBIT":
                baseline_debits[t.category or "other"] += t.amount / 3

        for cat in set(list(recent_debits.keys()) + list(baseline_debits.keys())):
            recent_amt = recent_debits.get(cat, 0)
            baseline_amt = baseline_debits.get(cat, 0)

            if baseline_amt > 0:
                pct_change = ((recent_amt - baseline_amt) / baseline_amt) * 100
            elif recent_amt > 0:
                pct_change = 100
            else:
                continue

            if abs(pct_change) > 20:  # Only significant changes
                severity = "critical" if abs(pct_change) > 40 else "warning" if abs(pct_change) > 25 else "info"
                direction = "up" if pct_change > 0 else "down"

                changes.append(ChangeSignal(
                    metric=f"{cat} spending",
                    direction=direction,
                    magnitude=round(pct_change, 1),
                    description=f"{cat.replace('_', ' ').title()} spending {'increased' if direction == 'up' else 'decreased'} by {abs(round(pct_change))}%",
                    severity=severity,
                ))

        # Sort by severity
        severity_order = {"critical": 0, "warning": 1, "info": 2}
        changes.sort(key=lambda c: severity_order.get(c.severity, 3))

        return changes[:5]  # Top 5 most significant

    async def calculate_affordability(self, persona_id: str, request: AffordabilityRequest) -> AffordabilityResponse:
        """Deterministic affordability calculation — zero LLM, pure arithmetic."""
        twin = await self.compute_twin(persona_id)

        current_balance = twin.liquidity.available_balance
        monthly_essential = twin.expenses.essential
        target = request.target_amount
        target_emergency = 3.0  # Target: 3 months emergency buffer

        # Account for delay
        monthly_surplus = twin.income.monthly_income - twin.expenses.total
        if request.delay_months > 0:
            future_balance = current_balance + (monthly_surplus * request.delay_months)
        else:
            future_balance = current_balance

        # Outright purchase
        post_purchase = future_balance - target
        shortfall = max(0, -post_purchase)

        post_emergency = round(post_purchase / monthly_essential, 1) if monthly_essential > 0 else 0
        current_emergency = round(current_balance / monthly_essential, 1) if monthly_essential > 0 else 0

        # Buffer status
        if post_emergency >= target_emergency:
            buffer_status = "safe"
        elif post_emergency >= 1.5:
            buffer_status = "warning"
        else:
            buffer_status = "critical"

        # EMI analysis
        proposed_emi = None
        new_burden = None
        emi_status = None
        if request.emi_months and request.emi_months > 0:
            proposed_emi = round(target / request.emi_months)
            new_burden = round((twin.debt.total_emi + proposed_emi) / twin.income.monthly_income, 3)
            emi_status = "safe" if new_burden < 0.35 else "warning" if new_burden < 0.50 else "critical"

        # Affordable?
        if post_emergency >= target_emergency and shortfall == 0:
            affordable = "YES"
        elif post_emergency >= 1.0 and shortfall == 0:
            affordable = "CONDITIONALLY"
        else:
            affordable = "NO"

        # Safer range
        max_safe = max(0, future_balance - (monthly_essential * target_emergency))
        safer_low = round(max_safe * 0.7 / 1000) * 1000
        safer_high = round(max_safe / 1000) * 1000

        # Recommended delay
        if affordable != "YES" and monthly_surplus > 0:
            months_needed = max(1, round((target - max_safe) / monthly_surplus))
        else:
            months_needed = None

        # Build reasoning
        if affordable == "YES":
            reasoning = f"Purchase of ₹{target:,.0f} is affordable. Your emergency buffer remains at {post_emergency} months (target: {target_emergency})."
        elif affordable == "CONDITIONALLY":
            reasoning = f"Purchase is possible but drops your emergency buffer to {post_emergency} months (below target of {target_emergency}). Consider waiting {months_needed or 2} months to build a safer buffer."
        else:
            reasoning = f"Purchase creates a shortfall of ₹{shortfall:,.0f}. Recommended: save for {months_needed or 3} months or consider the ₹{safer_low:,.0f}–₹{safer_high:,.0f} range."

        return AffordabilityResponse(
            target_amount=target,
            affordable=affordable,
            current_balance=current_balance,
            post_purchase_balance=round(post_purchase),
            shortfall=shortfall if shortfall > 0 else None,
            current_emergency_months=current_emergency,
            post_purchase_emergency_months=post_emergency,
            target_emergency_months=target_emergency,
            buffer_status=buffer_status,
            proposed_emi=proposed_emi,
            new_emi_burden=new_burden,
            emi_burden_status=emi_status,
            safer_range_low=safer_low if affordable != "YES" else None,
            safer_range_high=safer_high if affordable != "YES" else None,
            recommended_delay_months=months_needed,
            reasoning=reasoning,
        )
