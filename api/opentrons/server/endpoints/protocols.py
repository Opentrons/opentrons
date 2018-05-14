from aiohttp import web
from opentrons import protocols, robot


async def execute_json(request):
    # TODO Ian 2018-05-14 this should have a simulate flag, right?
    robot.reset()  # TODO is this OK?
    json_protocol = await request.text()
    # TODO Ian 2018-05-14 error handling
    loaded_labware_pipettes = protocols.execute_json(json_protocol)

    # TODO Ian 2018-05-14 serialize loaded_labware_pipettes -- what format?
    print(loaded_labware_pipettes)
    return web.json_response({
            'TODO': True,
            'commands': robot.commands()  # TODO placeholder
        },
        status=200)
