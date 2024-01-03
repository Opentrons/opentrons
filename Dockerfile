FROM ubuntu as base
ENV TZ=Etc/UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get update && apt-get install --yes python3 pip pkg-config libsystemd-dev

FROM base as builder
COPY scripts scripts
COPY LICENSE LICENSE

COPY shared-data shared-data

COPY api/MANIFEST.in api/MANIFEST.in
COPY api/setup.py api/setup.py
COPY api/pypi-readme.rst api/pypi-readme.rst
COPY api/src/opentrons api/src/opentrons

COPY robot-server/setup.py robot-server/setup.py
COPY robot-server/robot_server robot-server/robot_server

RUN cd shared-data/python && python3 setup.py bdist_wheel -d /dist/
RUN cd api && python3 setup.py bdist_wheel -d /dist/
RUN cd robot-server && python3 setup.py bdist_wheel -d /dist/

FROM base
COPY --from=builder /dist /dist
RUN pip install /dist/*
