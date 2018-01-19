# Use this for local development on intel machines
# FROM resin/amd64-alpine-python:3.6-slim

# Use this for running on a robot
FROM resin/raspberrypi3-alpine-python:3.6-slim

# TODO (artyom, 20171205): remove this and set all relevant environment
# variables (such as APP_DATA_DIR) explicitly
ENV RUNNING_ON_PI=1
# This is used by D-Bus clients such as Network Manager cli, announce_mdns
# connecting to Host OS services
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
# Add persisted data directory where new python packages are being installed
ENV PYTHONPATH=$PYTHONPATH:/data/packages/usr/local/lib/python3.6/site-packages
# Port name for connecting to smoothie over serial, i.e. /dev/ttyAMA0
ENV OT_SMOOTHIE_ID=AMA
ENV OT_SERVER_PORT=31950
# File path to unix socket API server is listening
ENV OT_SERVER_UNIX_SOCKET_PATH=/tmp/aiohttp.sock

# Static IPv6 used on Ethernet interface for USB connectivity
ENV ETHERNET_STATIC_IP=fd00:0000:cafe:fefe::1
ENV ETHERNET_NETWORK_PREFIX=fd00:0000:cafe:fefe::
ENV ETHERNET_NETWORK_PREFIX_LENGTH=64

# Some shells are not inheriting environment variables from PID 1
# so we are setting them explicitly
RUN echo "export DBUS_SYSTEM_BUS_ADDRESS=$DBUS_SYSTEM_BUS_ADDRESS" >> /etc/profile && \
    echo "export PYTHONPATH=$PYTHONPATH" >> /etc/profile && \
    echo "export RUNNING_ON_PI=$RUNNING_ON_PI" >> /etc/profile && \
    echo "export OT_SMOOTHIE_ID=$OT_SMOOTHIE_ID" >> /etc/profile

# See compute/README.md for details. Make sure to keep them in sync
RUN apk add --update \
      util-linux \
      dumb-init \
      vim \
      radvd \
      dropbear \
      dropbear-scp \
      gnupg \
      nginx \
      networkmanager \
      py3-urwid \
      py3-numpy \
      && rm -rf /var/cache/apk/*

# Resin's python base container compiles python from scratch and doesn't have
# it installed as apk package. This results in py3- dependencies installing
# python3 package without being able to remove it (because py3- depend on it).
# To avoid ambiguity, we are copying all installed dependencies into original
# site-packages and cleaning up the one created by python3 package.
RUN cp -r /usr/lib/python3.6/site-packages /usr/local/lib/python3.6/ && \
    rm -rf /usr/lib/python3.6

COPY ./api /tmp/api
COPY ./compute/avahi_tools /tmp/avahi_tools

# When adding more python packages make sure to use setuptools to keep
# packaging consistent across environments
ENV PIPENV_VENV_IN_PROJECT=true
RUN pip install pipenv && \
    pipenv install /tmp/api --system && \
    pip install /tmp/avahi_tools && \
    rm -rf /tmp/api && \
    rm -rf /tmp/avahi_tools

# Redirect nginx logs to stdout and stderr
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# GPG public key to verify signed packages
COPY ./compute/opentrons.asc .
RUN gpg --import opentrons.asc && rm opentrons.asc

# Everything you want in /usr/local/bin goes into compute/scripts
COPY ./compute/scripts/* /usr/local/bin/

# All configuration files live in compute/etc and dispatched here
COPY ./compute/conf/radvd.conf /etc/
COPY ./compute/conf/inetd.conf /etc/
COPY ./compute/conf/nginx.conf /etc/nginx/nginx.conf
COPY ./compute/static /usr/share/nginx/html

# Logo for login shell
COPY ./compute/opentrons.motd /etc/motd

# Replace placeholders with actual environment variable values
RUN sed -i "s/{ETHERNET_NETWORK_PREFIX}/$ETHERNET_NETWORK_PREFIX/g" /etc/radvd.conf && \
    sed -i "s/{ETHERNET_NETWORK_PREFIX_LENGTH}/$ETHERNET_NETWORK_PREFIX_LENGTH/g" /etc/radvd.conf && \
    sed -i "s/{OT_SERVER_PORT}/$OT_SERVER_PORT/g" /etc/nginx/nginx.conf && \
    sed -i "s#{OT_SERVER_UNIX_SOCKET_PATH}#$OT_SERVER_UNIX_SOCKET_PATH#g" /etc/nginx/nginx.conf

# All newly installed packages will go to persistent storage
ENV PIP_ROOT /data/packages
RUN echo "export PIP_ROOT=$PIP_ROOT" >> /etc/profile

# Generate keys for dropbear
RUN ssh_key_gen.sh

# Generate the id that we will later check to see if that's the
# new container and that local Opentrons API package should be deleted
RUN echo "export CONTAINER_ID=$(uuidgen)" >> /etc/profile

# Updates, HTTPS (for future use), API, SSH for link-local over USB
EXPOSE 80 443 31950

STOPSIGNAL SIGTERM

# dumb-init is a simple process supervisor and init system designed to
# run as PID 1 inside minimal container environments (such as Docker).
# It is deployed as a small, statically-linked binary written in C.
#
# We are using it to bootstrap setup.sh for configuration and start.sh
# for running all the services, redirecting child process output to
# PID 1 stdout
#
# More: https://github.com/Yelp/dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# For interactive one-off use:
#   docker run --name opentrons -it opentrons /bin/sh
# or uncomment:
# CMD ["python", "-c", "while True: pass"]
CMD ["bash", "-c", "source /etc/profile && setup.sh && exec start.sh"]
