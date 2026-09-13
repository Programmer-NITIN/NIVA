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


AVAILABLE_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
]


def _call_gemini_with_fallback(context: str, tools=None):
    """Call Gemini across a resilient fallback pool to ensure zero 429 quota disruptions."""
    if not getattr(settings, "gemini_api_key", None):
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)
        model_kwargs = {"system_instruction": SYSTEM_PROMPT}

        last_error = None
        for model_name in AVAILABLE_MODELS:
            try:
                try:
                    model = genai.GenerativeModel(model_name, **model_kwargs)
                except TypeError:
                    model = genai.GenerativeModel(model_name)
                response = model.generate_content(context, tools=tools)
                return response
            except Exception as e:
                last_error = e
                print(f"[NIVA] Model {model_name} failed: {e}. Trying next model in pool...")
                continue

        if last_error:
            raise last_error
        return None
    except Exception as e:
        print(f"[NIVA] Gemini init/call failed: {e}")
        return None


SYSTEM_PROMPT = """You are NIVA (Nuanced Intelligence Virtual Advisor), a responsible financial copilot for Indian banking customers.

CORE RULES:
1. You NEVER hallucinate financial numbers. All amounts, balances, EMIs, and percentages must come from the tool call results, not your imagination.
2. You speak Hindi, English, and Gujarati. Match the user's language accurately.
3. When communicating in Hindi, use authentic, respectful terminology ("aap") and Bharat financial terms: "kist" for EMI, "byaj" for interest, "bachat" for savings, "bima" for insurance, "karz/udhaar" for debt.
4. When communicating in Gujarati, use respectful terms: "hafto" for EMI, "vyaj" for interest, "bachat" for savings, "bimo" for insurance.
5. Emphasize non-predatory, safe financial habits. If someone is experiencing financial stress or a medical emergency, recommend empathetic interventions (like emergency moratoriums or PM SVANidhi 7% lines) instead of high-interest credit.
6. When asked about affordability of any purchase (e.g. phones, iPhone, laptop, bike, car, gold, AC, appliances), ALWAYS invoke the calculate_affordability tool first. If the user mentions a gadget like 'iPhone' without an explicit rupee figure, infer realistic contemporary Indian retail pricing (e.g. latest iPhone: ₹79,900, iPhone Pro: ₹1,34,900, laptop: ₹60,000, two-wheeler/bike: ₹90,000, car: ₹6,50,000). Never confuse device model numbers (like 15, 16, 18, 24) with rupee prices!
7. Present the EXACT numbers from the tool results (current balance, post-purchase balance, emergency months remaining).
8. Keep responses concise, warm, empathetic, and empowering (2-4 short sections or bullet points).
9. Use Indian currency formatting (₹, lakhs, crores) naturally.
10. Always mention RBI Account Aggregator as the verified data source for customer trust.
"""


