def test_old_probe_height(short_trash_flag):
    from opentrons.legacy_api.robot import robot_configs

    cfg = robot_configs.load()

    assert cfg.probe_center[2] == 55.0
    assert cfg.probe_dimensions[2] == 60.0


def test_default_probe_height():
    from opentrons.legacy_api.robot import robot_configs

    cfg = robot_configs.load()
    assert cfg.probe_center[2] == 77.0
    assert cfg.probe_dimensions[2] == 82.0


def test_load_corrupt_json():
    import os
    from opentrons.legacy_api.robot import robot_configs
    filename = os.path.join(os.path.dirname(__file__), 'bad_config.json')
    with open(filename, 'w') as file:
        file.write('')  # empty config file
    c = robot_configs.load(filename)
    assert c.version == 2
    os.remove(filename)


def test_build_config():
    from opentrons.legacy_api.robot import robot_configs

    deck_cal = [
        [1.23, 1.23, 1.23,  1.23],
        [1.23, 1.23, 1.23,  1.23],
        [1.23, 1.23, 1.23,  1.23],
        [1.23, 1.23, 1.23,  1.23]
    ]
    robot_settings = {
        'name': 'Andy',
        'version': 42,
        'steps_per_mm': 'steps_rulz',
        'acceleration': 'acceleration_rulz',
        'probe_center': [1, 2, 3],
        'probe_dimensions': [4, 5, 6],
        'instrument_offset': {
            'left': {
                'single': [1, 2, 3],
                'multi': [4, 5, 6]
            },
            'right': {
                'single': [7, 8, 9],
                'multi': [10, 11, 12]
            }
        },
        'tip_length': 999,
        'mount_offset': [-3, -2, -1],
        'serial_speed': 888,
        'default_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
        'low_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
        'high_current': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
        'default_max_speed': {'X': 1, 'Y': 2, 'Z': 3, 'A': 4, 'B': 5, 'C': 6},
        'log_level': 'NADA'
    }

    built_config = robot_configs._build_config(deck_cal, robot_settings)

    assert built_config.gantry_calibration == deck_cal
    for key in robot_settings.keys():
        assert getattr(built_config, key) == robot_settings[key]

    robot_settings['instrument_offset'].update({'right': {}})

    built_config = robot_configs._build_config(deck_cal, robot_settings)
    expected = {
            'left': {
                'single': [1, 2, 3],
                'multi': [4, 5, 6]
            },
            'right': {
                'single': [0, 0, 0],
                'multi': [0, 0, 0]
            }
        }
    assert built_config.instrument_offset == expected
