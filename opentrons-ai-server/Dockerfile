FROM --platform=linux/amd64 python:3.12-slim

ENV PYTHONUNBUFFERED True
ENV DOCKER_RUNNING True

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./api /code/api

EXPOSE 8000

CMD ["ddtrace-run", "uvicorn", "api.handler.fast:app", "--proxy-headers",  "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "190", "--workers", "3"]
