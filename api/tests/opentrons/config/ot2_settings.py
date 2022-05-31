legacy_dummy_settings = {
    "name": "Rosalind Franklin",
    "version": 42,
    "steps_per_mm": "M92 X80.00 Y80.00 Z400 A400 B768 C768",
    "gantry_steps_per_mm": {"X": 80.00, "Y": 80.00, "Z": 400, "A": 400},
    "acceleration": {"X": 3, "Y": 2, "Z": 15, "A": 15, "B": 2, "C": 2},
    "z_retract_distance": 2,
    "tip_length": 999,
    "left_mount_offset": [-34, 0, 0],
    "serial_speed": 888,
    "default_current": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "low_current": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "high_current": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_max_speed": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_pipette_configs": {
        "homePosition": 220,
        "maxTravel": 30,
        "stepsPerMM": 768,
    },
    "log_level": "NADA",
}


migrated_dummy_settings = {
    "name": "Rosalind Franklin",
    "version": 4,
    "gantry_steps_per_mm": {"X": 80.0, "Y": 80.0, "Z": 400.0, "A": 400.0},
    "acceleration": {"X": 3, "Y": 2, "Z": 15, "A": 15, "B": 2, "C": 2},
    "z_retract_distance": 2,
    "left_mount_offset": [-34, 0, 0],
    "serial_speed": 888,
    "default_current": {
        "default": {"X": 1.25, "Y": 1.25, "Z": 0.5, "A": 0.5, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "low_current": {
        "default": {"X": 0.7, "Y": 0.7, "Z": 0.1, "A": 0.1, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "high_current": {
        "default": {"X": 1.25, "Y": 1.25, "Z": 0.5, "A": 0.5, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "default_max_speed": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_pipette_configs": {
        "homePosition": 220,
        "maxTravel": 30,
        "stepsPerMM": 768,
    },
    "log_level": "NADA",
}


new_dummy_settings = {
    "name": "Marie Curie",
    "version": 4,
    "gantry_steps_per_mm": {"X": 80.0, "Y": 80.0, "Z": 400.0, "A": 400.0},
    "acceleration": {"X": 3, "Y": 2, "Z": 15, "A": 15, "B": 2, "C": 2},
    "z_retract_distance": 2,
    "left_mount_offset": [-34, 0, 0],
    "serial_speed": 888,
    "default_current": {
        "default": {"X": 1.25, "Y": 1.25, "Z": 0.8, "A": 0.8, "B": 0.05, "C": 0.05},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "low_current": {
        "default": {"X": 0.7, "Y": 0.7, "Z": 0.7, "A": 0.7, "B": 0.7, "C": 0.7},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "high_current": {
        "default": {"X": 0.7, "Y": 0.7, "Z": 0.7, "A": 0.7, "B": 0.7, "C": 0.7},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    },
    "default_max_speed": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
    "default_pipette_configs": {
        "homePosition": 220,
        "maxTravel": 30,
        "stepsPerMM": 768,
    },
    "log_level": "NADA",
}
