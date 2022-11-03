ot3_dummy_settings = {
    "name": "Marie Curie",
    "model": "OT-3 Standard",
    "version": 1,
    "motion_settings": {
        "acceleration": {
            "none": {
                "X": 3,
                "Y": 2,
                "Z": 15,
                "P": 2,
                "Z_G": 5,
            },
            "low_throughput": {
                "X": 3,
                "Y": 2,
                "Z": 15,
                "P": 15,
            },
            "high_throughput": {
                "X": 3,
                "Y": 2,
                "Z": 15,
                "P": 15,
            },
            "two_low_throughput": {"X": 1.1, "Y": 2.2},
            "gripper": {
                "Z": 2.8,
                "Z_G": 6,
            },
        },
        "default_max_speed": {
            "none": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 4,
                "Z_G": 5,
            },
            "low_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 4,
            },
            "high_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 4,
            },
            "two_low_throughput": {
                "X": 4,
                "Y": 3,
                "Z": 2,
                "P": 1,
            },
            "gripper": {"Z": 2.8, "Z_G": 5},
        },
        "max_speed_discontinuity": {
            "none": {
                "X": 10,
                "Y": 20,
                "Z": 30,
                "P": 40,
                "Z_G": 50,
            },
            "low_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 6,
            },
            "high_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 6,
            },
            "two_low_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 6,
            },
            "gripper": {"Z": 2.8},
        },
        "direction_change_speed_discontinuity": {
            "none": {
                "X": 5,
                "Y": 10,
                "Z": 15,
                "P": 20,
                "Z_G": 15,
            },
            "low_throughput": {
                "X": 0.8,
                "Y": 1,
                "Z": 2,
                "P": 4,
            },
            "high_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 6,
            },
            "two_low_throughput": {
                "X": 0.5,
                "Y": 1,
                "Z": 1.5,
                "P": 3,
            },
            "gripper": {"Z": 2.8},
        },
    },
    "current_settings": {
        "hold_current": {
            "none": {
                "X": 0.7,
                "Y": 0.7,
                "Z": 0.7,
                "P": 0.8,
                "Z_G": 0.5,
            },
            "low_throughput": {
                "X": 0.7,
                "Y": 0.7,
                "Z": 0.7,
                "P": 0.8,
            },
            "high_throughput": {
                "X": 0.7,
                "Y": 0.7,
                "Z": 0.7,
                "P": 0.8,
            },
            "two_low_throughput": {"X": 0.7, "Y": 0.7, "Z": 0.6},
            "gripper": {
                "Z": 0.7,
            },
        },
        "run_current": {
            "none": {
                "X": 7.0,
                "Y": 7.0,
                "Z": 7.0,
                "P": 5.0,
                "Z_G": 5.0,
            },
            "low_throughput": {
                "X": 1,
                "Y": 2,
                "Z": 3,
                "P": 4.0,
            },
            "high_throughput": {
                "X": 0.2,
                "Y": 0.5,
                "Z": 0.4,
                "P": 2.0,
            },
            "two_low_throughput": {"X": 9, "Y": 0.1, "Z": 0.6},
            "gripper": {
                "Z": 10,
            },
        },
    },
    "log_level": "NADA",
    "z_retract_distance": 10,
    "deck_transform": [[-0.5, 0, 1], [0.1, -2, 4], [0, 0, -1]],
    "carriage_offset": (1, 2, 3),
    "right_mount_offset": (3, 2, 1),
    "left_mount_offset": (2, 2, 2),
    "gripper_mount_offset": (1, 1, 1),
    "calibration": {
        "z_offset": {
            "point": [1, 2, 3],
            "pass_settings": {
                "prep_distance_mm": 1,
                "max_overrun_distance_mm": 2,
                "speed_mm_per_s": 3,
                "sensor_threshold_pf": 4,
            },
        },
        "edge_sense": {
            "plus_x_pos": [4, 5, 6],
            "plus_y_pos": [7, 8, 9],
            "minus_x_pos": [10, 11, 12],
            "minus_y_pos": [13, 14, 15],
            "overrun_tolerance_mm": 16,
            "early_sense_tolerance_mm": 17,
            "pass_settings": {
                "prep_distance_mm": 4,
                "max_overrun_distance_mm": 5,
                "speed_mm_per_s": 6,
                "sensor_threshold_pf": 7,
            },
            "search_initial_tolerance_mm": 18,
            "search_iteration_limit": 3,
        },
        "probe_length": 40
    },
}
