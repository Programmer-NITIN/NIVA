"""
NIVA — Copilot API Routes.

Uses Gemini function calling for intelligent responses.
Executes tool calls server-side with real financial data.
Falls back to rule-based routing when Gemini API key is not set.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from app.providers.llm.gemini import generate_response
from app.services.twin import FinancialTwinService
from app.services.gate import ResponsibleGateService

router = APIRouter()
twin_service = FinancialTwinService()
gate_service = ResponsibleGateService()


class ChatRequest(BaseModel):
    message: str
    persona_id: str = "rajesh_sharma"
    language: str = "en"


class ChatResponse(BaseModel):
    reply: str
    language: str
    tool_calls: list[dict] = []
    data: Optional[dict] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to NIVA copilot.
    
    Flow:
    1. Message → Gemini (or fallback) → may return tool_calls
    2. If tool_calls → execute them server-side with real data
    3. Feed tool results back to Gemini for natural language response
    4. Return final response with data
    """
    # Step 1: Get initial response (may contain tool calls)
    result = await generate_response(
        message=request.message,
        persona_id=request.persona_id,
        language=request.language,
    )

    # Step 2: If tool calls, execute them and get data
    if result.get("tool_calls") and not result.get("reply"):
        tool_data = {}
        for tc in result["tool_calls"]:
            tc["status"] = "executed"
            tool_data = await _execute_tool(
                tc["name"],
                tc.get("args", {}),
                request.persona_id,
            )

        # Step 3: Feed data back to Gemini for natural language
        final = await generate_response(
            message=request.message,
            persona_id=request.persona_id,
            language=request.language,
            tool_results=tool_data,
        )

        # If Gemini gives a response, use it; otherwise format the data
        reply = final.get("reply") or _format_tool_result(
            result["tool_calls"][0]["name"],
            tool_data,
            request.language,
        )

        return ChatResponse(
            reply=reply,
            language=result.get("language", request.language),
            tool_calls=result.get("tool_calls", []),
            data=tool_data,
        )

    # Direct response (no tool calls needed)
    return ChatResponse(
        reply=result.get("reply", "I'm not sure how to help with that. Try asking about your spending, affordability, or financial health."),
        language=result.get("language", request.language),
        tool_calls=[],
    )


async def _execute_tool(tool_name: str, args: dict, persona_id: str) -> dict:
    """Execute a tool call and return the data."""
    try:
        if tool_name == "calculate_affordability":
            from app.schemas.financial import AffordabilityRequest
            req = AffordabilityRequest(
                target_amount=args.get("target_amount", 50000),
                delay_months=args.get("delay_months", 0),
                description=args.get("description"),
            )
            result = await twin_service.calculate_affordability(persona_id, req)
            return result.model_dump()

        elif tool_name == "get_spending_breakdown":
            twin = await twin_service.compute_twin(persona_id)
            return {
                "total_expenses": twin.expenses.total,
                "essential": twin.expenses.essential,
                "discretionary": twin.expenses.discretionary,
                "essential_ratio": twin.expenses.essential_ratio,
                "trend": twin.expenses.trend,
                "categories": [c.model_dump() for c in twin.spending_by_category[:6]],
            }

        elif tool_name == "get_financial_health":
            twin = await twin_service.compute_twin(persona_id)
            return {
                "health_score": twin.health_score,
                "stress_score": twin.stress_score,
                "stress_level": twin.stress_level,
                "anomaly_score": twin.anomaly_score,
                "monthly_income": twin.income.monthly_income,
                "savings_rate": twin.savings.rate,
                "emergency_months": twin.liquidity.emergency_months,
                "emi_to_income": twin.debt.emi_to_income,
                "stress_factors": [f.model_dump() for f in twin.stress_factors],
            }

        elif tool_name == "get_stress_signals":
            twin = await twin_service.compute_twin(persona_id)
            return {
                "changes": [c.model_dump() for c in twin.changes],
                "stress_factors": [f.model_dump() for f in twin.stress_factors],
                "stress_score": twin.stress_score,
                "stress_level": twin.stress_level,
            }

        elif tool_name == "get_gate_verdict":
            product_type = args.get("product_type", "personal_loan")
            verdict = await gate_service.evaluate_product(persona_id, product_type)
            return verdict.model_dump()

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    except Exception as e:
        return {"error": str(e)}


