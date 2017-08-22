import logging
import pytest

from collections import namedtuple
from logging.config import dictConfig
from opentrons.server import rpc
from uuid import uuid4 as uuid

# logging_config = dict(
#     version=1,
#     formatters={
#         'basic': {
#             'format':
#             '[Line %(lineno)s] %(message)s'
#         }
#     },
#     handlers={
#         'debug': {
#             'class': 'logging.StreamHandler',
#             'formatter': 'basic',
#         }
#     },
#     loggers={
#         '__main__': {
#             'handlers': ['debug'],
#             'level': logging.DEBUG
#         },
#         'opentrons.server': {
#             'handlers': ['debug'],
#             'level': logging.DEBUG
#         },
#     }
# )
# dictConfig(logging_config)

Session = namedtuple(
    'Session',
    ['server', 'socket', 'token', 'call'])


@pytest.fixture
def robot_container(loop, request):
    from opentrons.server import robot_container
    container = robot_container.RobotContainer(loop=loop)
    yield container
    container.finalize()


@pytest.fixture
def session(loop, test_client, request):
    server = rpc.Server(loop=loop)
    client = loop.run_until_complete(test_client(server.app))
    socket = loop.run_until_complete(client.ws_connect('/'))
    token = str(uuid())

    async def call(obj=None, name=None, args=None):
        request = {
            '$': {
                'token': token
            },
            'id': id(obj)
        }
        if name is not None:
            request['name'] = name
        if args is not None:
            request['args'] = args

        return await socket.send_json(request)

    def finalizer():
        server.stop()

    request.addfinalizer(finalizer)
    return Session(server, socket, token, call)
