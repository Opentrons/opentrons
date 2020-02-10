from pathlib import Path


def test_find_smoothie_file(monkeypatch, tmpdir):
    from opentrons import config

    dummy_file = Path(tmpdir) / 'smoothie-edge-2cac98asda.hex'
    dummy_file.write_text("hello")
    monkeypatch.setattr(config, 'ROBOT_FIRMWARE_DIR', Path(tmpdir))

    from opentrons import main

    monkeypatch.setattr(main, 'IS_ROBOT', True)
    assert main._find_smoothie_file() == (dummy_file, 'edge-2cac98asda')
