FROM ubuntu as base
RUN apt-get update && apt-get install -y python3 pip

FROM base as builder
COPY scripts scripts
COPY LICENSE LICENSE

COPY shared-data shared-data

COPY api/MANIFEST.in api/MANIFEST.in
COPY api/setup.py api/setup.py
COPY api/pypi-readme.rst api/pypi-readme.rst
COPY api/src/opentrons api/src/opentrons

COPY notify-server/setup.py notify-server/setup.py
COPY notify-server/README.rst notify-server/README.rst
COPY notify-server/notify_server notify-server/notify_server

COPY robot-server/setup.py robot-server/setup.py
COPY robot-server/robot_server robot-server/robot_server

RUN cd shared-data/python && python3 setup.py bdist_wheel -d /dist/
RUN cd api && python3 setup.py bdist_wheel -d /dist/
RUN cd notify-server && python3 setup.py bdist_wheel -d /dist/
RUN cd robot-server && python3 setup.py bdist_wheel -d /dist/

FROM base
COPY --from=builder /dist /dist
RUN pip install /dist/*