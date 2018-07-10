import os
import logging
import tempfile
from aiohttp import web
from otupdate import bootstrap
from time import time

log = logging.getLogger(__name__)


def build_health_endpoint(
        name, update_server_version, api_server_version, smoothie_version):
    async def health(request: web.Request) -> web.Response:
        return web.json_response(
            {
                'name': name,
                'updateServerVersion': update_server_version,
                'apiServerVersion': api_server_version,
                'smoothieVersion': smoothie_version
            },
            headers={'Access-Control-Allow-Origin': '*'}
        )
    return health


async def bootstrap_update_server(
        request: web.Request, test_flag=False) -> web.Response:
    start_time = time()
    data = await request.post()
    wheel = data.get('whl')
    log.debug('Got whl: {}'.format(wheel))
    log.debug('  filename: {}'.format(wheel.filename))
    res = {'status': 'in progress'}
    tmpd = None
    filename = None
    python = None
    venv_site_pkgs = None

    # Unpack wheel and install into a virtual environment
    if not wheel:
        log.debug('No wheel file provided')
        res = {
            'status': 'failure',
            'message': '"whl" parameter missing from request'}

    if res.get('status') != 'failure':
        tmpd = tempfile.mkdtemp()
        filename = os.path.join(tmpd, wheel.filename)
        log.info('Preparing to install: {}'.format(filename))
        content = wheel.file.read()

        with open(filename, 'wb') as wf:
            wf.write(content)

        log.debug('Bootstrapping update server {} [test mode: {}]'.format(
            filename, test_flag))

        res, python, venv_site_pkgs = await bootstrap.install_sandboxed_update(
            filename, request.loop)
        log.debug('Install complete with status: {}'.format(res.get('status')))

    if python and res.get('status') != 'failure':
        if test_flag:
            log.debug('Test mode, not testing successive install')
            res = {'status': 'Successfully installed update'}
        else:
            test_port = 34001
            res = await bootstrap.test_update_server(
                python, test_port, filename, venv_site_pkgs)

    if res.get('status') == 'failure':
        log.debug('Test failed, not installing update')
        status = 400
    elif not test_flag:
        log.debug('Test successful, installing update')
        install_res, returncode = await bootstrap.install_update(
            filename, request.loop)
        res.update(install_res)
        if returncode == 0:
            status = 200
        else:
            status = 400
    else:
        log.debug('Self-test successful on test server')
        status = 200

    bootstrap.clean(tmpd)

    request_time = time() - start_time
    log.info('Bootstrap request took {:.3f} seconds'.format(request_time))
    return web.json_response(res, status=status)
