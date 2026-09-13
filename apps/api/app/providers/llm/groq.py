"""
NIVA — Groq LLM Provider.

Uses Groq API with function calling for the Ask NIVA copilot.
Configured for high-speed inference with models like openai/gpt-oss-120b.
Falls back to Gemini or rule-based responses if necessary.
"""

import json
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any

from app.config import settings

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are NIVA (Nuanced Intelligence Virtual Advisor), a responsible, hyper-personalized financial copilot for Indian banking customers.

CORE PRINCIPLES & RULES:
1. YOU NEVER HALLUCINATE FINANCIAL NUMBERS. All amounts, balances, EMIs, and percentages must come directly from verified tool call results or user statements.
2. FORMAT YOUR RESPONSES WITH HIGH STRUCTURE:
   - Use clear markdown section headers (e.g., ### 📊 Financial Assessment, ### 🔢 Snapshot & Impact, ### 💡 Actionable Advice, ### 🛡️ Responsible Safety Guardrail).
   - Present numerical metrics in clean Markdown tables or bold bullet points with Indian Rupee formatting (₹, Lakhs, Crores).
   - Keep answers clear, empowering, empathetic, and scannable.
3. LANGUAGE & TONE:
   - Match the user's language accurately (English, Hindi, or Gujarati).
   - When communicating in Hindi: use respectful "Aap" phrasing and authentic Bharat financial terms (e.g., "Kist" for EMI, "Byaj" for Interest, "Bachat" for Savings, "Bima" for Insurance, "Aapatkaalin Nidhi" for Emergency Buffer).
   - When communicating in Gujarati: use respectful terms ("Hafto" for EMI, "Vyaj" for Interest, "Bachat" for Savings, "Bimo" for Insurance).
4. NON-PREDATORY FINANCIAL ETHICS:
   - If a customer is experiencing financial stress, medical strain, or low buffers, advise caution and recommend safe restructuring or government relief schemes (like PM SVANidhi 7% credit or emergency buffers) instead of high-interest unsecured credit.
5. TOOL INVOCATION:
   - When asked about affordability of any purchase (e.g. iPhone, smartphone, laptop, bike, car, gold, medical expense, home appliance), ALWAYS invoke `calculate_affordability`.
   - If the user mentions a gadget like 'iPhone' without an explicit rupee amount, use contemporary Indian retail pricing (e.g., iPhone: ₹79,900, iPhone Pro: ₹1,34,900, laptop: ₹60,000, two-wheeler/bike: ₹90,000, car: ₹6,50,000). Never confuse product model numbers (15, 16, 24) with price!
6. Always mention the RBI Account Aggregator framework as the verified, consent-driven data source for building customer trust.
"""

GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "calculate_affordability",
            "description": "Calculate whether the user can afford a purchase given their current financial state. Returns exact balance analysis, emergency buffer impact, and safer alternatives.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_amount": {
                        "type": "number",
                        "description": "The amount in INR the user wants to spend",
                    },
                    "delay_months": {
                        "type": "integer",
                        "description": "Number of months to delay the purchase (0 = buy now)",
                    },
                    "description": {
                        "type": "string",
                        "description": "What the user wants to buy (e.g. laptop, phone, medical expense)",
                    },
                },
                "required": ["target_amount"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_spending_breakdown",
            "description": "Get the user's spending breakdown by category for the current month. Shows essential vs discretionary split with trends.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_financial_health",
            "description": "Get the user's complete financial health including health score, stress score, emergency buffer, and stress factors.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_stress_signals",
            "description": "Get the user's financial stress signals and what changed from their baseline behavior.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_gate_verdict",
            "description": "Check why a product recommendation was suppressed or approved by the Responsible Gate.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_type": {
                        "type": "string",
                        "description": "Product type: personal_loan, credit_card, emergency_fund, fixed_deposit, sip, health_insurance",
                    }
                },
                "required": ["product_type"],
            },
        },
    },
]


async def generate_response(
    message: str,
    persona_id: str,
    language: str = "en",
    tool_results: Optional[dict] = None,
) -> dict:
    """
    Generate a copilot response using Groq API with model (e.g. openai/gpt-oss-120b).
    Returns: { "reply": str, "tool_calls": list, "language": str }
    """
    api_key = getattr(settings, "groq_api_key", None)
    if not api_key:
        # Fallback to Gemini if available
        if getattr(settings, "gemini_api_key", None):
            try:
                from app.providers.llm.gemini import generate_response as gemini_gen
                return await gemini_gen(message, persona_id, language, tool_results)
            except Exception:
                pass
        return _fallback_response(message, language)

    model_name = getattr(settings, "groq_model", "openai/gpt-oss-120b") or "openai/gpt-oss-120b"

    # Fetch live ML Digital Twin context
    ml_context = ""
    try:
        from app.services.twin import FinancialTwinService
        twin_svc = FinancialTwinService()
        twin = await twin_svc.compute_twin(persona_id)

        life_stage_name = "Earning Professional / MSME"
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
                "risk_tolerance": 0.4,
            })
            life_stage_name = ls_pred.get("predicted_stage_name", "Earning Professional")
        except Exception:
            pass

        top_factors = [f"{f.factor} ({f.impact})" for f in twin.stress_factors[:3]]

        ml_context = f"""
LIVE FINANCIAL TELEMETRY & DIGITAL TWIN:
- Verified Account Holder Persona: {persona_id}
- Available Liquid Balance: ₹{twin.liquidity.available_balance:,.0f}
- Monthly Inflow / Income: ₹{twin.income.monthly_income:,.0f}
- Essential Expenses: ₹{twin.expenses.essential:,.0f}
- Existing Monthly Debt EMIs: ₹{twin.debt.total_emi:,.0f}
- Debt-to-Income (DTI): {round(twin.debt.dti * 100, 1)}%
- Liquid Emergency Buffer: {twin.liquidity.emergency_months:.1f} months
- Financial Health Score: {twin.health_score}/100
- Financial Stress Score: {twin.stress_score}/100 ({twin.stress_level.upper()})
- Predicted Life-Stage: {life_stage_name}
- Top Risk Factors: {', '.join(top_factors) if top_factors else 'Healthy Baseline'}
"""
    except Exception as e:
        ml_context = f"Active Persona: {persona_id}"

    # Build messages
    messages: List[Dict[str, Any]] = [
        {
            "role": "system",
            "content": f"{SYSTEM_PROMPT}\n\n{ml_context}\n\nActive User Preferred Language: {language}",
        }
    ]

    # If this is a tool result follow-up
    if tool_results:
        messages.append({"role": "user", "content": message})
        messages.append({
            "role": "assistant",
            "content": None,
            "tool_calls": [
                {
                    "id": "call_niva_action",
                    "type": "function",
                    "function": {
                        "name": tool_results.get("tool_name", "calculate_affordability"),
                        "arguments": json.dumps(tool_results.get("args", {})),
                    },
                }
            ],
        })
        messages.append({
            "role": "tool",
            "tool_call_id": "call_niva_action",
            "content": json.dumps(tool_results, default=str),
        })
        messages.append({
            "role": "user",
            "content": f"Please provide a comprehensive, formatted response explaining these verified financial calculation results to the customer in {language}.",
        })
    else:
        messages.append({"role": "user", "content": message})

    payload: Dict[str, Any] = {
        "model": model_name,
        "messages": messages,
        "temperature": 0.2,
    }

    # Only include tools on initial queries
    if not tool_results:
        payload["tools"] = GROQ_TOOLS
        payload["tool_choice"] = "auto"

    try:
        req = urllib.request.Request(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (NIVA Financial Intelligence)",
            },
            data=json.dumps(payload).encode("utf-8"),
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        choice = data.get("choices", [{}])[0]
        msg = choice.get("message", {})

        # Handle tool calls
        raw_tool_calls = msg.get("tool_calls")
        if raw_tool_calls:
            parsed_tool_calls = []
            for tc in raw_tool_calls:
                func = tc.get("function", {})
                args = {}
                try:
                    args = json.loads(func.get("arguments", "{}"))
                except Exception:
                    args = {}
                parsed_tool_calls.append({"name": func.get("name"), "args": args})

            return {
                "reply": "",
                "tool_calls": parsed_tool_calls,
                "language": language,
            }

        reply_content = msg.get("content", "")
        return {
            "reply": reply_content,
            "tool_calls": [],
            "language": language,
        }

    except Exception as e:
        print(f"[NIVA] Groq generation error ({model_name}): {e}", flush=True)
        # Try fallback to Gemini
        if getattr(settings, "gemini_api_key", None):
            try:
                from app.providers.llm.gemini import generate_response as gemini_gen
                return await gemini_gen(message, persona_id, language, tool_results)
            except Exception:
                pass
        return _fallback_response(message, language)


def _fallback_response(message: str, language: str) -> dict:
    """Structured rule-based fallback if Groq API is temporarily unreachable."""
    msg_lower = message.lower()

    if "afford" in msg_lower or "buy" in msg_lower or "kharid" in msg_lower or "iphone" in msg_lower:
        import re
        nums = re.findall(r"\d+", message.replace(",", ""))
        amount = int(nums[0]) if nums else 50000
        return {
            "reply": "",
            "tool_calls": [{"name": "calculate_affordability", "args": {"target_amount": amount, "description": "purchase"}}],
            "language": language,
        }

    if "spending" in msg_lower or "kharch" in msg_lower:
        return {
            "reply": "",
            "tool_calls": [{"name": "get_spending_breakdown", "args": {}}],
            "language": language,
        }

    if "stress" in msg_lower or "health" in msg_lower or "score" in msg_lower:
        return {
            "reply": "",
            "tool_calls": [{"name": "get_financial_health", "args": {}}],
            "language": language,
        }

    if language == "hi":
        reply = (
            "### 🛡️ NIVA वित्तीय साथी\n\n"
            "नमस्ते! मैं आपका सुरक्षित वित्तीय सहायक हूँ।\n\n"
            "- **खर्च और बजट**: आप पूछ सकते हैं कि क्या आप कोई नया सामान (जैसे फोन, लैपटॉप या वाहन) खरीद सकते हैं।\n"
            "- **वित्तीय स्वास्थ्य**: अपने डिजिटल ट्विन और इमरजेंसी बफर की स्थिति जानें।\n"
            "- **सुरक्षित योजनाएं**: अपने खाते के लिए सरकार और बैंक द्वारा अनुमोदित योजनाएं देखें।\n\n"
            "कृपया अपना सवाल पूछें।"
        )
    elif language == "gu":
        reply = (
            "### 🛡️ NIVA નાણાકીય સાથી\n\n"
            "નમસ્તે! હું તમારો વિશ્વાસપાત્ર નાણાકીય સહાયક છું.\n\n"
            "- **ખર્ચ વિશ્લેષણ**: તમે ચકાસી શકો છો કે નવો ખર્ચ તમારા બજેટ માટે સુરક્ષિત છે કે નહીં.\n"
            "- **ડિજિટલ ટ્વીન**: તમારો ઈમરજન્સી બફર અને ક્રેડિટ સ્કોર ચકાસો.\n"
            "- **સુરક્ષિત યોજનાઓ**: બેંક દ્વારા માન્ય યોજનાઓ જુઓ.\n\n"
            "તમારો પ્રશ્ન જણાવો."
        )
    else:
        reply = (
            "### 🛡️ NIVA Financial Copilot\n\n"
            "Hello! I am your responsible financial copilot backed by RBI Account Aggregator telemetry.\n\n"
            "- **Affordability Analysis**: Ask *'Can I afford a laptop for ₹60,000?'* or *'Can I buy an iPhone?'*\n"
            "- **Emergency Buffers**: Ask *'What is my liquid runway?'* or *'How can I build emergency savings?'*\n"
            "- **Spending Review**: Ask *'How much did I spend on dining and groceries this month?'*\n\n"
            "How can I assist your financial journey today?"
        )

    return {"reply": reply, "tool_calls": [], "language": language}
