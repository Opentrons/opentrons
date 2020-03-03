from opentrons.hardware_control import modules


async def test_sim_initialization(loop):
    mag = await modules.build('', 'magdeck', True,
                              lambda x: None, loop=loop)
    assert isinstance(mag, modules.AbstractModule)


async def test_sim_data(loop):
    mag = await modules.build('', 'magdeck', True,
                              lambda x: None, loop=loop)
    assert mag.status == 'disengaged'
    assert mag.device_info['serial'] == 'dummySerialMD'
    assert mag.device_info['model'] == 'dummyModelMD'
    assert mag.device_info['version'] == 'dummyVersionMD'
    assert mag.live_data['status'] == mag.status
    assert 'data' in mag.live_data


async def test_sim_state_update(loop):
    mag = await modules.build('', 'magdeck', True,
                              lambda x: None, loop=loop)
    mag.calibrate()
    assert mag.status == 'disengaged'
    mag.engage(2)
    assert mag.status == 'engaged'
    mag.deactivate()
    assert mag.status == 'disengaged'
