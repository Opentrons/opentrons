FROM ubuntu as base
RUN apt-get update && apt-get install -y python3 pip

FROM base as builder
COPY scripts scripts
COPY LICENSE LICENSE
COPY shared-data shared-data
COPY api api
COPY notify-server notify-server
COPY robot-server robot-server

RUN cd shared-data/python && python3 setup.py bdist_wheel -d /dist/
RUN cd api && python3 setup.py bdist_wheel -d /dist/
RUN cd notify-server && python3 setup.py bdist_wheel -d /dist/
RUN cd robot-server && python3 setup.py bdist_wheel -d /dist/

FROM base
COPY --from=builder /dist /dist
RUN pip install /dist/*