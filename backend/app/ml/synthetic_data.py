import numpy as np
import pandas as pd

def generate_motor_dataset(n_samples: int = 10000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a reproducible, physics-informed synthetic telemetry dataset for an industrial AC induction motor.
    
    Operating regimes modeled:
    - Class 0: 'Normal' (70% probability)
    - Class 1: 'Elevated Risk' (20% probability) - incipient thermal rise or mild unbalance
    - Class 2: 'Critical Condition' (10% probability) - severe overheating, high bearing vibration, or combined fault
    """
    np.random.seed(random_seed)

    # Sample class distributions
    regimes = np.random.choice([0, 1, 2], size=n_samples, p=[0.70, 0.20, 0.10])

    temperatures = []
    humidities = []
    vibration_proxies = []
    rpms = []
    loads = []
    labels = []

    for reg in regimes:
        hum = np.random.normal(45.0, 5.0)
        hum = np.clip(hum, 20.0, 80.0)

        if reg == 0:
            # Nominal operating baseline
            load = np.random.uniform(40.0, 75.0)
            temp = 48.0 + (load * 0.12) + np.random.normal(0, 1.8)
            vib = np.random.uniform(0.12, 0.38) + np.random.normal(0, 0.03)
            # Slip proportional to torque load
            slip = 14.0 + (load * 0.18) + (vib * 15.0)
            rpm = 1500.0 - slip + np.random.normal(0, 2.5)
            label = "Normal"

        elif reg == 1:
            # Elevated Maintenance Risk (Incipient thermal or mechanical friction)
            fault_type = np.random.choice(["thermal_warning", "vib_warning"])
            if fault_type == "thermal_warning":
                load = np.random.uniform(60.0, 85.0)
                temp = np.random.uniform(66.0, 76.0) + np.random.normal(0, 1.5)
                vib = np.random.uniform(0.35, 0.52)
            else:
                load = np.random.uniform(50.0, 80.0)
                temp = np.random.uniform(55.0, 68.0)
                vib = np.random.uniform(0.50, 0.72)

            slip = 22.0 + (load * 0.25) + (vib * 40.0)
            rpm = 1500.0 - slip + np.random.normal(0, 5.0)
            label = "Elevated Risk"

        else:
            # Critical Condition (Severe overheating, bearing seizure risk, or rotor lock)
            fault_type = np.random.choice(["overheat_critical", "vibration_critical", "combined"])
            load = np.random.uniform(75.0, 100.0)

            if fault_type == "overheat_critical":
                temp = np.random.uniform(80.0, 96.0) + np.random.normal(0, 2.0)
                vib = np.random.uniform(0.40, 0.65)
            elif fault_type == "vibration_critical":
                temp = np.random.uniform(60.0, 75.0)
                vib = np.random.uniform(0.76, 1.25) + np.random.normal(0, 0.05)
            else:
                temp = np.random.uniform(82.0, 98.0)
                vib = np.random.uniform(0.78, 1.30)

            slip = 45.0 + (load * 0.45) + (vib * 80.0)
            rpm = 1500.0 - slip + np.random.normal(0, 8.0)
            label = "Critical Condition"

        temperatures.append(round(float(temp), 1))
        humidities.append(round(float(hum), 1))
        vibration_proxies.append(round(float(np.clip(vib, 0.05, 1.5)), 2))
        rpms.append(int(round(np.clip(rpm, 1100, 1495))))
        loads.append(int(round(np.clip(load, 30, 100))))
        labels.append(label)

    df = pd.DataFrame({
        "temperature_c": temperatures,
        "humidity_percent": humidities,
        "vibration_proxy": vibration_proxies,
        "rpm": rpms,
        "load_percent": loads,
        "maintenance_risk": labels,
    })

    return df

if __name__ == "__main__":
    df = generate_motor_dataset(5000)
    print("Synthetic dataset sample:")
    print(df.head())
    print("\nClass distribution:")
    print(df["maintenance_risk"].value_counts(normalize=True))
