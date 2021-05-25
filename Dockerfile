FROM ubuntu as builder
RUN apt-get update && apt-get install -y python3 pip

COPY scripts scripts
COPY LICENSE LICENSE
COPY shared-data shared-data
COPY api api
COPY notify-server notify-server
COPY robot-server robot-server
# COPY update-server update-server

# RUN python3 shared-data/python/setup.py bdist_wheel
# RUN cd api && python3 setup.py bdist_wheel -d /dist/
# RUN python3 notify-server/setup.py bdist_wheel
# RUN python3 robot-server/setup.py bdist_wheel

# RUN python3 update-server/setup.py bdist_wheel


RUN pip install -e shared-data/python
RUN pip install -e api
RUN pip install -e notify-server
RUN pip install -e robot-server
