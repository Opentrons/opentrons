def test_old_probe_height(monkeypatch):
    from opentrons.robot import robot_configs

    monkeypatch.setenv('OT2_PROBE_HEIGHT', '55.0')
    cfg = robot_configs.load()
    monkeypatch.delenv('OT2_PROBE_HEIGHT')

    assert cfg.probe_center[2] == 55.0
    assert cfg.probe_dimensions[2] == 60.0


def test_default_probe_height():
    from opentrons.robot import robot_configs

    cfg = robot_configs.load()
    assert cfg.probe_center[2] == 77.0
    assert cfg.probe_dimensions[2] == 82.0
