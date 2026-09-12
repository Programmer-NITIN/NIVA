"""
NIVA — Gemini LLM Provider.

Uses Google Gemini API with function calling for the copilot.
Falls back to rule-based responses if no API key is configured.
"""

import json
from typing import Optional
from app.config import settings

# Lazy import — only loaded when Gemini is actually used
_model = None


def _get_model():
    """Lazy-initialize Gemini model."""
    global _model
    if _model is not None:
        return _model

    if not settings.gemini_api_key:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model_kwargs = {"system_instruction": SYSTEM_PROMPT}
        try:
            _model = genai.GenerativeModel("gemini-3.6-flash", **model_kwargs)
        except TypeError:
            _model = genai.GenerativeModel("gemini-3.6-flash")
        return _model
    except Exception as e:
        print(f"[NIVA] Gemini init failed: {e}")
        return None


SYSTEM_PROMPT = """You are NIVA (Nuanced Intelligence Virtual Advisor), a responsible financial copilot for Indian banking customers.

CORE RULES:
1. You NEVER hallucinate financial numbers. All amounts, balances, EMIs, and percentages must come from the tool call results, not your imagination.
2. You speak Hindi, English, and Gujarati. Match the user's language accurately.
3. When communicating in Hindi, use authentic, respectful terminology ("aap") and Bharat financial terms: "kist" for EMI, "byaj" for interest, "bachat" for savings, "bima" for insurance, "karz/udhaar" for debt.
4. When communicating in Gujarati, use respectful terms: "hafto" for EMI, "vyaj" for interest, "bachat" for savings, "bimo" for insurance.
5. Emphasize non-predatory, safe financial habits. If someone is experiencing financial stress or a medical emergency, recommend empathetic interventions (like emergency moratoriums or PM SVANidhi 7% lines) instead of high-interest credit.
6. When asked about affordability, ALWAYS use the calculate_affordability tool first. Present the EXACT numbers from the tool result.
7. Keep responses concise and empowering (2-4 sentences max for conversational queries).
8. Use Indian currency formatting (₹, lakhs, crores) naturally.
9. Always mention RBI Account Aggregator as the data source for customer trust.
"""


# Function declarations for Gemini function calling
TOOL_DECLARATIONS = [
    {
        "name": "calculate_affordability",
        "description": "Calculate whether the user can afford a purchase given their current financial state. Returns exact balance analysis, emergency buffer impact, and safer alternatives.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_amount": {
                    "type": "number",
                    "description": "The amount in INR the user wants to spend"
                },
                "delay_months": {
                    "type": "integer",
                    "description": "Number of months to delay the purchase (0 = buy now)"
                },
                "description": {
                    "type": "string",
                    "description": "What the user wants to buy"
                }
            },
            "required": ["target_amount"]
        }
    },
    {
        "name": "get_spending_breakdown",
        "description": "Get the user's spending breakdown by category for the current month. Shows essential vs discretionary split with trends.",
        "parameters": {
            "type": "object",
            "properties": {},
        }
    },
    {
        "name": "get_financial_health",
        "description": "Get the user's complete financial health including health score, stress score, emergency buffer, and stress factors.",
        "parameters": {
            "type": "object",
            "properties": {},
        }
    },
    {
        "name": "get_stress_signals",
        "description": "Get the user's financial stress signals and what changed from their baseline behavior.",
        "parameters": {
            "type": "object",
            "properties": {},
        }
    },
    {
        "name": "get_gate_verdict",
        "description": "Check why a product recommendation was suppressed or approved by the Responsible Gate.",
        "parameters": {
            "type": "object",
            "properties": {
                "product_type": {
                    "type": "string",
                    "description": "Product type: personal_loan, credit_card, emergency_fund, fixed_deposit, sip, health_insurance"
                }
            },
            "required": ["product_type"]
        }
    },
]


