ARG PLATFORM=linux/amd64
# Digest is the 3.12-slim multi-arch index, pinned 2026-09-29.
# linux/amd64 image within that index: sha256:44ff437bba879d4941b710a369a8f19266aea34b29002807f0c487fabc9eec9b
FROM --platform=$PLATFORM python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f

ENV PYTHONUNBUFFERED=True
ENV DOCKER_RUNNING=True

WORKDIR /code

ARG CACHEBUST=1

COPY opentrons-ai-server/requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY opentrons-ai-server/api /code/api

EXPOSE 8000

CMD ["uvicorn", "api.handler.fast:app", "--proxy-headers",  "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "190", "--log-config", "/code/api/uvicorn_disable_logging.json", "--workers", "3"]
