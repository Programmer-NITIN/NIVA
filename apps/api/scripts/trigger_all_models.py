"""
Trigger all ML models and system events to verify real-time terminal output.
"""

import os
import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_statements")

time.sleep(2)  # Allow uvicorn to initialize

print(">>> [TEST] 1. Triggering Financial Twin & XGBoost Stress Prediction + SHAP...")
r1 = requests.get(f"{BASE_URL}/twin/rajesh_sharma")
print("Twin Status:", r1.status_code)

print("\n>>> [TEST] 2. Triggering Random Forest Demographic Life-Stage Classifier...")
r2 = requests.get(f"{BASE_URL}/ml/life-stage/rajesh_sharma")
print("Life-Stage Status:", r2.status_code)

print("\n>>> [TEST] 3. Triggering Isolation Forest Anomaly Detection...")
r3 = requests.get(f"{BASE_URL}/ml/anomalies/rajesh_sharma")
print("Anomalies Status:", r3.status_code)

print("\n>>> [TEST] 4. Triggering Responsible Product Recommender & Statutory Gate Evaluation...")
r4 = requests.get(f"{BASE_URL}/recommendations/rajesh_sharma")
print("Recommendations Status:", r4.status_code)

print("\n>>> [TEST] 5. Triggering Deterministic Affordability Engine...")
r5 = requests.post(f"{BASE_URL}/twin/rajesh_sharma/affordability", json={"target_amount": 35000, "delay_months": 0})
print("Affordability Status:", r5.status_code)

print("\n>>> [TEST] 6. Triggering SMS Gateway Real-Time OTP...")
r6 = requests.post(f"{BASE_URL}/journey/send-otp", json={"phone": "+91 98765 43210", "persona_id": "rajesh_sharma"})
print("OTP Status:", r6.status_code)

print("\n>>> [TEST] 7. Triggering Bank Statement PDF Ingestion Engine...")
pdf_file = os.path.join(DATA_DIR, "sbi_rajesh_sharma_statement.pdf")
with open(pdf_file, "rb") as f:
    r7 = requests.post(
        f"{BASE_URL}/journey/upload-statement",
        files={"file": ("sbi_rajesh_sharma_statement.pdf", f, "application/pdf")},
        data={"persona_id": "rajesh_sharma", "full_name": "Rajesh Kumar Sharma", "phone": "+91 98765 43210"}
    )
print("Upload Status:", r7.status_code)

print("\nAll models and events triggered successfully!")