# Function declarations for Gemini function calling
TOOL_DECLARATIONS = [
    {
        "name": "calculate_affordability",
        "description": "Calculate whether the user can afford a purchase given their current financial state. Returns exact balance analysis, emergency buffer impact, and safer alternatives.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "target_amount": {
                    "type": "NUMBER",
                    "description": "The amount in INR the user wants to spend"
                },
                "delay_months": {
                    "type": "INTEGER",
                    "description": "Number of months to delay the purchase (0 = buy now)"
                },
                "description": {
                    "type": "STRING",
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
            "type": "OBJECT",
            "properties": {},
        }
    },
    {
        "name": "get_financial_health",
        "description": "Get the user's complete financial health including health score, stress score, emergency buffer, and stress factors.",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
        }
    },
    {
        "name": "get_stress_signals",
        "description": "Get the user's financial stress signals and what changed from their baseline behavior.",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
        }
    },
    {
        "name": "get_gate_verdict",
        "description": "Check why a product recommendation was suppressed or approved by the Responsible Gate.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "product_type": {
                    "type": "STRING",
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
    if not getattr(settings, "gemini_api_key", None):
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
        context = f"""{SYSTEM_PROMPT}

User language preference: {language}
Active persona: {persona_id}
{ml_context}
User message: {message}"""

        if tool_results:
            context += f"\n\nTool results (use these EXACT numbers in your response):\n{json.dumps(tool_results, indent=2, default=str)}"

        tools_param = [{"function_declarations": TOOL_DECLARATIONS}] if not tool_results else None
        response = _call_gemini_with_fallback(context, tools=tools_param)

        if not response:
            return _fallback_response(message, language)

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
        reply = None
        try:
            if response.text:
                reply = response.text
        except Exception:
            pass

        if not reply and response.candidates and response.candidates[0].content.parts:
            text_parts = [p.text for p in response.candidates[0].content.parts if hasattr(p, "text") and p.text]
            if text_parts:
                reply = " ".join(text_parts)

        return {
            "reply": reply or "I reviewed your financial state via Account Aggregator. How else can I assist?",
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

    if any(w in msg for w in ["afford", "buy", "purchase", "khareed", "kharidi", "laptop", "phone", "iphone", "bike", "car", "tv", "price"]):
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
    """Extract amount from message text, with smart fallbacks for common Bharat purchases."""
    import re
    msg_clean = msg.lower()

    # 1. Match explicit currency notations (e.g. ₹ 65,000, Rs 15000, 15k, 2.5 lakh)
    currency_patterns = [
        r'(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand|lakh|lac)?',
        r'([\d,]+(?:\.\d+)?)\s*(?:k|thousand|lakh|lac)\s*(?:₹|rs\.?|inr|rupees)?',
        r'([\d,]+(?:\.\d+)?)\s*(?:rupees|bucks)',
    ]
    for pat in currency_patterns:
        m = re.search(pat, msg_clean)
        if m:
            raw = m.group(1).replace(",", "")
            try:
                amt = float(raw)
                if "k" in msg_clean or "thousand" in msg_clean:
                    amt *= 1000
                elif "lakh" in msg_clean or "lac" in msg_clean:
                    amt *= 100000
                if amt >= 100:
                    return {"target_amount": float(amt), "delay_months": 0, "description": msg[:50]}
            except ValueError:
                pass

    # 2. Check for explicit 4+ digit numbers (e.g. 50000, 15000) while avoiding model numbers like 14, 15, 16, 18, 24
    m = re.search(r'\b(\d{4,7})\b', msg_clean)
    if m:
        try:
            amt = float(m.group(1))
            return {"target_amount": amt, "delay_months": 0, "description": msg[:50]}
        except ValueError:
            pass

    # 3. Smart retail pricing inference for common Bharat purchases
    if "iphone" in msg_clean or "apple phone" in msg_clean:
        if "pro" in msg_clean:
            return {"target_amount": 134900.0, "delay_months": 0, "description": "iPhone Pro"}
        return {"target_amount": 79900.0, "delay_months": 0, "description": "Latest iPhone"}
    elif "macbook" in msg_clean:
        return {"target_amount": 99900.0, "delay_months": 0, "description": "MacBook"}
    elif "laptop" in msg_clean or "computer" in msg_clean:
        return {"target_amount": 55000.0, "delay_months": 0, "description": "Laptop"}
    elif "car" in msg_clean or "gaadi" in msg_clean:
        return {"target_amount": 650000.0, "delay_months": 0, "description": "Car"}
    elif any(w in msg_clean for w in ["bike", "scooter", "activa", "two wheeler", "bullet"]):
        return {"target_amount": 90000.0, "delay_months": 0, "description": "Two-Wheeler"}
    elif any(w in msg_clean for w in ["tv", "television"]):
        return {"target_amount": 35000.0, "delay_months": 0, "description": "Smart TV"}
    elif "fridge" in msg_clean or "refrigerator" in msg_clean:
        return {"target_amount": 28000.0, "delay_months": 0, "description": "Refrigerator"}
    elif "ac" in msg_clean or "air conditioner" in msg_clean:
        return {"target_amount": 38000.0, "delay_months": 0, "description": "Air Conditioner"}
    elif any(w in msg_clean for w in ["phone", "mobile", "smartphone"]):
        return {"target_amount": 22000.0, "delay_months": 0, "description": "Smartphone"}
    elif any(w in msg_clean for w in ["gold", "sona"]):
        return {"target_amount": 75000.0, "delay_months": 0, "description": "Gold (10g)"}

    return {"target_amount": 50000.0, "delay_months": 0, "description": "General Purchase"}
