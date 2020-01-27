from pathlib import Path
from opentrons import main, config


def test_find_smoothie_file(monkeypatch, robot_firmware_tempdir):
    monkeypatch.setattr(main, 'IS_ROBOT', True)

    assert main._find_smoothie_file() == (dummy_file, 'edge-2cac98asda')
