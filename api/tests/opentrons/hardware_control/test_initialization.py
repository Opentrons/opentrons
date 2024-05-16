from pathlib import Path

import pytest

from opentrons.hardware_control import initialization


def test_find_smoothie_file(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    dummy_file = tmp_path / "smoothie-edge-2cac98asda.hex"
    dummy_file.write_text("hello")
    monkeypatch.setattr(initialization, "ROBOT_FIRMWARE_DIR", tmp_path)

    monkeypatch.setattr(initialization, "IS_ROBOT", True)
    assert initialization._find_smoothie_file() == (dummy_file, "edge-2cac98asda")
