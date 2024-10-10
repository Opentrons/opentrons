ARG PLATFORM=linux/amd64
FROM --platform=$PLATFORM python:3.12-slim

ENV PYTHONUNBUFFERED=True
ENV DOCKER_RUNNING=True

WORKDIR /code

ARG CACHEBUST=1

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./api /code/api

EXPOSE 8000

CMD ["ddtrace-run", "uvicorn", "api.handler.fast:app", "--proxy-headers",  "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "190", "--log-config", "/code/api/uvicorn_disable_logging.json", "--workers", "3"]
