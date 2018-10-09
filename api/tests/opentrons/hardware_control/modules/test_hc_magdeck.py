from opentrons.hardware_control import modules


def test_sim_initialization():
    mag = modules.build('', 'magdeck', True)
    assert isinstance(mag, modules.AbstractModule)


def test_sim_data():
    mag = modules.build('', 'magdeck', True)
    assert mag.status == 'disengaged'
    assert mag.device_info['serial'] == 'dummySerial'
    assert mag.device_info['model'] == 'dummyModel'
    assert mag.device_info['version'] == 'dummyVersion'
    assert mag.live_data['status'] == mag.status
    assert 'data' in mag.live_data


def test_sim_state_update():
    mag = modules.build('', 'magdeck', True)
    mag.calibrate()
    assert mag.status == 'disengaged'
    mag.engage(2)
    assert mag.status == 'engaged'
    mag.disengage()
    assert mag.status == 'disengaged'
