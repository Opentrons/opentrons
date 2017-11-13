import os
from aiohttp import web

from avahi.service import AvahiService


IP_ADDRESS = '0.0.0.0'
PORT = 31951


async def status(request):
    robot_status = {
            'api_is_running': os.environ.get('API_IS_RUNNING', False),
            'commit_hash': os.environ.get('RESIN_APP_RELEASE'),
            'resin_app': os.environ.get('RESIN_APP_NAME'),
            'resin_device_name': os.environ.get('RESIN_DEVICE_NAME_AT_INIT')
        }

    return web.json_response(robot_status)



if __name__ == "__main__":
    #TODO jmg 11/13/17: advertise an http service
    local_service = AvahiService("opentrons", "_ssh._tcp", PORT)
    health_server = web.Application()
    health_server.router.add_get('/', status)
    web.run_app(health_server, host=IP_ADDRESS, port=PORT)
