"""
This module is responsible for installing an update in a virtual environment
and testing it, to ensure that the new version of software will boot correctly
and accept successive updates.
"""
import os
import sys
import atexit
import shutil
import logging
import tempfile
import asyncio
import aiohttp
import subprocess as sp
from otupdate import selftest

log = logging.getLogger(__name__)
VENV_NAME = 'env'


async def _install(python, filename, loop) -> (str, str):
    running_on_pi = os.environ.get('RUNNING_ON_PI') and '/tmp' in python
    python_home = python.split(VENV_NAME)[0] + VENV_NAME

    if running_on_pi:
        env_vars = 'PYTHONHOME={} '.format(python_home)
    else:
        env_vars = ''

    pip_opts = '--upgrade --force-reinstall --no-deps'
    command = '{}{} -m pip install {} {}'.format(
        env_vars, python, pip_opts, filename)

    log.debug('cmd: {}'.format(command))
    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        loop=loop)

    rd_out = await proc.stdout.read()
    rd_err = await proc.stderr.read()
    out = rd_out.decode().strip()
    err = rd_err.decode().strip()
    log.debug("Out: {}".format(out))
    log.debug("Err: {}".format(err))
    await proc.communicate()

    if running_on_pi:
        # For some reason, the pip install above (using a python binary at
        # "/tmp/tmp<hash>/env/bin/python" causes the package to be installed
        # in "/data/packages/tmp/tmp<hash>/env/lib/python3.6/site-packages",
        # so it is not found unless it is subsequently copied into the same
        # path without the preceeding "/data/packages". Note that for the join
        # to work correctly, the leading '/' has to be dropped from
        # `python_home`. This whole difficulty is a side-effect of not calling
        # the `activate` script of the virtual environment, but if the activate
        # script is called in a subprocess then the server must be started in
        # the same shell and we lose the reference to the server (the
        # subprocess ends up pointing to the activate shell and killing it does
        # not halt the server.
        src_spk = os.path.join(
            '/data/packages',
            python_home[1:],
            'lib',
            'python3.6',
            'site-packages')
        dst_spk = os.path.join(python_home, 'lib', 'python3.6')
        dst_packages = os.listdir(dst_spk)
        for pkg in os.listdir(src_spk):
            if pkg not in dst_packages:
                src = os.path.join(src_spk, pkg)
                dst = os.path.join(dst_spk, pkg)
                log.debug("Moving {} to {}".format(src, dst))
                shutil.move(src, dst)
    return out, err


async def create_virtual_environment(loop=None) -> (str, str):
    """
    Create a virtual environment, and return the path to the virtual env
    directory, which should contain a "bin" directory with the `python` and
    `pip` binaries that can be used to a test install of a software package.

    :return: the path to python in the new virtual environment
    """
    tmp_dir = tempfile.mkdtemp()
    venv_dir = os.path.join(tmp_dir, VENV_NAME)
    proc1 = await asyncio.create_subprocess_shell(
        'virtualenv {}'.format(venv_dir), loop=loop)
    await proc1.communicate()
    if sys.platform == 'win32':
        python = os.path.join(venv_dir, 'Scripts', 'python.exe')
    else:
        python = os.path.join(venv_dir, 'bin', 'python')
    venv_site_pkgs = install_dependencies(python)

    log.info("Created virtual environment at {}".format(venv_dir))

    return python, venv_site_pkgs


