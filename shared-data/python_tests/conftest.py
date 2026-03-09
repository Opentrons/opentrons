"""Fixtures and helpers for python tests."""

import pytest
from typing import Any, Dict


@pytest.fixture
def sample_transfer_properties_dict() -> Dict[str, Dict[str, Any]]:
    """A dictionary representation of transfer properties of a liquid class."""
    return {
        "flex_1channel_50": {
            "opentrons/opentrons_flex_96_tiprack_50ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 1, "y": 2, "z": 3},
                        "position_reference": "well-bottom",
                    },
                    "correction_by_volume": [(0.0, 0.0)],
                    "delay": {"enable": False},
                    "flow_rate_by_volume": [(10.0, 40.0), (20.0, 30.0)],
                    "mix": {"enable": False},
                    "pre_wet": True,
                    "retract": {
                        "air_gap_by_volume": [(5.0, 3.0), (10.0, 4.0)],
                        "delay": {"enable": False},
                        "end_position": {
                            "offset": {"x": 1, "y": 2, "z": 3},
                            "position_reference": "well-bottom",
                        },
                        "speed": 40,
                        "touch_tip": {"enable": False},
                    },
                    "submerge": {
                        "delay": {"enable": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 1, "y": 2, "z": 3},
                            "position_reference": "well-bottom",
                        },
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 1, "y": 2, "z": 3},
                        "position_reference": "well-bottom",
                    },
                    "correction_by_volume": [(0.0, 0.0)],
                    "delay": {"enable": False},
                    "flow_rate_by_volume": [(10.0, 40.0), (20.0, 30.0)],
                    "mix": {"enable": False},
                    "push_out_by_volume": [(10.0, 7.0), (20.0, 10.0)],
                    "retract": {
                        "air_gap_by_volume": [(5.0, 3.0), (10.0, 4.0)],
                        "blowout": {"enable": False},
                        "delay": {"enable": False},
                        "end_position": {
                            "offset": {"x": 1, "y": 2, "z": 3},
                            "position_reference": "well-bottom",
                        },
                        "speed": 40,
                        "touch_tip": {"enable": False},
                    },
                    "submerge": {
                        "delay": {"enable": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 1, "y": 2, "z": 3},
                            "position_reference": "well-bottom",
                        },
                    },
                },
                "multi_dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 318)],
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 50,
                        "touch_tip": {"enabled": False},
                        "blowout": {
                            "enabled": True,
                            "location": "trash",
                            "flow_rate": 478,
                        },
                    },
                    "conditioning_by_volume": [(0, 0)],
                    "disposal_by_volume": [(0, 5)],
                },
            }
        }
    }
