import subprocess
import threading

import pytest
from opentrons import hardware_control as hc

if not hc.controller:
    pytest.skip('hardware controller not available (probably windows)',
                allow_module_level=True)


def test_controller_runs_only_on_pi():
    with pytest.raises(RuntimeError):
        c = hc.API.build_hardware_controller() # noqa


def test_controller_instantiates(
        hardware_controller_lockfile, running_on_pi, loop):
    c = hc.API.build_hardware_controller(loop=loop)
    assert None is not c


def test_controller_unique_per_thread(
        hardware_controller_lockfile, running_on_pi, loop):
    c = hc.API.build_hardware_controller(loop=loop) # noqa
    with pytest.raises(RuntimeError):
        _ = hc.API.build_hardware_controller(loop=loop) # noqa

    def _create_in_new_thread():
        with pytest.raises(RuntimeError):
            _ = hc.API.build_hardware_controller(loop=loop) # noqa

    thread = threading.Thread(target=_create_in_new_thread)
    thread.start()
    thread.join()

    async def _create_in_coroutine():
        _ = hc.API.build_hardware_controller(loop=loop) # noqa

    fut = _create_in_coroutine()
    with pytest.raises(RuntimeError):
        loop.run_until_complete(fut)


def test_controller_unique_per_proc(
        hardware_controller_lockfile, running_on_pi, loop):
    c = hc.API.build_hardware_controller(loop=loop) # noqa

    script = '''import os
os.environ.pop('RUNNING_ON_PI')
import opentrons.hardware_control as hc
os.environ['RUNNING_ON_PI'] = '1'
try:
    hc.API.build_hardware_controller()
except RuntimeError:
    print('ok')
except Exception as e:
    print('unexpected exception: {}'.format(repr(e)))
else:
    print('no exception')
    '''

    cmd = ['python', '-c', script]

    out = subprocess.check_output(cmd)
    assert out.split(b'\n')[-2] == b'ok'
