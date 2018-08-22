""" Test file for updating the API.
"""
import os
import subprocess
import sys
import tempfile

import otupdate
from otupdate import install


def build_pkg(package_name, version, in_dir=None):
    """ Build a fake minor package and return its path """
    if not in_dir:
        td = tempfile.mkdtemp()
        in_dir = os.path.join(td, package_name)
        os.mkdir(in_dir)
    test_setup = """
from setuptools import setup

setup(name='{0}',
version='{1}',
description='Test package',
url='http://github.com/Opentrons/opentrons',
author='Opentrons',
author_email='test@example.com',
license='Apache 2.0',
packages=['{0}'],
zip_safe=False)
""".format(package_name, version)
    test_setup_file = os.path.join(in_dir, 'setup.py')
    with open(test_setup_file, 'w') as tsf:
        tsf.write(test_setup)

    src_dir = os.path.join(in_dir, package_name)
    try:
        os.mkdir(src_dir)
    except FileExistsError:
        pass
    test_code = """
print("all ok")'
"""
    test_file = os.path.join(src_dir, '__init__.py')

    with open(test_file, 'w') as tf:
        tf.write(test_code)

    cmd = '{} setup.py bdist_wheel'.format(sys.executable)
    subprocess.run(cmd, cwd=in_dir, shell=True)
    return os.path.join(
        in_dir, 'dist',
        '{}-{}-py3-none-any.whl'.format(package_name, version))


async def test_provision_version_gate(loop, monkeypatch, test_client):

    async def mock_install_py(executable, data, loop):
        return {'message': 'ok', 'filename': data.filename}, 0

    monkeypatch.setattr(install, 'install_py', mock_install_py)

    container_provisioned = False

    async def mock_provision_container(executable, loop):
        nonlocal container_provisioned
        container_provisioned = True
        return {'message': 'ok', 'filename': '<provision>'}, 0

    monkeypatch.setattr(install, '_provision_container',
                        mock_provision_container)

    update_package = os.path.join(os.path.abspath(
        os.path.dirname(otupdate.__file__)), 'package.json')
    app = otupdate.get_app(
        api_package=None,
        update_package=update_package,
        smoothie_version='not available',
        loop=loop,
        test=False)
    cli = await loop.create_task(test_client(app))

    pkg_name = 'opentrons'
    td = tempfile.mkdtemp()
    tmpd = os.path.join(td, pkg_name)
    os.mkdir(tmpd)

    # First test: API server with a version before 3.3.0 should not provision
    test_wheel = build_pkg('opentrons', '3.2.0a2', tmpd)

    resp = await cli.post(
        '/server/update', data={'whl': open(test_wheel, 'rb')})

    assert resp.status == 200
    assert not container_provisioned

    # Second test: An api server with a version == 3.3.0 (regardless of tag)
    # should provision
    test_wheel = build_pkg('opentrons', '3.3.0rc5', tmpd)
    resp = await cli.post(
        '/server/update', data={'whl': open(test_wheel, 'rb')})

    assert resp.status == 200
    assert container_provisioned

    # Third test: An api server with a version > 3.3.0 should provision
    container_provisioned = False
    test_wheel = build_pkg('opentrons', '3.4.0', tmpd)
    resp = await cli.post(
        '/server/update', data={'whl': open(test_wheel, 'rb')})

    assert resp.status == 200
    assert container_provisioned
