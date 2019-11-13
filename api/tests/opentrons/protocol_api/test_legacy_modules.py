from unittest import mock
import threading
import time

import pytest

from opentrons.protocol_api.contexts import (MagneticModuleContext,
                                             TemperatureModuleContext)
from opentrons.protocol_api.legacy_wrapper.modules_wrapper import (
    TempDeckV1, MagDeckV1)


@pytest.mark.parametrize(
    'which_module,new_mod,old_mod',
    [('tempdeck', TemperatureModuleContext, TempDeckV1),
     ('magdeck', MagneticModuleContext, MagDeckV1)])
@pytest.mark.api2_only
def test_load_module(modules, which_module, new_mod, old_mod):
    mod = modules.load(which_module, '1')
    assert isinstance(mod, old_mod)
    assert isinstance(mod._ctx, new_mod)


@pytest.mark.api2_only
def test_tempdeck_settemp_returns_immediately(modules, monkeypatch):
    mod = modules.load('tempdeck', '1')

    def _raise(c):
        raise RuntimeError('wrong one!')

    monkeypatch.setattr(mod._ctx._module._driver, 'set_temperature',
                        _raise)
    lst_mock = mock.Mock()
    monkeypatch.setattr(
        mod._ctx._module._driver, 'legacy_set_temperature', lst_mock)
    assert mod.target is None
    mod.set_temperature(50)
    lst_mock.assert_called_once_with(50)


@pytest.mark.api2_only
def test_tempdeck_attributes(modules):
    mod = modules.load('tempdeck', '1')
    assert mod.temperature == 0
    assert mod.target is None
    assert mod.status == 'idle'
    mod.set_temperature(50)
    assert mod.temperature == 50
    assert mod.target == 50
    assert mod.status == 'holding at target'


@pytest.mark.api2_only
def test_tempdeck_wait(modules, monkeypatch):
    mod = modules.load('tempdeck', '1')

    monkeypatch.setattr(
        mod._ctx._module._driver, '_active', False)
    assert mod.status == 'idle'
    th = threading.Thread(target=lambda: mod.wait_for_temp())
    th.start()
    assert th.is_alive()
    monkeypatch.setattr(
        mod._ctx._module._driver, '_active', True)
    time.sleep(0.25)
    th.join()


@pytest.mark.api2_only
def test_magdeck(modules):
    md = modules.load('magdeck', '1')
    assert md.status == 'disengaged'
    md.engage(height=10)
    assert md.status == 'engaged'
    md.disengage()
    assert md.status == 'disengaged'
