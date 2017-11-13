from aiohttp import web

from avahi.service import AvahiService


IP_ADDRESS = '0.0.0.0'
PORT = '31951'


async def health(request):
    return web.Response(text=machine_info())



if __name__ == "__main__":
    local_service = AvahiService("opentrons", "_http._tcp", PORT)
    health_server = web.Application()
    health_server.route.add_get('/', health)
    web.run_app(health_server, host=IP_ADDRESS, port=PORT)
