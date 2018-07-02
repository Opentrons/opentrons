"""
This is the most critical test package for this application--this server MUST
be able to boot. If a version that fails to boot is installed, then the robot
will almost certainly become unrecoverable.
"""
import os
import sys
import json
import tempfile
import subprocess
import otupdate
from otupdate import bootstrap, control
# Tests should closely reflect the tasks in selftest.py


async def test_server_boot(loop, test_client):
    update_package = os.path.join(
        os.path.abspath(os.path.dirname(otupdate.__file__)), 'package.json')
    with open(update_package) as pkg:
        pkg_data = json.load(pkg)
        update_server_version = pkg_data.get('version')

    app = otupdate.get_app(
        api_package=None,
        update_package=update_package,
        smoothie_version='not available',
        loop=loop,
        test=True)
    cli = await loop.create_task(test_client(app))

    expected = {
        'name': 'opentrons-dev',
        'updateServerVersion': update_server_version,
        'apiServerVersion': 'not available',
        'smoothieVersion': 'not available'
    }

    resp = await cli.get('/server/update/health')
    res = await resp.json()
    assert resp.status == 200
    assert res == expected


async def test_bootstrap_fail(monkeypatch, loop, test_client):
    async def mock_install(filename, _loop):
        """
        If this test passes (e.g.: if the self-test fails), this function
        should not run--this mock exists to keep the test from installing
        to the system if the self-test passes and the bootstrap endpoint
        tries to actually install the package.
        """
        return {'message': 'test msg', 'filename': filename}

    monkeypatch.setattr(bootstrap, 'install_update', mock_install)

    pkg_name = 'otupdate'

    td = tempfile.mkdtemp()
    tmpd = os.path.join(td, pkg_name)
    os.mkdir(tmpd)

    test_setup = """
from setuptools import setup

setup(name='{}',
version='1.0.0',
description='Test package',
url='http://github.com/Opentrons/opentrons',
author='Opentrons',
author_email='test@example.com',
license='Apache 2.0',
packages=['otupdate'],
zip_safe=False)
""".format(pkg_name)
    test_setup_file = os.path.join(tmpd, 'setup.py')
    with open(test_setup_file, 'w') as tsf:
        tsf.write(test_setup)

    src_dir = os.path.join(tmpd, pkg_name)
    os.mkdir(src_dir)
    test_code = """
print('intentionally malformed'
"""
    test_file = os.path.join(src_dir, '__init__.py')

    with open(test_file, 'w') as tf:
        tf.write(test_code)

    cmd = '{} setup.py bdist_wheel'.format(sys.executable)
    subprocess.run(cmd, cwd=tmpd, shell=True)
    test_wheel = os.path.join(
        tmpd, 'dist', '{}-1.0.0-py3-none-any.whl'.format(pkg_name))

    update_package = os.path.join(os.path.abspath(
        os.path.dirname(otupdate.__file__)), 'package.json')

    app = otupdate.get_app(
        api_package=None,
        update_package=update_package,
        smoothie_version='not available',
        loop=loop,
        test=False)
    cli = await loop.create_task(test_client(app))

    resp = await cli.post(
        '/server/update/bootstrap', data={'whl': open(test_wheel, 'rb')})
    res = await resp.json()

    assert res.get('status') == 'failure'
    assert int(resp.status/100.0) == 4


async def test_restart(loop, test_client, monkeypatch):
    restart_flag = False

    def mock_restart():
        nonlocal restart_flag
        restart_flag = True

    monkeypatch.setattr(control, '__wait_and_restart', mock_restart)

    update_package = os.path.join(
        os.path.abspath(os.path.dirname(otupdate.__file__)), 'package.json')

    app = otupdate.get_app(
        api_package=None,
        update_package=update_package,
        smoothie_version='not available',
        loop=loop,
        test=True)
    cli = await loop.create_task(test_client(app))

    resp = await cli.post('/server/update/restart')
    res = await resp.json()
    assert resp.status == 200

    expected = {"message": "restarting"}
    assert res == expected
    assert restart_flag
