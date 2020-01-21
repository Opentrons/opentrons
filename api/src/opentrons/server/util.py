import functools
from aiohttp import helpers, web

from opentrons.protocols.types import APIVersion

SUPPORTED_VERSIONS = [APIVersion(1, 0), APIVersion(2, 0)]
DEFAULT_VERSION = APIVersion(1, 0)

ERROR_CODES = {
    'unsupportedVersion': 1,
    'HTTPNotFound': 2
}


class HTTPVersionMismatchError(Exception):
    def __init__(self, message, versions):
        Exception.__init__(self, message)
        self.dErrorArguments = versions
        self.message = message

def determine_requested_version(request):
    headers = getattr(request, 'headers', {})
    accept_header = headers.get('accept', '')
    if accept_header:
        # Use aiohttp helper to parse MIME type header into 4 element tuple
        # see for further info: https://aiohttp.readthedocs.io/en/v0.18.2/api.html#aiohttp.helpers.parse_mimetype  # noqa(E501)
        params = helpers.parse_mimetype(accept_header).parameters
        version = params.get('version', '1')
        # major, minor = version.split('.')
        return version
    else:
        return 1

def http_version(major: int, minor: int):
    expected_version = APIVersion(major, minor)

    def _http_version_check(handler):
        @functools.wraps(handler)
        async def _valid_version(*args, **kwargs):
            header_version = determine_requested_version(args[0])
            if header_version > expected_version:
                error_msg =\
                    """
                    Client Requested Version {h}, but the
                    endpoint requested only supports Max Version {e}
                    """.format(h=header_version, e=expected_version)
                raise HTTPVersionMismatchError(
                    error_msg,
                    {'header_version': header_version,
                     'expected_version': expected_version})
            elif header_version < expected_version:
                raise web.HTTPNotFound
            else:
                response = await handler(*args, **kwargs)
                response.headers['X-Opentrons-Media-Type'] =\
                    f'opentrons.api.{expected_version}'
                return response
        return _valid_version
    return _http_version_check
