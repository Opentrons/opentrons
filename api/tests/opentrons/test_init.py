from pathlib import Path


def test_find_smoothie_file(monkeypatch, tmpdir):
    import opentrons

    dummy_file = Path(tmpdir) / 'smoothie-edge-2cac98asda.hex'
    dummy_file.write_text("hello")
    monkeypatch.setattr(opentrons, 'ROBOT_FIRMWARE_DIR', Path(tmpdir))

    monkeypatch.setattr(opentrons, 'IS_ROBOT', True)
    assert opentrons._find_smoothie_file() == (dummy_file, 'edge-2cac98asda')
