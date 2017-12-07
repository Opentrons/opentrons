import pytest


@pytest.fixture
def config(monkeypatch, tmpdir):
    from collections import namedtuple
    from opentrons.robot import robot_configs
    from opentrons.util import environment

    monkeypatch.setenv('APP_DATA_DIR', str(tmpdir))
    environment.refresh()

    test_config = namedtuple('test_config', 'key1, key2')

    monkeypatch.setattr(
        robot_configs,
        'robot_config',
        test_config
    )

    monkeypatch.setattr(
        robot_configs,
        'default',
        test_config(key1='value1', key2='value2')
    )

    return robot_configs


def test_config(config, tmpdir):
    filename = str(tmpdir.join('config.json'))

    settings = config.load()
    settings = settings._replace(key1='new-value1')
    assert config.save(settings) == {'key1': 'new-value1'}
    with open(filename) as file:
        assert ''.join(file) == \
            '{\n    "key1": "new-value1"\n}'

    settings = settings._replace(key2='new-value2')
    assert config.save(settings) == {
        'key1': 'new-value1',
        'key2': 'new-value2'
    }
    with open(filename) as file:
        assert ''.join(file) == \
            '{\n    "key1": "new-value1",\n    "key2": "new-value2"\n}'
