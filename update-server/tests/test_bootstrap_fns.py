import os
import sys
import logging
import tempfile
import subprocess
from collections import namedtuple
from otupdate import bootstrap

logging.basicConfig(level='DEBUG')

wheel_data = namedtuple(
    'wheel_data',
    [
        'filename',
        'file'
    ]
)


async def test_create_virtual_environment(loop):
    python, _ = await bootstrap.create_virtual_environment(loop=loop)
    assert os.path.exists(python)


async def test_install_fail(monkeypatch, loop):
    test_data = wheel_data('bad_test.whl', 'bad data')

    async def mock_install(python, filename, _loop):
        return '', 'error'

    monkeypatch.setattr(bootstrap, '_install', mock_install)

    res, python, _ = await bootstrap.install_sandboxed_update(
        test_data, loop=loop)
    assert res.get('status') == 'failure'


async def test_install_sandboxed_update(monkeypatch, loop):
    test_data = wheel_data('testy.whl', 'wheel data')

    async def mock_install(python, filename, _loop):
        return 'success', None

    monkeypatch.setattr(bootstrap, '_install', mock_install)

    res, python, _ = await bootstrap.install_sandboxed_update(
        test_data, loop=loop)
    assert res.get('status') == 'success'

    python_check = '{} -V'.format(python)
    proc = subprocess.run(python_check, check=True, shell=True)
    assert proc.returncode == 0


async def test_startstop_server(monkeypatch):
    test_port = 34016

    td = tempfile.mkdtemp()
    tmpd = os.path.join(td, 'testy')
    os.mkdir(tmpd)

    test_setup = """
from setuptools import setup

setup(name='testy',
    version='1.0.0',
    description='Test package',
    url='http://github.com/Opentrons/opentrons',
    author='Opentrons',
    author_email='test@example.com',
    license='Apache 2.0',
    packages=['testy'],
    zip_safe=False)
"""
    test_setup_file = os.path.join(tmpd, 'setup.py')
    with open(test_setup_file, 'w') as tsf:
        tsf.write(test_setup)

    src_dir = os.path.join(tmpd, 'testy')
    os.mkdir(src_dir)
    test_code = """
print('testing')
"""
    test_file = os.path.join(src_dir, '__init__.py')

    with open(test_file, 'w') as tf:
        tf.write(test_code)

    cmd = '{} setup.py bdist_wheel'.format(sys.executable)
    subprocess.run(cmd, cwd=tmpd, shell=True)
    test_wheel = os.path.join(tmpd, 'dist', 'testy-1.0.0-py3-none-any.whl')

    res = await bootstrap.test_update_server(
        sys.executable, test_port, test_wheel)

    assert res.get('status') == 'success'
