# Use this for local development
# FROM resin/amd64-alpine-python:3.6-slim

# Use this for running on a robot
FROM resin/raspberrypi3-alpine-python:3.6-slim

# enable container init system.
ENV INITSYSTEM on
ENV RUNNING_ON_PI 1
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
ENV PYTHONPATH $PYTHONPATH:/data/packages

RUN echo 'export DBUS_SYSTEM_BUS_ADDRESS=$DBUS_SYSTEM_BUS_ADDRESS' >> /etc/profile && \
    echo 'export PYTHONPATH=$PYTHONPATH' >> /etc/profile && \
    echo 'export RUNNING_ON_PI=$RUNNING_ON_PI' >> /etc/profile

RUN apk add --update \
      dropbear \
      gnupg \
      nginx \
      networkmanager \
      py3-urwid \
      py3-numpy \
      && rm -rf /var/cache/apk/*

RUN cp -r /usr/lib/python3.6/site-packages /usr/local/lib/python3.6/ && \
    rm -rf /usr/lib/python3.6

COPY ./api /tmp/api
COPY ./compute/alpine/avahi_tools /tmp/avahi_tools
RUN pip install /tmp/api && \
    pip install /tmp/avahi_tools && \
    rm -rf /tmp/api && \
    rm -rf /tmp/avahi_tools

COPY ./compute/alpine/opentrons.asc .
RUN gpg --import opentrons.asc && rm opentrons.asc

COPY ./compute/alpine/services/api /etc/init.d/
COPY ./compute/alpine/services/nginx /etc/init.d/
COPY ./compute/alpine/services/updates /etc/init.d/
COPY ./compute/alpine/services/networking /etc/init.d/
COPY ./compute/alpine/services/dropbear /etc/init.d/

COPY ./compute/alpine/scripts/* /usr/local/bin/
COPY ./compute/scripts/announce_mdns.py /usr/local/bin/

RUN rc-update add api && \
    rc-update add nginx && \
    rc-update add updates && \
    rc-update add dropbear

COPY ./compute/alpine/conf/rc.conf /etc/rc.conf
COPY ./compute/alpine/conf/nginx.conf /etc/nginx/nginx.conf
COPY ./compute/alpine/conf/interfaces /etc/network/interfaces

COPY ./compute/alpine/static /usr/share/nginx/html

# Updates, HTTPS (for future use), API, SSH for link-local over USB
EXPOSE 80 443 31950 50022

STOPSIGNAL SIGTERM