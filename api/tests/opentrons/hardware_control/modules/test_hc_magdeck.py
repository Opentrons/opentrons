from opentrons.hardware_control import modules, ExecutionManager


async def test_sim_initialization(loop):
    mag = await modules.build(port='/dev/ot_module_sim_magdeck0',
                              which='magdeck',
                              simulating=True,
                              interrupt_callback=lambda x: None,
                              loop=loop,
                              execution_manager=ExecutionManager(loop=loop))
    assert isinstance(mag, modules.AbstractModule)


async def test_sim_data(loop):
    mag = await modules.build(port='/dev/ot_module_sim_magdeck0',
                              which='magdeck',
                              simulating=True,
                              interrupt_callback=lambda x: None,
                              loop=loop,
                              execution_manager=ExecutionManager(loop=loop))
    assert mag.status == 'disengaged'
    assert mag.device_info['serial'] == 'dummySerialMD'
    assert mag.device_info['model'] == 'dummyModelMD'
    assert mag.device_info['version'] == 'dummyVersionMD'
    assert mag.live_data['status'] == mag.status
    assert 'data' in mag.live_data


async def test_sim_state_update(loop):
    mag = await modules.build(port='/dev/ot_module_sim_magdeck0',
                              which='magdeck',
                              simulating=True,
                              interrupt_callback=lambda x: None,
                              loop=loop,
                              execution_manager=ExecutionManager(loop=loop))
    await mag.calibrate()
    assert mag.status == 'disengaged'
    await mag.engage(2)
    assert mag.status == 'engaged'
    await mag.deactivate()
    assert mag.status == 'disengaged'
