import json
import logging

from typing import Any, Dict, Mapping

from aiohttp import web

from opentrons.system import log_control

LOG = logging.getLogger(__name__)


def _get_options(params: Mapping[str, str],
                 default_length: int) -> Dict[str, Any]:
    """ Parse options from a request. Should leave the request able to
    be read again since it only uses the content-preserving
    :py:meth:`aiohttp.web.Request.json`. Will not fail; malformed
    requests will just use defaults.
    """
    response = {
        'format': 'text',
        'records': default_length
    }

    print({k: v for k, v in params.items()})

    if 'format' in params:
        if params['format'] not in ('text', 'json'):
            LOG.error(f"Bad log format requested: {params['format']}")
        else:
            response['format'] = params['format']

    if 'records' in params:
        try:
            records = int(params['records'])
            if records <= 0 or records > log_control.MAX_RECORDS:
                raise ValueError(records)
        except (ValueError, TypeError):
            LOG.exception(f"Bad records count requested: {params['records']}")
        else:
            response['records'] = records
    return response


async def _get_log_response(syslog_selector: str, record_count: int,
                            record_format: str) -> web.Response:
    modes = {
        'json': 'json',
        'text': 'short'
    }
    output = await log_control.get_records_dumb(syslog_selector,
                                                record_count,
                                                modes[record_format])
    return web.Response(text=output.decode('utf-8'))


async def get_logs_by_id(request: web.Request) -> web.Response:
    """ Get logs from the robot.

    GET /logs/:syslog_identifier -> 200 OK, log contents in body

    This endpoint accepts the following (optional) query parameters:
    - ``format``: ``json`` or ``text`` (default: text). Controls log format.
    - ``records``: int. Count of records to limit the dump to. Default: 500000.
      Limit: 1000000

    The syslog identifier is an a string that something has logged to as the
    syslog id. It may not be blank (i.e. GET /logs/ is not allowed). The
    identifier is sent to systemd and therefore invalid syslog ids will result
    in an empty response body, not a 404.

    In addition to actual syslog identifiers, for backwards compatibility the
    path can be ``serial.log``, which corresponds to syslog id
    ``opentrons-api-serial`` or ``api.log``, which corresponds to syslog id
    ``opentrons-api``.

    For instance, ``GET /logs/api.log?format=json`` gives the API logs in json
    format.
    """
    ident = request.match_info['syslog_identifier']
    if ident == 'api.log':
        ident = 'opentrons-api'
    elif ident == 'serial.log':
        ident = 'opentrons-api-serial'
    opts = _get_options(request.query, 500000)
    return await _get_log_response(
        ident, opts['records'], opts['format'])


async def set_syslog_level(request: web.Request) -> web.Response:
    """
    Set the minimum level for which logs will be sent upstream via syslog-ng

    POST /settings/log_level/upstream {"log_level": str level, null} -> 200 OK

    """
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return web.json_response(status=400,
                                 data={"message": "request must be json"})
    if 'log_level' not in body:
        return web.json_response(
            status=400,
            data={"message": "body must have log_level key"})
    log_level = body['log_level']
    ok_syslogs = {
        'error': 'err',
        'warning': 'warning',
        'info': 'info',
        'debug': 'debug'
    }
    if log_level is None:
        syslog_level = 'emerg'
    else:
        try:
            syslog_level = ok_syslogs[log_level.lower()]
        except (KeyError, AttributeError):
            return web.json_response(
                status=400,
                data={"message": f"invalid log level {log_level}"})

    code, stdout, stderr = await log_control.set_syslog_level(syslog_level)
    if code != 0:
        msg = f'Could not reload config: {stdout} {stderr}'
        LOG.error(msg)
        return web.json_response(status=500, data={'message': msg})
    else:

        if log_level:
            result = f'Upstreaming log level changed to {log_level}'
            getattr(LOG, log_level.lower())(
                result)
        else:
            result = "Upstreaming logs disabled"
            LOG.info(result)
        return web.json_response(status=200,
                                 data={"message": result})
