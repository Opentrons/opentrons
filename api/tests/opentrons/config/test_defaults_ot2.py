from opentrons.config.types import CurrentDict
from opentrons.config import defaults_ot2


def test_load_currents() -> None:
    legacy = {"X": 2.0, "Y": 0.5, "Z": 0.2, "A": 0.1, "B": 0.5, "C": 0.7}
    default: CurrentDict = {
        "default": {"X": 0.1, "Y": 0.3, "Z": 0.1, "A": 0.2, "B": 0.1, "C": 0.2},
        "B": {"X": 0.2, "Y": 0.1, "Z": 0.5, "A": 0.6, "B": 0.7, "C": 0.8},
        "2.1": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 7},
    }
    default_different_vals = {
        "default": {"X": 1, "Y": 2, "Z": 3, "A": 4, "B": 5, "C": 6},
        "2.1": {"X": 0, "Y": 1, "Z": 2, "A": 3, "B": 4, "C": 5},
    }
    from_legacy = {"default": default["default"], "B": default["B"], "2.1": legacy}
    assert defaults_ot2._build_hw_versioned_current_dict(legacy, default) == from_legacy
    assert (
        defaults_ot2._build_hw_versioned_current_dict(default_different_vals, default)
        == default_different_vals
    )
    assert defaults_ot2._build_hw_versioned_current_dict(None, default) == default
