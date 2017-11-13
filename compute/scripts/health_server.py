import os
from aiohttp import web

from avahi.service import AvahiService


IP_ADDRESS = '0.0.0.0'
PORT = '31951'


async def status(request):
    robot_status = {
            'is_api_running': os.environ['API_IS_RUNNING'],
            'machine_name': os.environ['ROBOT_NAME'],
            'commit_hash': os.environ['RESIN_APP_RELEASE'],
            'resin_app': os.environ['RESIN_APP_NAME'],
            'resin_device_name': os.environ['RESIN_DEVICE_NAME_AT_INIT']
        }

    return web.json_response(robot_status)



if __name__ == "__main__":
    #TODO jmg 11/13/17: advertise an http service
    local_service = AvahiService("opentrons", "_ssh._tcp", PORT)
    health_server = web.Application()
    health_server.route.add_get('/', status)
    web.run_app(health_server, host=IP_ADDRESS, port=PORT)
