import os
from aiohttp import web

from avahi.service import AvahiService


IP_ADDRESS = '0.0.0.0'
PORT = 31951
UUID = os.environ.get('RESIN_DEVICE_UUID')
service_name = 'opentrons-{}'.format(UUID[0:6])

async def status(request):
    robot_status = {
            'robot_name': os.environ.get('ROBOT_NAME'),
            'commit_hash': os.environ.get('RESIN_APP_RELEASE'),
            'resin_app': os.environ.get('RESIN_APP_NAME'),
            'resin_name': os.environ.get('RESIN_DEVICE_NAME_AT_INIT')
        }

    return web.json_response(robot_status)



if __name__ == "__main__":
    local_service = AvahiService(service_name, "_http._tcp", PORT)
    health_server = web.Application()
    health_server.router.add_get('/', status)
    web.run_app(health_server, host=IP_ADDRESS, port=PORT)
