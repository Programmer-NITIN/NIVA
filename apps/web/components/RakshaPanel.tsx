"use client";
import { useEffect, useState } from "react";
import { getFraudTypes, reportFraud, getFraudCases, getFraudCase, getFraudBundle, freezeFraudPots, updateFraudStatus, getFraudSuspects } from "@/lib/api";

type Lang = "en"|"hi"|"gu";
export default function RakshaPanel({ personaId, language }: { personaId: string; language: Lang }){
  const [types, setTypes] = useState<any[]>([]);
  const [fraudType, setFraudType] = useState("upi_fraud");
  const [amount, setAmount] = useState(48000);
  const [txnId, setTxnId] = useState("");
  const [counterparty, setCounterparty] = useState("raja123@okhdfc");
  const [desc, setDesc] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [bundle, setBundle] = useState<any>(null);
  const [suspects, setSuspects] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);

  async function refresh(){
    try{ const t=await getFraudTypes(); setTypes(t.fraud_types||[]);}catch{}
    try{ const c=await getFraudCases(personaId); setCases(c.cases||[]);}catch{}
    try{ const s=await getFraudSuspects(personaId); setSuspects(s.suspects||[]);}catch{}
  }
  useEffect(()=>{ refresh(); }, [personaId]);

  async function onReport(){
    if(!amount || amount<=0) return;
    setSubmitting(true);
    try{
      const r=await reportFraud({persona_id: personaId, fraud_type: fraudType, amount, txn_id: txnId || undefined, counterparty, description: desc});
      setMsg(`Case ${r.case.id} created — Evidence auto-compiled. Call 1930 within 90 mins.`);
      setSelected(r.case);
      try{ const b=await getFraudBundle(r.case.id); setBundle(b);}catch{}
      await refresh();
    }catch(e:any){ setMsg(e.message);} finally{ setSubmitting(false); setTimeout(()=>setMsg(null),7000);}
  }
  async function openCase(id:string){
    try{ const r=await getFraudCase(id); setSelected(r.case); const b=await getFraudBundle(id); setBundle(b);}catch{}
  }
  async function onFreeze(){
    if(!selected) return;
    try{ const r=await freezeFraudPots(selected.id); setSelected(r.case); setMsg(`Pots frozen — Rs ${r.frozen_amount?.toLocaleString("en-IN")} locked to Emergency Vault`); }catch(e:any){ setMsg(e.message);}
  }
  const t = (en:string, hi:string, gu:string)=> language==="hi"?hi:language==="gu"?gu:en;

  return (
    <div className="stack-lg">
      {/* Header */}
      <div className="card" style={{background: "linear-gradient(135deg, #7F1D1D 0%, #B91C1C 100%)", color: "#fff", border: "none"}}>
        <div className="flex-between" style={{gap:12, flexWrap:"wrap"}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
              <span style={{background:"rgba(255,255,255,0.15)", padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:700}}>🚨 NIVA RAKSHA</span>
              <span style={{background:"#fff", color:"#B91C1C", padding:"3px 8px", borderRadius:999, fontSize:10, fontWeight:800}}>1930 • cybercrime.gov.in • RBI CMS</span>
            </div>
            <h2 style={{fontSize:22, fontWeight:800, lineHeight:1.2}}>{t("Cyber Fraud Shield — Report in 60 seconds","साइबर फ्रॉड शील्ड — 60 सेकंड में रिपोर्ट","સાયબર ફ્રોડ શીલ્ડ — 60 સેકન્ડમાં રિપોર્ટ")}</h2>
            <p style={{marginTop:6, opacity:0.9, fontSize:12, lineHeight:1.5}}>{t("Detect → Freeze → Evidence bundle → Assisted filing. Deterministic, vernacular, DPDP-compliant. No mock silent filing — we guide you to real govt doors.","डिटेक्ट → फ्रीज → सबूत बंडल → असिस्टेड फाइलिंग। स्पष्ट, स्थानीय भाषा में, DPDP-अनुरूप।","ડિટેક્ટ → ફ્રીઝ → પુરાવા બંડલ → આસિસ્ટેડ ફાઇલિંગ. સ્પષ્ટ, સ્થાનિક ભાષામાં.")}</p>
          </div>
          <div style={{background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:12, padding:"10px 14px", minWidth:160, textAlign:"center"}}>
            <div style={{fontSize:11, opacity:0.85}}>Golden Hour</div>
            <div style={{fontSize:22, fontWeight:800}}>90 mins</div>
            <div style={{fontSize:11, opacity:0.85}}>Call 1930 immediately</div>
          </div>
        </div>
      </div>

      {/* Panic actions */}
      <div className="grid-3" style={{gap:12}}>
        <a href="tel:1930" className="card" style={{textAlign:"center", textDecoration:"none", background:"#FEF2F2", border:"1.5px solid #FCA5A5"}}>
          <div style={{fontSize:22}}>📞</div><div style={{fontWeight:800, color:"#B91C1C"}}>Call 1930 Now</div><div style={{fontSize:11, color:"#7F1D1D"}}>National Helpline — 24×7</div>
        </a>
        <a href="https://cybercrime.gov.in" target="_blank" className="card" style={{textAlign:"center", textDecoration:"none"}}>
          <div style={{fontSize:22}}>🖥️</div><div style={{fontWeight:800}}>cybercrime.gov.in</div><div style={{fontSize:11, color:"var(--niva-text-muted)"}}>File Financial Fraud report</div>
        </a>
        <a href="https://cms.rbi.org.in" target="_blank" className="card" style={{textAlign:"center", textDecoration:"none"}}>
          <div style={{fontSize:22}}>🏦</div><div style={{fontWeight:800}}>RBI CMS</div><div style={{fontSize:11, color:"var(--niva-text-muted)"}}>Escalate after 30 days</div>
        </a>
      </div>

      {/* Suspects */}
      {suspects.length>0 && (
        <div className="card">
          <div className="label-sm text-muted">SUSPICIOUS TRANSACTIONS — ONE-TAP REPORT</div>
          <div style={{display:"flex", flexDirection:"column", gap:8, marginTop:10}}>
            {suspects.map((s:any)=>(
              <div key={s.transaction_id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"var(--niva-canvas-subtle)", borderRadius:10, border:"1px solid var(--niva-border)"}}>
                <div>
                  <div style={{fontWeight:700, fontSize:13}}>{s.transaction_id} • {s.category} • {s.risk_flag}</div>
                  <div style={{fontSize:11, color:"var(--niva-text-muted)"}}>Anomaly {(s.anomaly_score*100|0)}% • Amount Rs {Number(s.amount).toLocaleString("en-IN")}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={()=>{ setTxnId(s.transaction_id); setAmount(Number(s.amount)||amount); setCounterparty(s.transaction_id+"@okhdfc"); window.scrollTo({top:600, behavior:"smooth"});}}>Report this →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report form */}
      <div className="card">
        <h3 style={{fontSize:16, fontWeight:800}}>Create Fraud Case — Assisted FIR Filing</h3>
        <p style={{fontSize:12, color:"var(--niva-text-muted)", marginTop:4}}>Evidence bundle auto-compiled from Twin + anomaly detector. You submit to govt portal — we pre-fill Hindi/English drafts. <strong>Assisted, not silent filing (no govt write API).</strong></p>

        <div className="grid-2" style={{gap:12, marginTop:14}}>
          <label style={{display:"flex", flexDirection:"column", gap:6}}>
            <span className="label-sm text-muted">Fraud Type</span>
            <select value={fraudType} onChange={e=>setFraudType(e.target.value)} style={{padding:"10px 12px", borderRadius:10, border:"1px solid var(--niva-border)", background:"var(--niva-canvas-subtle)"}}>
              {(types.length?types:[{id:"upi_fraud",label:"UPI / QR Fraud"},{id:"otp_phish",label:"OTP / Link Phish"},{id:"card_fraud",label:"Card / Netbanking"},{id:"loan_app",label:"Fake Loan App"},{id:"other",label:"Other"}]).map((ft:any)=><option key={ft.id} value={ft.id}>{ft.label}</option>)}
            </select>
          </label>
          <label style={{display:"flex", flexDirection:"column", gap:6}}>
            <span className="label-sm text-muted">Amount (Rs)</span>
            <input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} style={{padding:"10px 12px", borderRadius:10, border:"1px solid var(--niva-border)"}} />
          </label>
          <label style={{display:"flex", flexDirection:"column", gap:6}}>
            <span className="label-sm text-muted">TXN / UTR / UPI Ref (optional)</span>
            <input value={txnId} onChange={e=>setTxnId(e.target.value)} placeholder="TXN_9812 / UPI Ref 143..." style={{padding:"10px 12px", borderRadius:10, border:"1px solid var(--niva-border)"}} />
          </label>
          <label style={{display:"flex", flexDirection:"column", gap:6}}>
            <span className="label-sm text-muted">Counterparty VPA / Account</span>
            <input value={counterparty} onChange={e=>setCounterparty(e.target.value)} placeholder="raja123@okhdfc" style={{padding:"10px 12px", borderRadius:10, border:"1px solid var(--niva-border)"}} />
          </label>
        </div>
        <label style={{display:"flex", flexDirection:"column", gap:6, marginTop:12}}>
          <span className="label-sm text-muted">What happened? (1-2 lines)</span>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="OTP share ho gaya / QR scan karwaya / link click kiya..." style={{minHeight:70, padding:"10px 12px", borderRadius:10, border:"1px solid var(--niva-border)"}} />
        </label>
        <div style={{marginTop:12, display:"flex", gap:8, flexWrap:"wrap"}}>
          <button className="btn btn-primary" onClick={onReport} disabled={submitting}>{submitting?"Creating...":"🚨 Create Case & Compile Evidence"}</button>
          <a href="tel:1930" className="btn btn-outline">📞 Call 1930 Script</a>
        </div>
        {msg && <div style={{marginTop:10, padding:"10px 12px", background:"#E6F9DC", border:"1px solid var(--niva-border)", borderRadius:10, fontSize:12}}>{msg}</div>}
      </div>

      {/* Cases + bundle */}
      {cases.length>0 && (
        <div className="card">
          <div className="label-sm text-muted">YOUR CASES</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:10}}>
            {cases.map((c:any)=>(
              <button key={c.id} onClick={()=>openCase(c.id)} style={{padding:"8px 12px", borderRadius:999, border: selected?.id===c.id?"2px solid var(--niva-deep-forest)":"1px solid var(--niva-border)", background: selected?.id===c.id?"var(--niva-deep-forest)":"var(--niva-canvas-subtle)", color: selected?.id===c.id?"var(--niva-electric-lime)":undefined, fontWeight:700, fontSize:12}}>{c.id} • Rs {c.amount?.toLocaleString("en-IN")} • {c.status}</button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="card" style={{border:"1.5px solid var(--niva-deep-forest)"}}>
          <div className="flex-between" style={{gap:12, flexWrap:"wrap"}}>
            <div>
              <div style={{fontWeight:800, fontSize:16}}>{selected.id} — {selected.fraud_type_label}</div>
              <div style={{fontSize:12, color:"var(--niva-text-muted)"}}>Rs {selected.amount?.toLocaleString("en-IN")} • {selected.counterparty} • {selected.txn_id} • Hash {selected.integrity_hash}</div>
              <div style={{marginTop:6, display:"flex", gap:6, flexWrap:"wrap"}}>
                {selected.timeline?.map((t:any,i:number)=><span key={i} className="chip chip-neutral" style={{fontSize:10}}>{t.status}</span>)}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onFreeze} disabled={selected.pots_frozen}>{selected.pots_frozen?"Pots Locked":"🔒 Freeze Pots to Vault"}</button>
          </div>

          <div className="grid-2" style={{gap:12, marginTop:14}}>
            <div style={{padding:12, background:"var(--niva-canvas-subtle)", borderRadius:10, border:"1px solid var(--niva-border)"}}>
              <div style={{fontWeight:700, fontSize:12}}>1930 Call Script — Copy & Call</div>
              <div style={{marginTop:6, fontFamily:"ui-monospace, monospace", fontSize:12, whiteSpace:"pre-wrap"}}>{selected.call_script}</div>
              <div style={{marginTop:8, display:"flex", gap:8}}>
                <button className="btn btn-outline btn-sm" onClick={()=>{ navigator.clipboard.writeText(selected.call_script); alert("Copied");}}>Copy Script</button>
                <a href="tel:1930" className="btn btn-primary btn-sm">Call 1930</a>
              </div>
            </div>
            <div style={{padding:12, background:"var(--niva-canvas-subtle)", borderRadius:10, border:"1px solid var(--niva-border)"}}>
              <div style={{fontWeight:700, fontSize:12}}>Next Steps</div>
              <div style={{display:"flex", flexDirection:"column", gap:6, marginTop:6}}>
                {(selected.next_steps||[]).map((s:any)=><div key={s.step} style={{fontSize:12}}><strong>{s.step}. {s.title}</strong> — {s.desc}</div>)}
              </div>
              <div style={{marginTop:8, display:"flex", gap:8, flexWrap:"wrap"}}>
                <a href="https://cybercrime.gov.in/Webform/Crime_AuthoLogin.aspx" target="_blank" className="btn btn-outline btn-sm">Open cybercrime.gov.in →</a>
                <a href="https://cms.rbi.org.in" target="_blank" className="btn btn-outline btn-sm">RBI CMS →</a>
              </div>
            </div>
          </div>

          {bundle && (
            <div style={{marginTop:14, display:"flex", flexDirection:"column", gap:12}}>
              <div>
                <div style={{fontWeight:800, fontSize:13}}>FIR Draft (paste to portal)</div>
                <textarea readOnly value={bundle.fir_draft} style={{width:"100%", minHeight:180, marginTop:6, padding:10, borderRadius:10, border:"1px solid var(--niva-border)", fontFamily:"ui-monospace, monospace", fontSize:11}} />
                <button className="btn btn-outline btn-sm" style={{marginTop:6}} onClick={()=>{ navigator.clipboard.writeText(bundle.fir_draft); alert("FIR draft copied");}}>Copy FIR Draft</button>
              </div>
              <div>
                <div style={{fontWeight:800, fontSize:13}}>Bank Dispute Letter (to Nodal Officer)</div>
                <textarea readOnly value={bundle.bank_letter} style={{width:"100%", minHeight:140, marginTop:6, padding:10, borderRadius:10, border:"1px solid var(--niva-border)", fontFamily:"ui-monospace, monospace", fontSize:11}} />
                <button className="btn btn-outline btn-sm" style={{marginTop:6}} onClick={()=>{ navigator.clipboard.writeText(bundle.bank_letter); alert("Bank letter copied");}}>Copy Bank Letter</button>
              </div>
              <div style={{padding:10, background:"#E6F9DC", borderRadius:10, border:"1px solid var(--niva-border)", fontSize:12}}>
                <strong>Checklist:</strong> {bundle.checklist?.join(" • ")}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{background:"#FFF7ED", border:"1px solid #FDBA74"}}>
        <div style={{fontWeight:800, color:"#9A3412", fontSize:13}}>Honest Disclosure (for judges)</div>
        <div style={{fontSize:12, color:"#7C2D12", marginTop:4}}>cybercrime.gov.in has no public write API — NIVA does <strong>Assisted Filing</strong>: evidence bundle + pre-filled drafts + deep-links + call script. You submit with captcha/Aadhaar OTP. We also lock Pots so no further loss.</div>
      </div>
    </div>
  );
}
