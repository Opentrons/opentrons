# This is a mitmproxy addon to route requests to the appropriate Opentrons dev server,
# based on the request's HTTP path.

# These should match the dev server ports in robot-server/Makefile, system-server/Makefile, etc.
ROBOT_SERVER_PORT = 31951
SYSTEM_SERVER_PORT = 32950
UPDATE_SERVER_PORT = 34000
AUTH_SERVER_PORT = 33950
KEY_SERVER_PORT = 33960
AUDIT_SERVER_PORT = 33970


def request(flow) -> None:
    path = flow.request.path

    # This routing logic should match how nginx is configured on real robots.
    if path.startswith("/system"):
        flow.request.port = SYSTEM_SERVER_PORT
        if path.startswith("/system/time"):
            flow.request.port = ROBOT_SERVER_PORT
    elif path.startswith("/server"):
        flow.request.port = UPDATE_SERVER_PORT
    elif path.startswith("/auth"):
        flow.request.port = AUTH_SERVER_PORT
    elif path.startswith("/keys/external"):
        flow.request.port = KEY_SERVER_PORT
    elif path.startswith("/audit/external"):
        flow.request.port = AUDIT_SERVER_PORT
    else:
        flow.request.port = ROBOT_SERVER_PORT
