"""
NIVA — Real-Time Terminal Logger & Telemetry Engine.

Outputs rich, formatted, high-visibility operational logs to the backend terminal
whenever any Machine Learning model, statutory policy gate, cryptographic ledger,
or financial ingestion event executes.
100% Windows Console / CP1252 / UTF-8 compatible (safe characters).
"""

import sys
import time
from datetime import datetime
from typing import Any, Dict, Optional

# Attempt UTF-8 reconfiguration on Windows console if available
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ANSI Color Codes for terminal visibility
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def log_ml_model_run(
    model_name: str,
    task: str,
    inputs: Dict[str, Any],
    outputs: Dict[str, Any],
    duration_ms: Optional[float] = None,
    persona_id: Optional[str] = None,
):
    """
    Real-time terminal log for any ML model inference
    (XGBoost, Isolation Forest, Random Forest, SHAP Explainer, etc.).
    """
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    dur_str = f" | Elapsed: {duration_ms:.2f}ms" if duration_ms is not None else ""
    persona_str = f" | Persona: {persona_id}" if persona_id else ""

    lines = [
        f"\n{CYAN}{BOLD}================================================================================{RESET}",
        f"{CYAN}{BOLD}  [NIVA ML INFERENCE] {model_name.upper()}{RESET}",
        f"{CYAN}  Task      : {task}{persona_str}{dur_str}{RESET}",
        f"{CYAN}  Timestamp : {ts} IST{RESET}",
        f"{CYAN}--------------------------------------------------------------------------------{RESET}",
    ]

    # Input summary
    if inputs:
        lines.append(f"{CYAN}  {BOLD}Input Features / Behavioral Metrics:{RESET}")
        for k, v in list(inputs.items())[:6]:
            v_fmt = f"{v:.4f}" if isinstance(v, float) else str(v)
            lines.append(f"{CYAN}    * {k:<28}: {v_fmt}{RESET}")
        if len(inputs) > 6:
            lines.append(f"{CYAN}    ... and {len(inputs) - 6} more features{RESET}")

    # Output summary
    if outputs:
        lines.append(f"{CYAN}--------------------------------------------------------------------------------{RESET}")
        lines.append(f"{CYAN}  {BOLD}Model Inference Output & Verdict:{RESET}")
        for k, v in outputs.items():
            if isinstance(v, float):
                v_fmt = f"{v:.4f}"
            elif isinstance(v, list):
                v_fmt = f"[{len(v)} items: {', '.join(str(x) for x in v[:3])}]"
            else:
                v_fmt = str(v)
            lines.append(f"{CYAN}    -> {k:<26}: {GREEN}{BOLD}{v_fmt}{RESET}")

    lines.append(f"{CYAN}{BOLD}================================================================================{RESET}\n")
    try:
        print("\n".join(lines), flush=True)
    except Exception:
        pass


def log_gate_policy_eval(
    policy_id: str,
    policy_name: str,
    product_name: str,
    decision: str,
    rationale: str,
    metrics: Dict[str, Any],
    persona_id: str,
):
    """
    Real-time terminal log for the Statutory Policy Engine & Responsible Gate.
    """
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    color = GREEN if decision.upper() == "RECOMMEND" else (RED if decision.upper() == "SUPPRESS" else YELLOW)
    tag = "[PERMITTED]" if decision.upper() == "RECOMMEND" else "[BLOCKED]"

    lines = [
        f"\n{color}{BOLD}================================================================================{RESET}",
        f"{color}{BOLD}  {tag} [RESPONSIBLE GATE POLICY] {policy_id}: {policy_name}{RESET}",
        f"{color}  Product   : {product_name} | Customer: {persona_id} | Time: {ts}{RESET}",
        f"{color}--------------------------------------------------------------------------------{RESET}",
        f"{color}  Decision  : {BOLD}{decision.upper()}{RESET} ({rationale})",
    ]

    if metrics:
        lines.append(f"{color}  Telemetry : " + " | ".join(f"{k}={v}" for k, v in metrics.items()))

    lines.append(f"{color}{BOLD}================================================================================{RESET}\n")
    try:
        print("\n".join(lines), flush=True)
    except Exception:
        pass


def log_merkle_audit_block(
    block_index: int,
    block_hash: str,
    persona_id: str,
    product: str,
    action: str,
    policy_rule: str,
):
    """
    Real-time terminal log when an immutable SHA-256 Merkle block is recorded.
    """
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    short_hash = block_hash[:16] + "..." if len(block_hash) > 16 else block_hash

    lines = [
        f"\n{BLUE}{BOLD}################################################################################{RESET}",
        f"{BLUE}{BOLD}  [MERKLE AUDIT LEDGER] Block #{block_index} Created & Cryptographically Hashed{RESET}",
        f"{BLUE}  Customer  : {persona_id:<16} | Product: {product:<20}{RESET}",
        f"{BLUE}  Action    : {action:<16} | Policy : {policy_rule:<20}{RESET}",
        f"{BLUE}  SHA-256   : {short_hash:<28} | Time   : {ts:<14}{RESET}",
        f"{BLUE}{BOLD}################################################################################{RESET}\n",
    ]
    try:
        print("\n".join(lines), flush=True)
    except Exception:
        pass


def log_affordability_event(
    persona_id: str,
    target_amount: float,
    verdict: str,
    reasoning: str,
    current_balance: float,
    post_emergency_months: float,
):
    """
    Real-time terminal log for the Deterministic Affordability Engine.
    """
    color = GREEN if verdict == "YES" else (YELLOW if verdict == "CONDITIONALLY" else RED)
    lines = [
        f"\n{color}{BOLD}================================================================================{RESET}",
        f"{color}{BOLD}  [AFFORDABILITY ENGINE] Purchase Assessment for {persona_id}{RESET}",
        f"{color}--------------------------------------------------------------------------------{RESET}",
        f"{color}  Target Purchase : INR {target_amount:,.2f}{RESET}",
        f"{color}  Verdict         : {BOLD}{verdict}{RESET}",
        f"{color}  Current Balance : INR {current_balance:,.2f} | Post Buffer: {post_emergency_months:.1f} Months{RESET}",
        f"{color}  Financial Reason: {reasoning}{RESET}",
        f"{color}{BOLD}================================================================================{RESET}\n",
    ]
    try:
        print("\n".join(lines), flush=True)
    except Exception:
        pass
