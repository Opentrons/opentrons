from pathlib import Path


def test_find_smoothie_file(monkeypatch, tmpdir):
    from opentrons import config

    dummy_file = Path(tmpdir) / 'smoothie-edge-2cac98asda.hex'
    dummy_file.write_text("hello")
    monkeypatch.setattr(config, 'ROBOT_FIRMWARE_DIR', Path(tmpdir))

    from opentrons import create_hardware

    monkeypatch.setattr(create_hardware, 'IS_ROBOT', True)
    assert create_hardware._find_smoothie_file() == (dummy_file, 'edge-2cac98asda')
