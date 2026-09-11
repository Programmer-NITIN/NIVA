"use client";

import { useState, useEffect, useRef } from "react";
import { checkAffordability, sendChatMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type PersonaId = "rajesh_sharma" | "anita_desai" | "vikram_patel";

interface Message {
  role: "user" | "niva";
  text: string;
  data?: any;
  timestamp: Date;
}

export default function AskNivaPage() {
  const [persona] = useState<PersonaId>("rajesh_sharma");
  const [language, setLanguage] = useState<"en" | "hi" | "gu">("en");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "niva",
      text: "Hi! I'm NIVA, your financial copilot. I can help you understand your spending, check if you can afford a purchase, and explain your financial health. Try asking me something like:\n\n• \"Can I afford a ₹65,000 laptop?\"\n• \"How much did I spend on dining this month?\"\n• \"Why did NIVA suppress the personal loan?\"\n• \"Agli salary aane tak kitna kharch kar sakte hain?\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [affordability, setAffordability] = useState<any>(null);
  const [sliderAmount, setSliderAmount] = useState(65000);
  const [sliderDelay, setSliderDelay] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voice input via Web Speech API
  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg, timestamp: new Date() }]);
    setLoading(true);

    try {
      // All messages go through the unified copilot endpoint
      const result = await sendChatMessage(userMsg, persona, language);

      // If the copilot returned affordability data, populate the slider
      if (result.data?.target_amount) {
        setAffordability(result.data);
        setSliderAmount(result.data.target_amount);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "niva",
          text: result.reply,
          data: result.data,
          timestamp: new Date(),
        },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "niva", text: `Error: ${e.message}. Make sure the backend is running.`, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSliderChange() {
    setLoading(true);
    try {
      const result = await checkAffordability(persona, sliderAmount, sliderDelay);
      setAffordability(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="navbar-brand">
            <span className="navbar-brand-icon">N</span>
            NIVA
          </a>
          <ul className="navbar-tabs">
            <li><a href="/">Overview</a></li>
            <li><a href="/financial-state">Financial State</a></li>
            <li><a href="/spending">Spending</a></li>
            <li><a href="/ask-niva" className="active">Ask NIVA</a></li>
            <li><a href="/responsible-gate">Responsible Gate</a></li>
            <li><a href="/consent">Consent Center</a></li>
            <li><a href="/bank">Bank Portal</a></li>
          </ul>
          <div className="navbar-right">
            <div className="chip chip-neutral">EN | हिन्दी | ગુજ</div>
          </div>
        </div>
      </nav>

      <div className="page-container page-content">
        <div className="stack-xl">
          {/* Header */}
          <section>
            <div className="card" style={{ background: "var(--niva-canvas)" }}>
              <span className="label-sm text-muted">✦ ZERO HALLUCINATION ARITHMETIC</span>
              <h1 className="headline-lg" style={{ marginTop: 4 }}>Ask NIVA Financial Intelligence</h1>
              <p className="body-md text-secondary" style={{ marginTop: 4 }}>
                Deterministic arithmetic execution with RBI Account Aggregator telemetry • Verified bank state with no generative estimation
              </p>
            </div>
          </section>

          {/* Chat Messages */}
          <div className="stack-lg">
            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-in">
                {msg.role === "user" ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      background: "var(--niva-deep-forest)",
                      color: "#fff",
                      padding: "12px 20px",
                      borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)",
                      maxWidth: "70%",
                      fontSize: 15,
                    }}>
                      &quot;{msg.text}&quot;
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <div className="flex-gap-sm" style={{ marginBottom: 8 }}>
                      <span className="navbar-brand-icon" style={{ width: 28, height: 28, fontSize: 11 }}>N</span>
                      <span className="label-md">NIVA</span>
                    </div>
                    <p className="body-lg" style={{ whiteSpace: "pre-line" }}>{msg.text}</p>

                    {/* Affordability Result */}
                    {msg.data && (
                      <AffordabilityResult data={msg.data} />
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="card" style={{ opacity: 0.6 }}>
                <div className="flex-gap-sm">
                  <span className="navbar-brand-icon" style={{ width: 28, height: 28, fontSize: 11 }}>N</span>
                  <span className="label-md">NIVA is calculating...</span>
                  <span className="status-dot positive pulse" />
                </div>
              </div>
            )}
          </div>

          {/* What-If Simulator */}
          {affordability && (
            <div className="card animate-fade-in">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <div>
                  <span className="label-sm text-muted">☰ AFFORDABILITY SIMULATION ENGINE</span>
                  <h2 className="headline-sm">Interactive &quot;What-If&quot; Sensitivity Planner</h2>
                </div>
                <span className={`chip ${affordability.buffer_status === "safe" ? "chip-positive" : affordability.buffer_status === "warning" ? "chip-warning" : "chip-critical"}`}>
                  {affordability.buffer_status === "safe" ? "Safe" : affordability.buffer_status === "warning" ? "Caution" : "Critical"} with {affordability.post_purchase_emergency_months}mo Buffer
                </span>
              </div>

              <div className="grid-2" style={{ gap: 32 }}>
                <div>
                  <div className="flex-between body-md" style={{ marginBottom: 8 }}>
                    <span>Purchase Target Amount</span>
                    <span className="title-lg">₹{sliderAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={100000}
                    step={1000}
                    value={sliderAmount}
                    onChange={(e) => setSliderAmount(Number(e.target.value))}
                    onMouseUp={handleSliderChange}
                    onTouchEnd={handleSliderChange}
                    style={{ width: "100%", accentColor: "var(--niva-deep-forest)" }}
                  />
                  <div className="flex-between body-sm text-muted">
                    <span>₹20,000 (Budget)</span>
                    <span>₹1,00,000 (Premium)</span>
                  </div>
                </div>
                <div>
                  <div className="flex-between body-md" style={{ marginBottom: 8 }}>
                    <span>Planned Purchase Delay</span>
                    <span className="title-lg">{sliderDelay} Months</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    value={sliderDelay}
                    onChange={(e) => setSliderDelay(Number(e.target.value))}
                    onMouseUp={handleSliderChange}
                    onTouchEnd={handleSliderChange}
                    style={{ width: "100%", accentColor: "var(--niva-deep-forest)" }}
                  />
                  <div className="flex-between body-sm text-muted">
                    <span>0 mo (Now)</span>
                    <span>2 mo (Recommended)</span>
                    <span>3 mo</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Queries */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              "Can I afford a ₹65,000 laptop?",
              "Why did NIVA suppress the personal loan?",
              "How much did I spend on dining out this month?",
              "Agli salary aane tak kitna kharch kar sakte hain?",
            ].map((q, i) => (
              <button
                key={i}
                className="btn btn-outline btn-sm"
                onClick={() => { setInput(q); }}
              >
                &quot;{q}&quot;
              </button>
            ))}
          </div>

          {/* Input */}
          <div ref={chatEndRef} />
          <div style={{
            position: "sticky",
            bottom: 16,
            background: "var(--niva-canvas)",
            border: "1px solid var(--niva-border)",
            borderRadius: "var(--radius-pill)",
            padding: "8px 8px 8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
          }}>
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "hi" : language === "hi" ? "gu" : "en")}
              className="chip chip-neutral"
              style={{ cursor: "pointer", border: "1px solid var(--niva-border)", fontSize: 11, padding: "4px 10px" }}
              title="Switch language"
            >
              {language === "en" ? "EN" : language === "hi" ? "हिन्दी" : "ગુજરાતી"}
            </button>

            {/* Voice Button */}
            <button
              onClick={startListening}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: isListening ? "var(--niva-critical)" : "var(--niva-canvas-subtle)",
                color: isListening ? "#fff" : "var(--niva-text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "all 0.2s ease",
                animation: isListening ? "pulse 1s infinite" : "none",
              }}
              title="Voice input"
            >
              {isListening ? "●" : "🎙️"}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={language === "hi" ? "Kya main ₹65,000 ka laptop khareed sakta hoon?" : language === "gu" ? "શું હું ₹65,000 નો લેપટોપ ખરીદી શકું?" : "What if I pay ₹30,000 down payment and the rest in 3 months?"}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
                background: "transparent",
              }}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={loading}>
              {language === "hi" ? "गणना करें →" : language === "gu" ? "ગણતરી →" : "Calculate →"}
            </button>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-brand">
          <span className="navbar-brand-icon" style={{ width: 24, height: 24, fontSize: 10 }}>N</span>
          NIVA
        </div>
        <div className="footer-aa-badge">
          <span className="status-dot positive pulse" />
          RBI Account Aggregator Compliant Sandbox
        </div>
      </footer>
    </>
  );
}

