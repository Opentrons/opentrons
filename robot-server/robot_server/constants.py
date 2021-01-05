# This is the version of the HTTP API used by the server.  This value should
# be incremented anytime the schema of a request or response is changed. This
# value is different and separate from the application version.
API_VERSION = 2

# Minimum API version supported by the server. Increasing this value should
# be considered a **breaking change** in the application.
MIN_API_VERSION = 2

# Keyword header value for a client to ask to use the latest HTTP API version.
API_VERSION_LATEST = "*"

# Header identifying maximum acceptable version in request and actual version
# used to create response. Mandatory in requests and responses.
API_VERSION_HEADER = "Opentrons-Version"

# Response header specifing minimum acceptable API version
MIN_API_VERSION_HEADER = "Opentrons-Min-Version"


# Tag applied to legacy api endpoints
V1_TAG = "v1"
