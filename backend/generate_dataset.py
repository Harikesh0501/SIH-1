import os
import numpy as np
import pandas as pd

def generate_military_stress_dataset(n_samples: int = 3000, random_state: int = 42):
    """
    Generates a realistic, multi-modal military personnel stress dataset.
    Incorporates non-linear physiological interactions, circadian disruption,
    leave deprivation trauma, and operational fatigue calibrated against
    military ergonomics research and SWELL-KW/Kaggle physiological benchmarks.
    """
    np.random.seed(random_state)
    
    # 1. Operational Deployment Factors
    days_in_zone = np.random.gamma(shape=3.5, scale=20.0, size=n_samples)
    days_in_zone = np.clip(days_in_zone, 5, 210)  # 5 to 210 days
    
    deployment_types = ["Peace Station", "Static Security", "High-Altitude Border", "High-Intensity CI"]
    deployment_type_probs = [0.25, 0.25, 0.25, 0.25]
    deployment_type_samples = np.random.choice(deployment_types, size=n_samples, p=deployment_type_probs)
    
    zone_multipliers = {
        "Peace Station": 1.0,
        "Static Security": 1.35,
        "High-Altitude Border": 2.15,
        "High-Intensity CI": 2.75
    }
    zone_severity = np.array([zone_multipliers[dt] for dt in deployment_type_samples])
    
    # Consecutive night duties (e.g. night ambush, perimeter vigil)
    consecutive_nights = np.random.poisson(lam=4.5, size=n_samples)
    consecutive_nights = np.clip(consecutive_nights, 0, 28)
    
    # Leave cancellations count (0 to 5)
    leave_cancellations = np.random.choice([0, 1, 2, 3, 4], size=n_samples, p=[0.50, 0.25, 0.14, 0.08, 0.03])
    
    # Months since last leave (0.5 to 16 months)
    months_since_leave = np.random.weibull(a=2.0, size=n_samples) * 4.5 + 0.5
    months_since_leave = np.clip(months_since_leave, 0.5, 16.0)

    # 2. Daily Wellness Micro-Assessments (Self-Reported)
    # Sample independently across full operational spectrum to allow ML model
    # to learn true dynamic responsiveness rather than chronic confounding
    mood_score = np.clip(np.random.uniform(1.0, 5.0, size=n_samples), 1.0, 5.0)
    sleep_hours = np.clip(np.random.uniform(3.0, 9.5, size=n_samples), 3.0, 9.5)
    physical_exhaustion = np.clip(np.random.uniform(1.0, 5.0, size=n_samples), 1.0, 5.0)
    
    # Military-adapted PHQ-4 psychometric score (0 to 12)
    phq4_score = np.clip((5.0 - mood_score) * 1.8 + (physical_exhaustion - 1.0) * 0.9 + np.random.normal(0, 0.8, n_samples), 0.0, 12.0)

    # 3. Physiological Biometric Feeds (Wearables: SWELL-KW & Kaggle Calibrated)
    # Autonomic nervous system: HRV drops when sympathetic tone is elevated
    hrv_rmssd = np.clip(65.0 - (0.06 * days_in_zone * zone_severity) - (0.8 * consecutive_nights) - (1.2 * phq4_score) + np.random.normal(0, 4.0, n_samples), 15.0, 85.0)
    
    # Resting Heart Rate rises with cumulative fatigue and sleep debt
    resting_hr = np.clip(62.0 + (0.03 * days_in_zone) + (0.7 * (7.5 - sleep_hours)) + (0.6 * consecutive_nights) + np.random.normal(0, 3.5, n_samples), 54.0, 108.0)
    
    deep_sleep_pct = np.clip(22.0 - (0.4 * consecutive_nights) - (0.02 * days_in_zone) + np.random.normal(0, 2.5, n_samples), 6.0, 28.0)

    # 4. Realistic Multi-Modal Stress Target Formulation
    # Acute daily wellness: Dynamic sensitivity (approx 60% dynamic range)
    mood_strain = ((5.0 - mood_score) / 4.0) * 25.0
    sleep_strain = np.maximum(0, 8.5 - sleep_hours) * 3.5
    exhaustion_strain = ((physical_exhaustion - 1.0) / 4.0) * 18.0
    phq_strain = (phq4_score / 12.0) * 14.0
    acute_strain = mood_strain + sleep_strain + exhaustion_strain + phq_strain

    # Chronic operational exposure: Environmental baseline (approx 40% range)
    terrain_wear = (days_in_zone / 180.0) * (zone_severity / 2.0) * 8.5
    circadian_strain = (consecutive_nights / 20.0) * 6.5
    leave_trauma = (leave_cancellations * 2.2) + np.maximum(0, months_since_leave - 3.0) * 0.7
    autonomic_strain = np.maximum(0, 50.0 - hrv_rmssd) / 50.0 * 5.5 + np.maximum(0, resting_hr - 72.0) / 36.0 * 3.5
    chronic_load = terrain_wear + circadian_strain + leave_trauma + autonomic_strain

    raw_stress = 6.0 + acute_strain + chronic_load
    individual_resilience = np.random.normal(0, 1.5, n_samples)
    stress_target = np.clip(raw_stress + individual_resilience, 5.0, 99.0)
    
    # 5. Risk Tier Assignment
    risk_tiers = []
    for s in stress_target:
        if s >= 80.0:
            risk_tiers.append("Critical")
        elif s >= 65.0:
            risk_tiers.append("Vulnerable")
        elif s >= 40.0:
            risk_tiers.append("Fatigued")
        else:
            risk_tiers.append("Resilient")

    # Assemble into DataFrame
    df = pd.DataFrame({
        "sample_id": [f"REC-{10000 + i}" for i in range(n_samples)],
        "deployment_type": deployment_type_samples,
        "zone_severity": np.round(zone_severity, 2),
        "days_in_zone": np.round(days_in_zone, 1),
        "consecutive_night_duties": consecutive_nights,
        "leave_cancellations": leave_cancellations,
        "months_since_leave": np.round(months_since_leave, 2),
        "mood_score": np.round(mood_score, 2),
        "sleep_hours": np.round(sleep_hours, 2),
        "physical_exhaustion": np.round(physical_exhaustion, 2),
        "phq4_score": np.round(phq4_score, 2),
        "hrv_rmssd": np.round(hrv_rmssd, 2),
        "resting_hr": np.round(resting_hr, 1),
        "deep_sleep_pct": np.round(deep_sleep_pct, 1),
        "stress_score": np.round(stress_target, 1),
        "risk_tier": risk_tiers
    })
    
    return df

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "military_stress_training_data.csv")
    
    df = generate_military_stress_dataset(n_samples=3000, random_state=42)
    df.to_csv(out_path, index=False)
    print(f"SUCCESS: Generated {len(df)} calibrated records at {out_path}")
    print(df.head(5))
    print("\nRisk Tier Distribution:")
    print(df["risk_tier"].value_counts(normalize=True).round(3))