def install_dependencies(python) -> str:
    """
    Copy aiohttp and virtualenv install locations (and their transitive
    dependencies in new virtualenv so that the update server can install
    without access to full system site-packages or connection to the internet.
    Full access to system site-packages causes the install inside the
    virtualenv to fail quietly because it does not have permission to overwrite
    a package by the same name and then it picks up the system version of
    otupdate. Also, we have to do a copy rather than a symlink because a non-
    admin Windows account does not have permissions to create symlinks.
    """
    # Import all of the packages that need to be available in the virtualenv
    # for the update server to boot, so we can locate them using their __file__
    # attribute
    import aiohttp
    import virtualenv_support
    import async_timeout
    import chardet
    import multidict
    import yarl
    import idna
    import pip
    import setuptools
    import virtualenv

    # Determine where the site-packages directory exists in the virtualenv
    tmpdirname = python.split(VENV_NAME)[0]
    paths_raw = sp.check_output(
        '{} -c "import sys; [print(p) for p in sys.path]"'.format(python),
        shell=True)
    paths = paths_raw.decode().split()
    venv_site_pkgs = list(
        filter(
            lambda x: tmpdirname in x and 'site-packages' in x, paths))[-1]

    dependencies = [
        ('aiohttp', aiohttp),
        ('virtualenv_support', virtualenv_support),
        ('async_timeout', async_timeout),
        ('chardet', chardet),
        ('multidict', multidict),
        ('yarl', yarl),
        ('idna', idna),
        ('pip', pip),
        ('setuptools', setuptools),
        ('virtualenv.py', virtualenv)]

    # Copy each dependency from is system-install location to the site-packages
    # directory of the virtualenv
    for dep_name, dep in dependencies:
        src_dir = os.path.abspath(os.path.dirname(dep.__file__))
        dst = os.path.join(venv_site_pkgs, dep_name)
        if os.path.exists(dst):
            log.debug('{} already exists--skipping'.format(dst))
        else:
            log.debug('Copying {} to {}'.format(dep_name, dst))
            if dep_name.endswith('.py'):
                shutil.copy2(os.path.join(src_dir, dep_name), dst)
            else:
                shutil.copytree(src_dir, dst)
    return venv_site_pkgs


async def _start_server(python, port, venv_site_pkgs=None) -> sp.Popen:
    """
    Starts an update server sandboxed in the virtual env, and attempts to read
    the health endpoint with retries to determine when the server is available.
    If the number of retries is exceeded, the returned server process will
    already be terminated.

    :return: the server process
    """
    log.info("Starting sandboxed update server on port {}".format(port))
    if venv_site_pkgs:
        python = 'PYTHONPATH={} {}'.format(venv_site_pkgs, python)
    cmd = [python, '-m', 'otupdate', '--debug', '--test', '--port', str(port)]
    log.debug('cmd: {}'.format(' '.join(cmd)))
    proc = sp.Popen(' '.join(cmd), shell=True)
    atexit.register(lambda: _stop_server(proc))

    n_retries = 3
    async with aiohttp.ClientSession() as session:
        test_status, detail = await selftest.health_check(
            session=session, port=port, retries=n_retries)
    if test_status == 'failure':
        log.debug(
            "Test server failed to start after {} retries. Stopping.".format(
                n_retries))
        _stop_server(proc)
    return proc


def _stop_server(proc: sp.Popen):
    log.info("Halting sandboxed update server")
    proc.terminate()
    proc.communicate()
    clean('/data/packages/tmp')


async def install_sandboxed_update(filename, loop) -> (dict, str, str):
    """
    Create a virtual environment and activate it, and then install an
    update candidate (leaves virtual environment activated)

    :return: a result dict and the path to python in the virtual environment
    """
    log.debug("Creating virtual environment")
    python, venv_site_pkgs = await create_virtual_environment(loop=loop)
    log.debug("Installing update server into virtual environment")
    out, err = await _install(python, filename, loop)
    if err:
        log.error("Install failed: {}".format(err))
        res = {'status': 'failure', 'error': err}
    else:
        log.debug("Install successful")
        res = {'status': 'success'}
    return res, python, venv_site_pkgs


async def install_update(filename, loop) -> dict:
    """
    Install the update into the system environment.
    """
    log.info("Installing update server into system environment")
    log.debug('File {} exists? {}'.format(filename, os.path.exists(filename)))
    msg = await _install(sys.executable, filename, loop)
    res = {'message': msg, 'filename': filename}
    return res


async def test_update_server(
        python, test_port, filename, venv_site_pkgs=None) -> dict:
    """
    Starts a test server using the virtual environment, and then runs tests
    against that server

    :return: the result of `selftest.run_self_test`
    """
    log.debug('Testing update server on port {}'.format(test_port))

    # Start the server on the test port, and then make health and update reqs
    server_proc = await _start_server(python, test_port, venv_site_pkgs)
    test_result = await selftest.run_self_test(test_port, filename)
    _stop_server(server_proc)

    # Delete the temporary directory containing the virtual environment
    tmpdir = python.split(VENV_NAME)[0]
    clean(tmpdir)

    return test_result


def clean(path):
    if os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
