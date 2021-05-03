"""Global constants for the HTTP API server."""

from typing_extensions import Literal, Final

API_VERSION: Final = 2
"""The current version of the HTTP API used by the server.

This value will be incremented any time the schema of a request or response
is changed. The value is separate from the overall application version.
"""


MIN_API_VERSION: Final = 2
"""The minimum HTTP API version supported by the server.

Incrementing this value would be considered a breaking change to the overall
application, and would result in a major version bump of the software.
"""


API_VERSION_HEADER: Final = "Opentrons-Version"
"""Custom header to specify which HTTP API version is being requested or served.

Mandatory in requests and response. Can be used by the server and clients to
negotiate and migrate requests and responses to a version both parties understand.
"""


MIN_API_VERSION_HEADER: Final = "Opentrons-Min-Version"
"""Header to specify the server's minumum supported HTTP API version.

Mandatory in all responses, not used in requests.
"""


API_VERSION_LATEST_TYPE = Literal["*"]

API_VERSION_LATEST: API_VERSION_LATEST_TYPE = "*"
"""Version head value meaning 'give me the latest avilable version'"""


V1_TAG = "v1"
"""Tag applied to legacy endpoints that are still supported in HTTP API v2."""
