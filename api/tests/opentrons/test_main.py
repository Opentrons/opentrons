from pathlib import Path
from opentrons import main


def test_find_smoothie_file(monkeypatch, tmpdir):
    monkeypatch.setattr(main, 'IS_ROBOT', True)
    tdpath = Path(tmpdir)
    dummy_file = tdpath / 'smoothie-edge-2cac98asda.hex'
    dummy_file.write_text("hello")
    monkeypatch.setattr(main, 'ROBOT_FIRMWARE_DIR', tdpath)

    assert main._find_smoothie_file() == (dummy_file, 'edge-2cac98asda')
