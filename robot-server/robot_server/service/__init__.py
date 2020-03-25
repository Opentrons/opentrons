import typing
import uvicorn  # type: ignore
from opentrons.hardware_control import ThreadManager


HARDWARE_APP_KEY = 'hardware'


def run(hardware: ThreadManager,
        hostname: typing.Optional[str],
        port: typing.Optional[int],
        path: typing.Optional[str]):
    """Start the fastapi service."""
    # todo Amit 2/11/2020
    #  Ideally we would start the application using uvicorn command line, but
    #  that can only happen once we have parity with aiohttp endpoints.

    from .main import app
    # todo Amit 2/11/2020.
    #  This is not the long term approach for accessing hardware. It is here
    #  to play nice with existing aiohttp application bootstrap.
    app.extra[HARDWARE_APP_KEY] = hardware  # type: ignore

    uvicorn.run(app, host=hostname, port=port, uds=path)