def _format_tool_result(tool_name: str, data: dict, language: str) -> str:
    """Format tool results into a readable response when Gemini is unavailable."""
    if "error" in data:
        return f"Sorry, I couldn't fetch that data: {data['error']}"

    if tool_name == "calculate_affordability":
        amt = data.get("target_amount", 0)
        verdict = data.get("affordable", "UNKNOWN")
        balance = data.get("current_balance", 0)
        post = data.get("post_purchase_balance", 0)
        buffer = data.get("post_purchase_emergency_months", 0)
        reasoning = data.get("reasoning", "")
        desc = data.get("description") or "this item"

        if language == "gu":
            return f"Tamaro current balance ₹{balance:,.0f} chhe. ₹{amt:,.0f} ni kharidi ({desc}) pachhi ₹{post:,.0f} bachshe ane {buffer:.1f} months no emergency runway raheshe. {reasoning}"
        elif language == "hi":
            return f"Aapka current verified balance ₹{balance:,.0f} hai. ₹{amt:,.0f} ki kharid ({desc}) ke baad ₹{post:,.0f} bachega aur {buffer:.1f} mahine ka emergency buffer rahega. {reasoning}"
        return f"Based on your verified RBI Account Aggregator balance of ₹{balance:,.0f}, purchasing {desc} (estimated at ₹{amt:,.0f}) leaves your balance at ₹{post:,.0f} with {buffer:.1f} months of emergency runway. {reasoning}"

    elif tool_name == "get_spending_breakdown":
        total = data.get("total_expenses", 0)
        trend = data.get("trend", 0)
        cats = data.get("categories", [])
        top_cats = ", ".join([f"{c['category']} (₹{c['amount']:,.0f})" for c in cats[:3]])

        if language == "gu":
            return f"Aa mahine tame kul ₹{total:,.0f} kharch karya chhe, je baseline thi {trend:.0f}% {'vadhu' if trend > 0 else 'ochhu'} chhe. Top categories: {top_cats}."
        elif language == "hi":
            return f"Is mahine aapne kul ₹{total:,.0f} kharch kiye hain, jo baseline se {trend:.0f}% {'zyada' if trend > 0 else 'kam'} hai. Top categories: {top_cats}."
        return f"This month you've spent ₹{total:,.0f} total, which is {abs(trend):.0f}% {'higher' if trend > 0 else 'lower'} than your baseline. Top categories: {top_cats}."

    elif tool_name == "get_financial_health":
        score = data.get("health_score", 0)
        stress = data.get("stress_score", 0)
        level = data.get("stress_level", "unknown")
        buffer = data.get("emergency_months", 0)
        factors = data.get("stress_factors", [])
        factor_text = "; ".join([f["description"] for f in factors[:2]])

        if language == "gu":
            return f"Tamaro financial health score {score}/100 chhe ane stress score {stress}/100 ({level}) chhe. Emergency buffer {buffer} months chhe. Key factors: {factor_text}"
        elif language == "hi":
            return f"Aapka financial health score {score}/100 hai aur stress score {stress}/100 ({level}) hai. Emergency buffer {buffer} months hai. Key factors: {factor_text}"
        return f"Your financial health score is {score}/100 and stress score is {stress}/100 ({level}). Emergency buffer: {buffer} months. Key factors: {factor_text}"

    elif tool_name == "get_stress_signals":
        changes = data.get("changes", [])
        stress = data.get("stress_score", 0)
        level = data.get("stress_level", "unknown")
        change_text = "; ".join([c["description"] for c in changes[:3]])

        return f"Stress score: {stress}/100 ({level}). Recent changes from your baseline: {change_text}"

    elif tool_name == "get_gate_verdict":
        product = data.get("product_name", "Unknown")
        decision = data.get("decision", "UNKNOWN")
        reason = data.get("gate_reason", "")
        alt = data.get("alternative_action", "")

        if decision == "SUPPRESS":
            return f"The {product} was SUPPRESSED by the Responsible Gate. Reason: {reason} Recommended alternative: {alt}"
        return f"The {product} is RECOMMENDED. {reason}"

    return "Here's what I found based on your verified financial data."
