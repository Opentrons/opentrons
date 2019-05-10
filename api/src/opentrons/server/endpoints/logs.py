import asyncio
import collections
import datetime
import json
import logging
import syslog
from typing import Any, Deque, Dict, List, Mapping

from aiohttp import web
import systemd.journal as journal


LOG = logging.getLogger(__name__)

MAX_RECORDS = 1000000


def _get_options(params: Mapping[str, str],
                 default_length: int) -> Dict[str, Any]:
    """ Parse options from a request. Should leave the request able to
    be read again since it only uses the content-preserving
    :py:meth:`aiohttp.web.Request.json`. Will not fail; malformed
    requests will just use defaults.
    """
    response = {
        'format': 'json',
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
            if records <= 0 or records > MAX_RECORDS:
                raise ValueError(records)
        except (ValueError, TypeError):
            LOG.exception(f"Bad records count requested: {params['records']}")
        else:
            response['records'] = records
    return response


async def _get_records(syslog_selector: str, record_count: int)\
          -> Deque[Dict[str, Any]]:
    """ Get log records up to record count.
    """
    loop = asyncio.get_event_loop()
    log_deque: Deque[Dict[str, Any]] = collections.deque(maxlen=record_count)
    with journal.Reader(journal.SYSTEM_ONLY) as r:
        r.add_match(SYSLOG_IDENTIFIER=syslog_selector)
        last_time = loop.time()
        for record in r:
            log_deque.append(record)
            now = loop.time()
            if (now-last_time) > 0.1:
                last_time = now
                await asyncio.sleep(0.01)
    return log_deque


def _format_record_text(record: Dict[str, Any]) -> str:
    dict_rec = _format_record_dict(record)
    return f'{dict_rec["time"]} {dict_rec["logger"]} '\
        f'[{dict_rec["level_name"]}]: {dict_rec["message"]}'


def _format_text(records: Deque[Dict[str, Any]]) -> str:
    return '\n'.join([_format_record_text(record) for record in records])


_SYSLOG_PRIORITY_TO_NAME = {
    syslog.LOG_EMERG: 'emergency',
    syslog.LOG_CRIT: 'critical',
    syslog.LOG_ERR: 'error',
    syslog.LOG_WARNING: 'warning',
    syslog.LOG_INFO: 'info',
    syslog.LOG_DEBUG: 'debug',
    syslog.LOG_ALERT: 'alert',
    syslog.LOG_NOTICE: 'notice'
}


def _format_record_dict(record: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'logger': record.get('LOGGER', '<unknown>'),
        'level': record.get('PRIORITY'),
        'level_name': _SYSLOG_PRIORITY_TO_NAME.get(  # type: ignore
            record.get('PRIORITY'), '<unknown>'),
        'file': record.get('CODE_FILE', '<unknown>'),
        'line': record.get('CODE_LINE', '<unknown>'),
        'func': record.get('CODE_FUNC', '<unknown>'),
        'time': record.get(
            '__REALTIME_TIMESTAMP',
            datetime.datetime.fromtimestamp(0)).isoformat(),
        'boot': str(record.get('_BOOT_ID', '<unknown>')),
        'message': record.get('MESSAGE', '<unknown>')
    }


def _prep_for_json(records: Deque[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [_format_record_dict(rec) for rec in records]


async def _get_log_response(syslog_selector: str, record_count: int,
                            record_format: str) -> web.Response:
    records = await _get_records(syslog_selector, record_count)
    if record_format == 'json':
        return web.json_response(data=_prep_for_json(records))
    else:
        return web.Response(text=_format_text(records))


async def get_logs_by_id(request: web.Request) -> web.Response:
    """ Get logs from the robot.

    GET /logs/:syslog_identifier -> 200 OK, log contents in body

    This endpoint accepts the following (optional) query parameters:
    - ``format``: ``json`` or ``text`` (default: text). Controls log format.
    - ``records``: int. Count of records to limit the dump to. Default: 15000.
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
    opts = _get_options(request.query, 15000)
    return await _get_log_response(
        ident, opts['records'], opts['format'])


async def set_syslog_level(request: web.Request) -> web.Response:
    """
    Set the minimum level for which logs will be sent upstream via syslog-ng

    POST /settings/log_level/upstream {"log_level": str level, null} -> 200 OK

    Similar to :py:meth:`opentrons.server.endpoints.settings.set_log_level`,
    the level should be a python log level like "debug", "info", "warning", or
    "error". If it is null, sets the minimum log level to emergency which we
    do not log at since there's not really a matching level in python logging,
    which effectively disables log upstreaming.
    """
    try:
        body = await request.json()
    except json.JSONDecodeError:
        return web.json_respose(status=400,
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
    with open('/var/lib/syslog-ng/min-level', 'w') as ml:
        ml.write(syslog_level)
    proc = await asyncio.create_subprocess_exec(
        'syslog-ng-ctl', 'reload',
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    code = proc.returncode
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
