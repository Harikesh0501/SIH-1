import sys
import os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml_engine import ml_engine_singleton

def test_xai_attribution_suite():
    print("==================================================")
    print("STARTING TASK 3.2 EXPLAINABLE AI (XAI) TEST SUITE")
    print("==================================================")

    engine = ml_engine_singleton
    assert engine.is_trained, "Engine not trained!"

    # Test Subject: Ct. Ramesh Kumar (High operational stress, nights, leave cancellations)
    sample_soldier = {
        "deployment_type": "High-Altitude Border",
        "days_in_zone": 128,
        "consecutive_night_duties": 14,
        "leave_cancellations": 3,
        "months_since_leave": 8.5,
        "mood_score": 1.5,
        "sleep_hours": 4.2,
        "physical_exhaustion": 4.8,
        "phq4_score": 8.5,
        "hrv_rmssd": 22.4,
        "resting_hr": 88.0
    }

    result = engine.predict_stress(sample_soldier)

    print("\n--- 1. Testing Prediction Metrics ---")
    print(f"Stress Score: {result['stress_score']}/100")
    print(f"Risk Tier: {result['risk_level']}")
    assert result["risk_level"] in ["Critical", "Vulnerable"]
    print("PASS: High stress correctly classified.")

    print("\n--- 2. Testing Task 3.2.1: XAI Factor Decomposition ---")
    factors = result["explainable_factors"]
    assert len(factors) == 5, f"Expected 5 XAI factors, got {len(factors)}"
    
    total_pct = sum(f["impact_pct"] for f in factors)
    print(f"Total Factor Percentage Sum: {total_pct:.1f}%")
    assert 95.0 <= total_pct <= 105.0, f"Percentage sum unexpected: {total_pct}"

    # Verify factors are sorted descending by impact
    for i in range(len(factors) - 1):
        assert factors[i]["impact_pct"] >= factors[i+1]["impact_pct"], "Factors not sorted descending!"

    print("Ranked XAI Stress Drivers:")
    for idx, f in enumerate(factors, 1):
        print(f"  {idx}. [{f['category']}] {f['feature']} -> {f['impact_pct']}%")
        print(f"     Description: {f['description']}")
    print("PASS: XAI Factor Attribution successfully verified.")

    print("\n--- 3. Testing Task 3.2.2: English Clinical Narrative ---")
    en_narrative = result["narrative_summary"]
    print("English Narrative:\n", en_narrative)
    assert len(en_narrative) > 30
    assert "Overall Stress Risk is evaluated at" in en_narrative
    print("PASS: English narrative generated.")

    print("\n--- 4. Testing Task 3.2.3: Hindi (हिंदी) Clinical Narrative ---")
    hi_narrative = result["narrative_summary_hi"]
    print("Hindi Narrative:\n", hi_narrative)
    assert len(hi_narrative) > 30
    assert "कुल तनाव जोखिम" in hi_narrative
    print("PASS: Hindi narrative generated.")

    print("\n=======================================================")
    print("ALL TASK 3.2 EXPLAINABLE AI (XAI) TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_xai_attribution_suite()
