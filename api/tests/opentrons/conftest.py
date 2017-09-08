# Uncomment to enable logging during tests
# import logging
# from logging.config import dictConfig

import pytest
import os

from collections import namedtuple
from opentrons.server import rpc
from uuid import uuid4 as uuid

# Uncomment to enable logging during tests
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

Protocol = namedtuple(
    'Protocol',
    ['text', 'filename'])


@pytest.fixture(params=["dinosaur.py"])
def protocol(request):
    try:
        root = request.getfuncargvalue('protocol_file')
    except Exception as e:
        root = request.param

    filename = os.path.join(os.path.dirname(__file__), 'data', request.param)

    with open(filename) as file:
        text = ''.join(list(file))
        return Protocol(text=text, filename=filename)


@pytest.fixture
def session_manager(loop):
    from opentrons.session import SessionManager
    with SessionManager(loop=loop) as s:
        yield s
    return


@pytest.fixture
def session(loop, test_client, request, session_manager):
    """
    Create testing session. Tests using this fixture are expected
    to have @pytest.mark.parametrize('root', [value]) decorator set.
    If not set root will be defaulted to None
    """
    root = None
    try:
        root = request.getfuncargvalue('root')
        if not root:
            root = session_manager
        root.init(loop)
    except Exception as e:
        pass

    server = rpc.Server(loop=loop, root=root)
    client = loop.run_until_complete(test_client(server.app))
    socket = loop.run_until_complete(client.ws_connect('/'))
    token = str(uuid())

    async def call(**kwargs):
        request = {
            '$': {
                'token': token
            },
        }
        request.update(kwargs)
        return await socket.send_json(request)

    def finalizer():
        server.shutdown()

    request.addfinalizer(finalizer)
    return Session(server, socket, token, call)
