ARG PLATFORM=linux/amd64

# uv 0.12.1 multi-arch index. Keep this in sync with required-version
# in [tool.uv] and the repo-root uv.toml. Used only in the dependency stage.
FROM --platform=$PLATFORM ghcr.io/astral-sh/uv:0.12.1@sha256:cf4eedcaa81655197f625739489effcbe71b61ceb1506f332c3facae5deceded AS uv

# python:3.12-slim multi-arch index, pinned 2026-09-29.
FROM --platform=$PLATFORM python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f AS deps

COPY --from=uv /uv /usr/local/bin/uv

WORKDIR /code

# Lock inputs only, so application edits do not rebuild the dependency layer.
COPY opentrons-ai-server/pyproject.toml opentrons-ai-server/uv.lock ./

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never

# --frozen installs the locked distributions and their recorded hashes.
# --no-install-project leaves the application source out of the venv; the runtime stage copies it.
RUN uv sync --frozen --no-dev --no-install-project

FROM --platform=$PLATFORM python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f

ENV PYTHONUNBUFFERED=True \
    DOCKER_RUNNING=True \
    PATH="/code/.venv/bin:$PATH"

WORKDIR /code

COPY --from=deps /code/.venv /code/.venv
COPY opentrons-ai-server/api /code/api

EXPOSE 8000

CMD ["uvicorn", "api.handler.fast:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "190", "--log-config", "/code/api/uvicorn_disable_logging.json", "--workers", "3"]