async def generate_response(
    message: str,
    persona_id: str,
    language: str = "en",
    tool_results: Optional[dict] = None,
) -> dict:
    """
    Generate a copilot response using Gemini with function calling.
    Returns: { reply: str, tool_calls: list, language: str }
    """
    model = _get_model()

    if model is None:
        # Fallback to rule-based
        return _fallback_response(message, language)

    try:
        # Dynamically fetch ML intelligence context for persona
        ml_context = ""
        try:
            from app.services.twin import FinancialTwinService
            twin_svc = FinancialTwinService()
            twin = await twin_svc.compute_twin(persona_id)

            # Life stage prediction
            try:
                from app.ml.lifestage_classifier import LifeStageClassifier
                lsc = LifeStageClassifier()
                ls_pred = lsc.predict_single({
                    "age": 34,
                    "monthly_income": twin.income.monthly_income,
                    "savings_rate": twin.savings.rate,
                    "dti": twin.debt.dti,
                    "total_net_worth": twin.liquidity.available_balance,
                    "dependents": 2,
                    "risk_tolerance": 0.4
                })
                life_stage_name = ls_pred.get("predicted_stage_name", "Earning Adult")
            except Exception:
                life_stage_name = "Working Professional / Merchant"

            top_factors = [f"{f.factor} ({f.impact})" for f in twin.stress_factors[:3]]

            ml_context = f"""
ML Financial Twin Intelligence:
- Predicted Life-Stage: {life_stage_name}
- Stress Score: {twin.stress_score}/100 ({twin.stress_level})
- Top Stress Risk Factors (SHAP TreeExplainer): {', '.join(top_factors) if top_factors else 'Healthy Baseline'}
- Liquid Runway: {twin.liquidity.emergency_months} months
- Debt-to-Income (DTI): {round(twin.debt.dti * 100, 1)}%
"""
        except Exception:
            ml_context = ""

        # Build prompt with rich context
        context = f"""User language preference: {language}
Active persona: {persona_id}
{ml_context}
User message: {message}"""

        if tool_results:
            context += f"\n\nTool results (use these EXACT numbers in your response):\n{json.dumps(tool_results, indent=2, default=str)}"

        response = model.generate_content(
            context,
            tools=[{"function_declarations": TOOL_DECLARATIONS}] if not tool_results else None,
        )

        # Check for function calls
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "function_call") and part.function_call:
                    fc = part.function_call
                    return {
                        "reply": None,
                        "tool_calls": [{
                            "name": fc.name,
                            "args": dict(fc.args) if fc.args else {},
                            "status": "pending",
                        }],
                        "language": language,
                    }

        # Text response
        reply = response.text if response.text else "I couldn't process that. Please try again."
        return {
            "reply": reply,
            "tool_calls": [],
            "language": language,
        }

    except Exception as e:
        print(f"[NIVA] Gemini error: {e}")
        return _fallback_response(message, language)


def _fallback_response(message: str, language: str) -> dict:
    """Rule-based fallback when Gemini is not available."""
    msg = message.lower()

    if language == "gu" or any(w in msg for w in ["kharidi", "ketla", "paisa", "kharch"]):
        lang = "gu"
    elif language == "hi" or any(w in msg for w in ["khareed", "kharcha", "kitna", "salary", "paise"]):
        lang = "hi"
    else:
        lang = "en"

    if any(w in msg for w in ["afford", "buy", "purchase", "khareed", "kharidi", "laptop", "phone", "price"]):
        return {
            "reply": None,
            "tool_calls": [{"name": "calculate_affordability", "args": _extract_amount(msg), "status": "pending"}],
            "language": lang,
        }
    elif any(w in msg for w in ["spend", "kharcha", "kharch", "expense", "spending", "category"]):
        return {
            "reply": None,
            "tool_calls": [{"name": "get_spending_breakdown", "args": {}, "status": "pending"}],
            "language": lang,
        }
    elif any(w in msg for w in ["stress", "tension", "health", "score", "sehat", "tandurasti"]):
        return {
            "reply": None,
            "tool_calls": [{"name": "get_financial_health", "args": {}, "status": "pending"}],
            "language": lang,
        }
    elif any(w in msg for w in ["suppress", "gate", "why", "loan", "reject", "block", "kem"]):
        return {
            "reply": None,
            "tool_calls": [{"name": "get_gate_verdict", "args": {"product_type": "personal_loan"}, "status": "pending"}],
            "language": lang,
        }
    elif any(w in msg for w in ["signal", "change", "badal", "kya hua", "shu thayu"]):
        return {
            "reply": None,
            "tool_calls": [{"name": "get_stress_signals", "args": {}, "status": "pending"}],
            "language": lang,
        }
    else:
        if lang == "gu":
            reply = "Namaskar! Hu NIVA chhu, tamaro financial copilot. Tame mane puchhi shako chho: shu hu laptop kharidi shaku? Ke tamaro spending breakdown juo. Shu janvu chhe?"
        elif lang == "hi":
            reply = "Namaste! Main NIVA hoon, aapka financial copilot. Aap mujhse pooch sakte hain: kya main laptop khareed sakta hoon? Ya phir apna spending breakdown dekhein. Kya jaanna chahte hain?"
        else:
            reply = "Hi! I'm NIVA, your financial copilot. I can help you check affordability, understand spending patterns, explain your financial health, or tell you why a product was suppressed. What would you like to know?"
        return {"reply": reply, "tool_calls": [], "language": lang}


def _extract_amount(msg: str) -> dict:
    """Extract amount from message text."""
    import re
    # Match patterns like ₹65,000 or 65000 or 65k
    match = re.search(r'[₹Rs.]?\s*([\d,]+)\s*(?:k|K)?', msg)
    if match:
        amount_str = match.group(1).replace(",", "")
        amount = int(amount_str)
        if "k" in msg.lower() and amount < 1000:
            amount *= 1000
        return {"target_amount": amount, "delay_months": 0}
    return {"target_amount": 50000, "delay_months": 0}
