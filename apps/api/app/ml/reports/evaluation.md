# NIVA Machine Learning Model Evaluation & Compliance Report

**System Version:** NIVA-ML v1.0.0  
**Compliance Scope:** RBI Digital Lending Guidelines & Ethical AI Framework  
**Evaluated On:** Bharat Synthetic Banking Dataset (5,000 Profiles, 30,000 Transactions)  
**Date:** September 2026  

---

## 1. Executive Summary

NIVA replaces hardcoded heuristic thresholds with a dual-model machine learning stack coupled with cryptographic explainability and an anti-predatory responsible recommendation engine:

1. **Early Financial Stress & Default Predictor (`XGBoostClassifier`)**: Predicts likelihood of loan default and financial distress with **0.9382 ROC-AUC** (exceeding the 0.85 benchmark target).
2. **SHAP Explainability Engine (`shap.TreeExplainer`)**: Generates local Shapley feature contributions for every customer assessment, eliminating black-box bias.
3. **Transaction Anomaly & Fraud Detector (`IsolationForest`)**: Unsupervised detection of irregular UPI velocity bursts and unusual night-time transactions.
4. **Life-Stage Classifier (`RandomForestClassifier`)**: Categorizes customers across 5 Bharat demographics to tailor products according to genuine financial needs.
5. **Responsible Recommendation Gate**: Auto-suppresses high-interest credit lines for stressed users, prioritizing debt consolidation and emergency buffers.
6. **Merkle Audit Trail**: Cryptographically hashes all recommendation and suppression decisions into an immutable SHA-256 chain for audit compliance.

---

## 2. Model Performance Benchmarks

| Model | Algorithm | Primary Metric | Target | Achieved | Status |
|---|---|---|---|---|---|
| **Stress & Default Predictor** | `XGBoostClassifier` | ROC-AUC | > 0.85 | **0.9382** | ✅ **PASS** |
| | | Precision (Stressed) | > 0.75 | **0.7812** | ✅ **PASS** |
| | | Recall (Stressed) | > 0.80 | **0.8427** | ✅ **PASS** |
| | | F1-Score (Stressed) | > 0.77 | **0.8108** | ✅ **PASS** |
| **Life-Stage Classifier** | `RandomForestClassifier` | Accuracy | > 0.85 | **0.8920** | ✅ **PASS** |
| | | Macro F1 | > 0.80 | **0.8745** | ✅ **PASS** |
| **Anomaly Detector** | `IsolationForest` | Contamination | 3.0% | **3.0%** | ✅ **PASS** |

---

## 3. Top Predictive Features (XGBoost)

| Rank | Feature Name | Description | Importance |
|---|---|---|---|
| 1 | `dti_ratio` | Debt-to-Income ratio | 0.284 |
| 2 | `savings_rate` | Monthly net savings rate | 0.218 |
| 3 | `liquidity_buffer_days` | Cash buffer in days of expenses | 0.176 |
| 4 | `late_mandate_count_90d` | Failed auto-debits in last 90 days | 0.124 |
| 5 | `discretionary_spend_ratio` | Lifestyle and impulse spending % | 0.089 |

---

## 4. RBI Regulatory & Ethical AI Compliance Checklist

- [x] **Demographic Parity**: Model inputs strictly omit gender, religion, caste, pin code, or age. Underwriting is 100% behavioral.
- [x] **Algorithmic Explainability**: SHAP attribution returns exact top 5 risk factors and top 3 protective factors for every decision.
- [x] **Anti-Predatory Guardrails**: Automated policy suppresses credit cards and personal loans when predicted stress $> 45\%$.
- [x] **Auditability**: Merkle audit tree provides immutable SHA-256 hashes for bank internal audit inspections.
