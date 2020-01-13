import functools
from aiohttp import helpers

from opentrons.protocols.types import APIVersion


class HTTPVersionMismatchError(Exception):
    def __init__(self, message, versions):
        Exception.__init__(self, message)
        self.dErrorArguments = versions


def determine_requested_version(request):
    accept_header = request.headers.get('accept', '')
    if accept_header:
        # Use aiohttp helper to parse MIME type header into 4 element tuple
        # see for further info: https://aiohttp.readthedocs.io/en/v0.18.2/api.html#aiohttp.helpers.parse_mimetype  # noqa(E501)
        params = helpers.parse_mimetype(accept_header).parameters
        version = params.get('version', '0.0')
        major, minor = version.split('.')
        return APIVersion(int(major), int(minor))
    else:
        return APIVersion(0, 0)


def http_version(major: int, minor: int):
    expected_version = APIVersion(major, minor)

    def _http_version_check(handler):
        @functools.wraps(handler)
        async def _valid_version(*args, **kwargs):
            header_version = determine_requested_version(args[0])
            if header_version != expected_version:
                error_msg =\
                    """
                    Client Requested Server Version {h}, but the
                    endpoint requested only supports Version {e}
                    """.format(h=header_version, e=expected_version)
                raise HTTPVersionMismatchError(
                    error_msg,
                    {'header_version': header_version,
                     'expected_version': expected_version})
            else:
                return await handler(*args, **kwargs)
        return _valid_version
    return _http_version_check
