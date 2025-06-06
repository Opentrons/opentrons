FROM ubuntu as base
ENV TZ=Etc/UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get update && apt-get install --yes python3 pip pkg-config libsystemd-dev git

FROM base as builder
COPY scripts scripts
COPY LICENSE LICENSE

COPY shared-data shared-data

COPY server-utils server-utils

COPY api api

COPY robot-server robot-server

RUN cd shared-data && python3 -m build --outdir=/dist/ --wheel .
RUN cd server-utils && python3 -m build --outdir=/dist/ --wheel .
RUN cd api && python3 -m build --outdir=/dist/ --wheel .
RUN cd robot-server && python3 -m build --outdir=/dist/ --wheel .

FROM base
COPY --from=builder /dist /dist
RUN pip install /dist/*
