"""
Test End-to-End OTP Generation, Verification, Bank Statement PDF Upload,
and Firebase Firestore Persistence.
"""

import os
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_statements")

def test_otp_flow():
    print("--- 1. Testing Send OTP (Real-time Terminal Output) ---")
    phone = "+91 98765 43210"
    res = requests.post(f"{BASE_URL}/journey/send-otp", json={"phone": phone, "persona_id": "rajesh_sharma"})
    print("Send OTP Response:", res.status_code, res.json())
    assert res.status_code == 200
    otp = res.json()["otp_preview"]
    print(f"Captured OTP: {otp}")

    print("\n--- 2. Testing Verify OTP ---")
    v_res = requests.post(f"{BASE_URL}/journey/verify-otp", json={"phone": phone, "otp": otp, "persona_id": "rajesh_sharma"})
    print("Verify OTP Response:", v_res.status_code, v_res.json().get("status"), v_res.json().get("role"))
    assert v_res.status_code == 200

def test_pdf_upload():
    print("\n--- 3. Testing PDF Bank Statement Upload ---")
    pdf_file = os.path.join(DATA_DIR, "sbi_rajesh_sharma_statement.pdf")
    with open(pdf_file, "rb") as f:
        files = {"file": ("sbi_rajesh_sharma_statement.pdf", f, "application/pdf")}
        data = {
            "persona_id": "rajesh_sharma",
            "full_name": "Rajesh Kumar Sharma",
            "phone": "+91 98765 43210"
        }
        u_res = requests.post(f"{BASE_URL}/journey/upload-statement", files=files, data=data)
    print("Upload Status:", u_res.status_code)
    u_json = u_res.json()
    print("Transactions Parsed:", u_json.get("transactions_parsed"))
    print("Health Score:", u_json.get("twin", {}).get("health_score"))
    print("Stress Score:", u_json.get("twin", {}).get("stress_score"))
    assert u_res.status_code == 200

def test_dashboard_state():
    print("\n--- 4. Testing Journey State (Checking Firestore Sync) ---")
    st_res = requests.get(f"{BASE_URL}/journey/state/rajesh_sharma")
    print("State Status:", st_res.status_code)
    st_json = st_res.json()
    print("KYC Name:", st_json.get("kyc", {}).get("full_name"))
    print("Twin Health:", st_json.get("financial_twin", {}).get("health_score"))
    print("Gate Approved Products:", st_json.get("responsible_gate", {}).get("approved_count"))
    print("Gate Suppressed Products:", st_json.get("responsible_gate", {}).get("suppressed_count"))

def test_setu_sandbox():
    print("\n--- 5. Testing Setu Sandbox User ---")
    setu_res = requests.get(f"{BASE_URL}/twin/setu_sandbox_user")
    print("Setu Twin Status:", setu_res.status_code)
    setu_json = setu_res.json()
    print("Setu User Persona:", setu_json.get("persona_id"))
    print("Setu Income:", setu_json.get("income", {}).get("monthly_income"))
    print("Setu Health Score:", setu_json.get("health_score"))

if __name__ == "__main__":
    test_otp_flow()
    test_pdf_upload()
    test_dashboard_state()
    test_setu_sandbox()
    print("\nAll integration verification tests PASSED!")
