from pathlib import Path

import pytest


def test_find_smoothie_file(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    import opentrons

    dummy_file = tmp_path / "smoothie-edge-2cac98asda.hex"
    dummy_file.write_text("hello")
    monkeypatch.setattr(opentrons, "ROBOT_FIRMWARE_DIR", tmp_path)

    monkeypatch.setattr(opentrons, "IS_ROBOT", True)
    assert opentrons._find_smoothie_file() == (dummy_file, "edge-2cac98asda")
