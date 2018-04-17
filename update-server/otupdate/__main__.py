import os
import sys
import logging
import asyncio
from aiohttp import web
from otupdate import get_app


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('-p', '--port', dest='port', type=int)
    parser.add_argument('--host', dest='host', type=str, default='127.0.0.1')
    parser.add_argument('--test', action='store_true')
    parser.add_argument('--debug', action='store_true')
    args = parser.parse_args()

    if sys.platform == 'win32':
        loop = asyncio.ProactorEventLoop()
        asyncio.set_event_loop(loop)

    # package.json location for the update server
    update_package = os.path.join(
        os.path.abspath(os.path.dirname(__file__)), 'package.json')

    # package.json location for the API server installed in the update server's
    # environment (e.g.: which version is available by import). This is one way
    # of finding this info, but it could also be determined by making an HTTP
    # request to the API server and selecting this info. In the future, this
    # server should check the health of the API server process and possibly get
    # the version that way instead.
    try:
        import opentrons
        api_package = os.path.join(
            os.path.abspath(os.path.dirname(opentrons.__file__)),
            'package.json')
        opentrons.robot.connect()
        smoothie_version = opentrons.robot.fw_version
    except Exception:
        print("Module `opentrons` import failed")
        api_package = None
        smoothie_version = 'not available'

    fmt = '%(asctime)s %(name)s %(levelname)s [Line %(lineno)s] %(message)s'
    config_dict = {
        'format': fmt,
        'level': 'DEBUG' if args.debug else 'INFO'
    }
    logging.basicConfig(**config_dict)
    log = logging.getLogger(__name__)

    log.info('Starting update server on http://{}:{}'.format(
        args.host, args.port))
    app = get_app(
        api_package=api_package,
        update_package=update_package,
        smoothie_version=smoothie_version,
        test=args.test)
    web.run_app(app, host=args.host, port=args.port)


main()
