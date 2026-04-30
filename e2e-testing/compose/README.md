# Compose and service harnesses

## Auth-server (HTTP component tests)

There is no minimal published Docker image for auth-server alone in this repo, so **pytest** starts the server with **`make -C ../../auth-server dev-no-reload`** (see `automation/auth_server_runner.py`). That uses the same `$(python)` toolchain as **`make -C auth-server dev`**, without uvicorn `--reload`.

To run the server manually while debugging:

```bash
cd ../../auth-server
uv run python -m auth_server -p 33950 --log-level debug
```

Then run tests with **`SKIP_AUTH_SERVER_START=true`** so pytest does not spawn a second process:

```bash
cd ..
SKIP_AUTH_SERVER_START=true make test-api-integration PYTEST_ARGS="-v"
```

Environment variables:

| Variable                 | Role                                                 |
| ------------------------ | ---------------------------------------------------- |
| `E2E_AUTH_SERVER_PORT`   | Listen port (default `33950`).                       |
| `SKIP_AUTH_SERVER_START` | If set to `true`, pytest expects an existing server. |

If something is already listening on the chosen port, pytest **reuses** that process and its database. A dev server that previously enabled access control will then report `accessControlEnabled: true` on GET. For a clean AC state, stop that process or use another port so the runner spawns a child with a fresh temp persistence directory.
