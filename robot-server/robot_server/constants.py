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

# Allow-list for routes that are not subject to versioning requirements
# TODO(mc, 2020-11-05): allow routes to opt-in to versionsing and request +
# response migrations via decorator. Puting an allow-list in place for now
# because allowing an endpoint to bypass versioning requirements in the future
# is not a breaking change
# These will be compiled into a regex and checked with regex.match(), so you
# can use regex syntax
NON_VERSIONED_ROUTES = {
    # keep the root RPC WebSocket path unversioned because browsers cannot
    # specify headers for WebSocket client requests
    "/",
    # keep documentation endpoints unversioned
    "/openapi.json",
    "/docs",
    "/redoc",
    "/logs/.*"
}


# Tag applied to legacy api endpoints
V1_TAG = "v1"
