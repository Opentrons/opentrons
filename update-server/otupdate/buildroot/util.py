from aiohttp import helpers, web

MAX_VERSION = 1
SUPPORTED_VERSIONS = range(1, MAX_VERSION+1)


def determine_requested_version(request: web.Request) -> int:
    headers = getattr(request, 'headers', {})
    accept_header = headers.get('accept', '')
    # Use aiohttp helper to parse MIME type header into 4 element tuple
    # see for further info: https://aiohttp.readthedocs.io/en/v0.18.2/api.html#aiohttp.helpers.parse_mimetype  # noqa(E501)
    params = helpers.parse_mimetype(accept_header).parameters
    version = params.get('version', MAX_VERSION)
    return int(version)