function AffordabilityResult({ data }: { data: any }) {
  return (
    <div style={{ marginTop: 16, padding: "var(--space-lg)", background: "var(--niva-canvas-subtle)", borderRadius: "var(--radius-md)" }}>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="metric-tile">
          <span className="metric-label">Current Liquid Savings</span>
          <span className="metric-value">₹{data.current_balance?.toLocaleString("en-IN")}</span>
          <span className="body-sm text-positive">● Verified HDFC + SBI combined</span>
        </div>
        <div className="metric-tile">
          <span className="metric-label">Outright Purchase Deficit</span>
          <span className={`metric-value ${data.shortfall ? "text-critical" : "text-positive"}`}>
            {data.shortfall ? `-₹${data.shortfall.toLocaleString("en-IN")}` : `₹${data.post_purchase_balance?.toLocaleString("en-IN")}`}
          </span>
          <span className="body-sm text-muted">{data.shortfall ? "Immediate shortfall" : "Remaining after purchase"}</span>
        </div>
        <div className="metric-tile">
          <span className="metric-label">Post-Purchase Buffer</span>
          <span className={`metric-value ${data.buffer_status === "safe" ? "text-positive" : data.buffer_status === "warning" ? "text-warning" : "text-critical"}`}>
            {data.post_purchase_emergency_months} <span style={{ fontSize: 14, fontWeight: 400 }}>months</span>
          </span>
          <span className={`body-sm ${data.buffer_status !== "safe" ? "text-critical" : "text-muted"}`}>
            Target baseline safety buffer is {data.target_emergency_months} months
          </span>
        </div>
      </div>

      {data.safer_range_low && (
        <div className="info-banner info">
          <span>💡</span>
          <div>
            <strong>NIVA Optimized Scenario:</strong> {data.recommended_delay_months ? `Delaying ${data.recommended_delay_months} months` : "Consider"} the ₹{data.safer_range_low?.toLocaleString("en-IN")}–₹{data.safer_range_high?.toLocaleString("en-IN")} range for a safe purchase with maintained emergency buffer.
          </div>
        </div>
      )}
    </div>
  );
}
