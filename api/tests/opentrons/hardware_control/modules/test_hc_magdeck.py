from opentrons.hardware_control import modules


async def test_sim_initialization():
    mag = await modules.build('', 'magdeck', True, lambda x: None)
    assert isinstance(mag, modules.AbstractModule)


async def test_sim_data():
    mag = await modules.build('', 'magdeck', True, lambda x: None)
    assert mag.status == 'disengaged'
    assert mag.device_info['serial'] == 'dummySerialMD'
    assert mag.device_info['model'] == 'dummyModelMD'
    assert mag.device_info['version'] == 'dummyVersionMD'
    assert mag.live_data['status'] == mag.status
    assert 'data' in mag.live_data


async def test_sim_state_update():
    mag = await modules.build('', 'magdeck', True, lambda x: None)
    mag.calibrate()
    assert mag.status == 'disengaged'
    mag.engage(2)
    assert mag.status == 'engaged'
    mag.deactivate()
    assert mag.status == 'disengaged'
