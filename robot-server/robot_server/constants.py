"""Global constants for the HTTP API server."""

# This is the version of the HTTP API used by the server.  This value should
# be incremented anytime the schema of a request or response is changed. This
# value is different and separate from the application version.
from typing_extensions import Literal, Final

API_VERSION: Final = 2

# Minimum API version supported by the server. Increasing this value should
# be considered a **breaking change** in the application.
MIN_API_VERSION: Final = 2

# Keyword header value for a client to ask to use the latest HTTP API version.
API_VERSION_LATEST_TYPE = Literal["*"]
API_VERSION_LATEST: API_VERSION_LATEST_TYPE = "*"

# Header identifying maximum acceptable version in request and actual version
# used to create response. Mandatory in requests and responses.
API_VERSION_HEADER: Final = "Opentrons-Version"

# Response header specifing minimum acceptable API version
MIN_API_VERSION_HEADER: Final = "Opentrons-Min-Version"


# Tag applied to legacy api endpoints
V1_TAG = "v1"
