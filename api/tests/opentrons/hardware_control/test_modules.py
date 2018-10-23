import pytest
import opentrons.hardware_control as hardware_control


async def test_get_modules_simulating():
    mods = ['tempdeck', 'magdeck']
    api = hardware_control.API.build_hardware_simulator(attached_modules=mods)
    from_api = await api.discover_modules()
    assert sorted([mod.name() for mod in from_api]) == sorted(mods)


async def test_module_caching():
    mod_names = ['tempdeck']
    api = hardware_control.API.build_hardware_simulator(
        attached_modules=mod_names)

    # Check that we can add and remove modules and the caching keeps up
    found_mods = await api.discover_modules()
    assert found_mods[0].name() == 'tempdeck'
    new_mods = await api.discover_modules()
    assert new_mods[0] is found_mods[0]
    api._backend._attached_modules.append(('mod2', 'magdeck'))
    with_magdeck = await api.discover_modules()
    assert len(with_magdeck) == 2
    assert with_magdeck[0] is found_mods[0]
    api._backend._attached_modules = api._backend._attached_modules[1:]
    only_magdeck = await api.discover_modules()
    assert only_magdeck[0] is with_magdeck[1]

    # Check that two modules of the same kind on different ports are
    # distinct
    api._backend._attached_modules.append(('mod3', 'magdeck'))
    two_magdecks = await api.discover_modules()
    assert len(two_magdecks) == 2
    assert two_magdecks[0] is with_magdeck[1]
    assert two_magdecks[1] is not two_magdecks[0]


async def test_module_update_logic(monkeypatch):
    mod_names = ['tempdeck']
    api = hardware_control.API.build_hardware_simulator(
        attached_modules=mod_names)
    mods = await api.discover_modules()
    old = mods[0]

    async def new_update_module(mod, ff, loop=None):
        return hardware_control.modules.build('weird-port', mod.name(), True)

    monkeypatch.setattr(api._backend, 'update_module', new_update_module)
    ok, msg = await api.update_module(mods[0], 'some_file')

    mods = await api.discover_modules()
    assert len(mods) == 1

    assert mods[0] is not old


@pytest.mark.skipif(not hardware_control.Controller,
                    reason='hardware controller not available')
async def test_module_update_integration(monkeypatch, loop,
                                         cntrlr_mock_connect, running_on_pi):
    api = hardware_control.API.build_hardware_controller(loop=loop)

    def mock_get_modules():
        return [('port1', 'tempdeck')]

    monkeypatch.setattr(api._backend, 'get_attached_modules', mock_get_modules)

    def mock_build_module(port, model):
        return hardware_control.modules.build(port, model, True)

    monkeypatch.setattr(api._backend, 'build_module', mock_build_module)

    async def mock_discover_ports():
        return ['port1']

    monkeypatch.setattr(hardware_control.modules.update,
                        '_discover_ports', mock_discover_ports)

    async def mock_update(port, fname, loop):
        return (port, (True, 'it all worked'))

    monkeypatch.setattr(hardware_control.modules.update,
                        'update_firmware', mock_update)

    modules = await api.discover_modules()
    ok, msg = await api.update_module(modules[0], 'some-fake-file', loop)
    assert ok
    new_modules = await api.discover_modules()
    assert new_modules[0] is not modules[0]
