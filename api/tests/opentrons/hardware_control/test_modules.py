import pytest
import asyncio
try:
    import aionotify
except OSError:
    aionotify = None  # type: ignore
import opentrons.hardware_control as hardware_control
from opentrons.hardware_control.modules import ModuleAtPort


async def test_get_modules_simulating():
    mods = ['tempdeck', 'magdeck', 'thermocycler']
    api = hardware_control.API.build_hardware_simulator(attached_modules=mods)
    await asyncio.sleep(0.05)
    from_api = api.attached_modules
    assert sorted([mod.name() for mod in from_api]) == sorted(mods)


async def test_module_caching():
    mod_names = ['tempdeck']
    api = hardware_control.API.build_hardware_simulator(
        attached_modules=mod_names)
    await asyncio.sleep(0.05)

    # Check that we can add and remove modules and the caching keeps up
    found_mods = api.attached_modules
    assert found_mods[0].name() == 'tempdeck'
    await api.register_modules(
        new_modules=[ModuleAtPort(port='/dev/ot_module_sim_tempdeck1',
                                  name='magdeck')
                     ])
    with_magdeck = api.attached_modules
    assert len(with_magdeck) == 2
    assert with_magdeck[0] is found_mods[0]
    await api.register_modules(
        removed_modules=[ModuleAtPort(port='/dev/ot_module_sim_tempdeck0',
                                      name='tempdeck')
                         ])
    only_magdeck = api.attached_modules
    assert only_magdeck[0] is with_magdeck[1]

    # Check that two modules of the same kind on different ports are
    # distinct
    await api.register_modules(
        new_modules=[ModuleAtPort(port='/dev/ot_module_sim_magdeck2',
                                  name='magdeck')
                     ])
    two_magdecks = api.attached_modules
    assert len(two_magdecks) == 2
    assert two_magdecks[0] is with_magdeck[1]
    assert two_magdecks[1] is not two_magdecks[0]


@pytest.mark.skipif(aionotify is None,
                    reason="requires inotify (linux only)")
@pytest.mark.skipif(not hardware_control.Controller,
                    reason='hardware controller not available')
async def test_module_update_integration(monkeypatch, loop,
                                         cntrlr_mock_connect, running_on_pi):
    api = await hardware_control.API.build_hardware_controller(loop=loop)

    def mock_attached_modules():
        return [ModuleAtPort(port='/dev/ot_module_sim_tempdeck0',
                             name='tempdeck')
                ]

    monkeypatch.setattr(api, 'attached_modules',
                        mock_attached_modules)

    async def mock_build_module(port, model, callback):
        return await hardware_control.modules.build(port,
                                                    model,
                                                    True,
                                                    callback)

    monkeypatch.setattr(api._backend, 'build_module', mock_build_module)

    async def mock_discover_ports():
        return ['port1']

    monkeypatch.setattr(hardware_control.modules.update,
                        '_discover_ports', mock_discover_ports)

    async def mock_upload(port, firmware_file_path, upload_function, loop):
        return (port, (True, 'it all worked'))

    monkeypatch.setattr(hardware_control.modules.update,
                        'upload_firmware', mock_upload)

    modules = api.attached_modules
    ok, msg = await api.update_module(modules[0], 'some-fake-file', loop)
    assert ok
    new_modules = api.attached_modules
    assert new_modules[0] is not modules[0]
