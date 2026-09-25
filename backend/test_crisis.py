import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_engine import ml_engine_singleton

def test_crisis_and_prescriptions():
    print("================================================================")
    print("STARTING TASK 3.3 CRISIS NLP & PRESCRIPTIVE INTERVENTION TESTS")
    print("================================================================")

    engine = ml_engine_singleton

    print("\n--- 1. Testing Mini-task 3.3.1: Multi-lingual Crisis NLP Scanner ---")
    # Case 1: Normal operational journal
    normal_text = "Completed 8 hours guard duty on post 4. Looking forward to breakfast."
    flag_normal, msg_normal = engine.screen_crisis_nlp(normal_text)
    assert not flag_normal, "Normal text falsely flagged as crisis!"
    print("PASS: Normal operational notes correctly classified as non-crisis.")

    # Case 2: English acute distress
    english_crisis = "I cannot take it anymore, feeling hopeless and want to end my life."
    flag_en, msg_en = engine.screen_crisis_nlp(english_crisis)
    assert flag_en, "English crisis keyword missed!"
    print(f"PASS: English crisis detected: '{msg_en}'")

    # Case 3: Hindi / Hinglish acute distress
    hindi_crisis = "मेरी हिम्मत टूट गयी है, अब जीने का कोई मतलब नहीं बचा, बस मरना चाहता हूँ।"
    flag_hi, msg_hi = engine.screen_crisis_nlp(hindi_crisis)
    assert flag_hi, "Hindi crisis keyword missed!"
    print(f"PASS: Hindi crisis detected: '{msg_hi}'")

    print("\n--- 2. Testing Mini-task 3.3.2: Score Escalation on Crisis Trigger ---")
    # Baseline mild stress soldier profile
    mild_profile = {
        "deployment_type": "Static Security",
        "days_in_zone": 25,
        "consecutive_night_duties": 1,
        "leave_cancellations": 0,
        "months_since_leave": 1.0,
        "mood_score": 3.0,
        "sleep_hours": 6.5,
        "physical_exhaustion": 2.0,
        "phq4_score": 1.0,
        "hrv_rmssd": 52.0,
        "resting_hr": 70.0,
        "voluntary_text": "I feel hopeless and want to end my life tonight."
    }
    crisis_result = engine.predict_stress(mild_profile)
    print(f"Escalated Stress Score: {crisis_result['stress_score']}/100")
    print(f"Escalated Risk Tier: {crisis_result['risk_level']}")
    assert crisis_result["crisis_flag"] == True
    assert crisis_result["stress_score"] >= 88.0
    assert crisis_result["risk_level"] == "Critical"
    print("PASS: Crisis text automatically elevated score to Critical tier (≥88.0).")

    print("\n--- 3. Testing Mini-task 3.3.3: Prescriptive Recommendation Synthesizer ---")
    # Test 3a: Crisis recommendation
    assert "Tele-MANAS" in crisis_result["recommended_intervention"]
    assert crisis_result["recommended_priority"] == "Urgent - Critical"
    print("PASS: Immediate Emergency Tele-MANAS & Medical Officer dispatched for crisis.")

    # Test 3b: Leave cancellation prescription
    leave_profile = {
        "deployment_type": "High-Altitude Border",
        "days_in_zone": 95,
        "consecutive_night_duties": 3,
        "leave_cancellations": 3,
        "months_since_leave": 7.0,
        "mood_score": 2.5,
        "sleep_hours": 6.0,
        "physical_exhaustion": 3.0,
        "phq4_score": 3.0,
        "hrv_rmssd": 42.0,
        "resting_hr": 75.0,
        "voluntary_text": "Missing family after cancelled leave."
    }
    leave_result = engine.predict_stress(leave_profile)
    print("Leave Denial Recommendation:\n ", leave_result["recommended_intervention"])
    assert "Mandatory R&R" in leave_result["recommended_intervention"]
    print("PASS: Mandatory R&R Leave correctly prescribed for leave denials.")

    # Test 3c: High night duties circadian shift swap
    night_profile = {
        "deployment_type": "Static Security",
        "days_in_zone": 40,
        "consecutive_night_duties": 10,
        "leave_cancellations": 0,
        "months_since_leave": 2.0,
        "mood_score": 3.0,
        "sleep_hours": 5.0,
        "physical_exhaustion": 3.5,
        "phq4_score": 2.0,
        "hrv_rmssd": 45.0,
        "resting_hr": 74.0,
        "voluntary_text": "Fatigued from continuous night perimeter watch."
    }
    night_result = engine.predict_stress(night_profile)
    print("Night Shift Volatility Recommendation:\n ", night_result["recommended_intervention"])
    assert "Circadian Workload Rebalancing" in night_result["recommended_intervention"]
    print("PASS: Circadian day shift swap correctly prescribed for continuous night shifts.")

    print("\n================================================================")
    print("ALL TASK 3.3 CRISIS NLP & PRESCRIPTIONS TESTS PASSED 100%!")
    print("================================================================")

if __name__ == "__main__":
    test_crisis_and_prescriptions()
