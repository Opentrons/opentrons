import asyncio
import collections
import datetime
import json
import logging
import syslog
from typing import Any, Deque, Dict, List

from aiohttp import web
import systemd.journal as journal


LOG = logging.getLogger(__name__)

MAX_RECORDS = 1000000


async def _get_options(request: web.Request,
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
    try:
        body = await request.json()
    except json.JSONDecodeError:
        LOG.exception("Bad request format to logs.get_options")
        return response

    if 'format' in body:
        if body['format'] not in ('text', 'json'):
            LOG.error(f"Bad log format requested: {body['format']}")
        else:
            response['format'] = body['format']

    if 'records' in body:
        try:
            records = int(body['records'])
            if records <= 0 or records > MAX_RECORDS:
                raise ValueError(records)
        except (ValueError, TypeError):
            LOG.exception(f"Bad records count requested: {body['records']}")
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


async def get_serial_log(request: web.Request) -> web.Response:
    """ Get the robot serial log.

    GET /logs/api.log -> 200 OK, log contents in body

    Optionally, the request body can be json with any of the following keys:
    - ``'format'``: ``'json'`` or ``'text'`` (default: text). Controls log
      format.
    - ``records``: int. Count of records to limit the dump to.
      Default: 40000. Limit: 1000000
    """
    opts = await _get_options(request, 40000)
    return await _get_log_response(
        'opentrons-api-serial', opts['records'], opts['format'])


async def get_api_log(request: web.Request) -> web.Response:
    """ Get the robot API log.

    GET /logs/api.log -> 200 OK, log contents in body

    Optionally, the request body can be json with any of the following keys:
    - ``'format'``: ``'json'`` or ``'text'`` (default: text). Controls log
      format.
    - ``records``: int. Count of records to limit the dump to. Default: 15000.
      Limit: 1000000
    """
    opts = await _get_options(request, 15000)
    return await _get_log_response(
        'opentrons-api', opts['records'], opts['format'])
