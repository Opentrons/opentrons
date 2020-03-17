import logging
import json

from aiohttp import web
import opentrons.deck_calibration.endpoints as dc


log = logging.getLogger(__name__)


async def start(request):
    """
    Begins the session manager for factory calibration, if a session is not
    already in progress, or if the "force" key is specified in the request. To
    force, use the following body:
    {
      "force": true
    }
    :return: The current session ID token or an error message
    """
    try:
        body = await request.json()
    except json.decoder.JSONDecodeError:
        # Body will be null for requests without parameters (normal operation)
        log.debug("No body in {}".format(request))
        body = {}

    try:
        res = await dc.create_session(body.get('force') is not None,
                                      hw_from_req(request))
        status = 201
        data = {'token': res.token, 'pipette': res.pipette}
    except dc.SessionForbidden as e:
        status = 403
        data = {"message": str(e)}
    except dc.SessionInProgress as e:
        status = 409
        data = {"message": str(e)}

    return web.json_response(data, status=status)


async def dispatch(request):
    """
    Routes commands to subhandlers based on the command field in the body.
    """
    data = await request.json()
    try:
        # Pop values from data. The remaining keys will be specific
        # command args
        session_token = data.pop('token', None)
        command = data.pop('command', None)

        if not session_token:
            raise AssertionError('"token" field required for '
                                 'calibration requests')
        if not command:
            raise AssertionError('"command" field required for '
                                 'calibration requests')

        res = await dc.dispatch(token=session_token,
                                command=command,
                                command_data=data)
        status = 200 if res.success else 400
        message = res.message
    except dc.NoSessionInProgress as e:
        message = str(e)
        status = 418
    except dc.SessionForbidden as e:
        message = str(e)
        status = 403
    except AssertionError as e:
        message = str(e)
        status = 400
    except Exception as e:
        message = 'Exception {} raised by dispatch of {}: {}'.format(
                type(e), data, e)
        status = 500

    return web.json_response({"message": message}, status=status)


def hw_from_req(req):
    """Utility function to get the hardware resource from requests """
    return req.app['com.opentrons.hardware']
