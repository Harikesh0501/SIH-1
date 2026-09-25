import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_engine import ml_engine_singleton, MilitaryStressPredictiveEngine

def test_ml_pipeline_suite():
    print("==================================================")
    print("STARTING TASK 3.1 SUPERVISED ML MODEL TEST SUITE")
    print("==================================================")

    engine = ml_engine_singleton
    assert engine.is_trained, "ML Model pipeline failed to train!"
    print(f"PASS: Model is trained. Holdout R2 Metric: {engine.r2_metric:.4f}")
    assert engine.r2_metric > 0.85, f"R2 Metric too low: {engine.r2_metric}"
    print(f"PASS: Validation RMSE: {engine.rmse_metric:.2f} points on 0-100 scale.")

    print("\n--- Testing Prediction on Flagship Profiles ---")
    # Profile 1: Acute Stress Profile (120 days, high night duty, 3 leave cancellations, low sleep, low HRV)
    acute_profile = {
        "deployment_type": "High-Intensity CI",
        "days_in_zone": 130,
        "consecutive_night_duties": 14,
        "leave_cancellations": 3,
        "months_since_leave": 8.0,
        "mood_score": 1.5,
        "sleep_hours": 4.0,
        "physical_exhaustion": 4.8,
        "phq4_score": 9.0,
        "hrv_rmssd": 21.0,
        "resting_hr": 89.0
    }
    score_acute, tier_acute = engine.predict_raw_score(acute_profile)
    print(f"Acute Profile Result: Score={score_acute}/100, Tier={tier_acute}")
    assert tier_acute in ["Critical", "Vulnerable"], f"Expected Critical/Vulnerable, got {tier_acute}"
    print("PASS: Acute profile correctly classified as High Risk.")

    # Profile 2: Resilient Profile (Peace station, 20 days, 0 night duty, 0 cancellations, good sleep, high HRV)
    peace_profile = {
        "deployment_type": "Peace Station",
        "days_in_zone": 20,
        "consecutive_night_duties": 0,
        "leave_cancellations": 0,
        "months_since_leave": 1.0,
        "mood_score": 4.5,
        "sleep_hours": 7.5,
        "physical_exhaustion": 1.5,
        "phq4_score": 1.0,
        "hrv_rmssd": 62.0,
        "resting_hr": 64.0
    }
    score_peace, tier_peace = engine.predict_raw_score(peace_profile)
    print(f"Peace Profile Result: Score={score_peace}/100, Tier={tier_peace}")
    assert tier_peace == "Resilient", f"Expected Resilient, got {tier_peace}"
    assert score_peace < 40.0, f"Expected < 40, got {score_peace}"
    print("PASS: Resilient profile correctly classified as Resilient (< 40.0).")

    print("\n--- Testing Security Sanitization & Tampering Defense ---")
    # Adversarial test: Extreme out-of-bounds numbers (e.g. sleep=999 hours, HR=-50)
    adversarial_profile = {
        "deployment_type": "UNKNOWN_INJECTION",
        "days_in_zone": -100,  # Negative days
        "consecutive_night_duties": 500,  # Unrealistically high
        "leave_cancellations": 99,
        "months_since_leave": 999,
        "mood_score": -10,
        "sleep_hours": 100,
        "physical_exhaustion": 999,
        "phq4_score": 999,
        "hrv_rmssd": -50,
        "resting_hr": 9999
    }
    score_adv, tier_adv = engine.predict_raw_score(adversarial_profile)
    print(f"Adversarial Input Handled Safely: Score={score_adv}/100, Tier={tier_adv}")
    assert 5.0 <= score_adv <= 99.0, f"Score out of physical bounds: {score_adv}"
    print("PASS: Security defense prevented crash and clamped within bounded limits.")

    print("\n=======================================================")
    print("ALL TASK 3.1 SUPERVISED ML MODEL TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_ml_pipeline_suite()
