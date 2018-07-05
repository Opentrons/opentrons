# Use this for local development on intel machines
# FROM resin/amd64-alpine-python:3.6-slim-20180123

# Use this for running on a robot
FROM resin/raspberrypi3-alpine-python:3.6-slim-20180120

ENV RUNNING_ON_PI=1
# This is used by D-Bus clients such as Network Manager cli, announce_mdns
# connecting to Host OS services
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
# Add persisted data directory where new python packages are being installed
ENV PYTHONPATH=$PYTHONPATH/data/packages/usr/local/lib/python3.6/site-packages
ENV PATH=$PATH:/data/packages/usr/local/bin
# Port name for connecting to smoothie over serial, i.e. /dev/ttyAMA0
ENV OT_SMOOTHIE_ID=AMA
ENV OT_SERVER_PORT=31950
ENV OT_UPDATE_PORT=34000
# File path to unix socket API server is listening
ENV OT_SERVER_UNIX_SOCKET_PATH=/tmp/aiohttp.sock

# Static IPv6 used on Ethernet interface for USB connectivity
ENV ETHERNET_STATIC_IP=fd00:0000:cafe:fefe::1
ENV ETHERNET_NETWORK_PREFIX=fd00:0000:cafe:fefe::
ENV ETHERNET_NETWORK_PREFIX_LENGTH=64

# See compute/README.md for details. Make sure to keep them in sync
RUN apk add --update \
      util-linux \
      vim \
      radvd \
      dropbear \
      dropbear-scp \
      gnupg \
      nginx \
      libstdc++ \
      g++ \
      networkmanager \
      py3-zmq \
      py3-urwid \
      py3-numpy \
      avrdude \
      ffmpeg \
      mpg123 \
      && rm -rf /var/cache/apk/*

# Resin's python base container compiles python from scratch and doesn't have
# it installed as apk package. This results in py3- dependencies installing
# python3 package without being able to remove it (because py3- depend on it).
# To avoid ambiguity, we are copying all installed dependencies into original
# site-packages and cleaning up the one created by python3 package.
RUN cp -r /usr/lib/python3.6/site-packages /usr/local/lib/python3.6/ && \
    rm -rf /usr/lib/python3.6
RUN pip install --force-reinstall \
    pipenv==9.0.3 \
    jupyter==1.0.0 \
    tornado==4.5.1 \
    pyzmq==16.0.2

# Copy server files and data into the container. Note: any directories that
# you wish to copy into the container must be excluded from the .dockerignore
# file, or you will encounter a copy error
ENV LABWARE_DEF /etc/labware
ENV AUDIO_FILES /etc/audio
ENV USER_DEFN_ROOT /data/user_storage/opentrons_data/labware
COPY ./shared-data/robot-data /etc/robot-data
COPY ./compute/conf/jupyter_notebook_config.py /root/.jupyter/
COPY ./shared-data/definitions /etc/labware
COPY ./audio/ /etc/audio
COPY ./api /tmp/api
COPY ./api-server-lib /tmp/api-server-lib
COPY ./update-server /tmp/update-server
COPY ./compute/avahi_tools /tmp/avahi_tools

# When adding more python packages make sure to use setuptools to keep
# packaging consistent across environments
ENV PIPENV_VENV_IN_PROJECT=true
RUN pipenv install /tmp/api-server-lib --system && \
    pipenv install /tmp/api --system && \
    pipenv install /tmp/update-server --system && \
    pip install /tmp/avahi_tools && \
    rm -rf /tmp/api && \
    rm -rf /tmp/api-server-lib && \
    rm -rf /tmp/update-server && \
    rm -rf /tmp/avahi_tools

# Redirect nginx logs to stdout and stderr
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# Use udev rules file from opentrons_data
RUN ln -sf /data/user_storage/opentrons_data/95-opentrons-modules.rules /etc/udev/rules.d/95-opentrons-modules.rules

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

# Generate keys for dropbear
RUN ssh_key_gen.sh

# Generate the id that we will later check to see if that's the
# new container and that local Opentrons API package should be deleted
# and persist all environment variables from the docker definition,
# because they are sometimes not picked up from PID 1
RUN echo "export CONTAINER_ID=$(uuidgen)" >> /etc/profile && \
    echo "export ETHERNET_STATIC_IP=$ETHERNET_STATIC_IP" >> /etc/profile && \
    echo "export OT_SETTINGS_DIR=$OT_SETTINGS_DIR" >> /etc/profile && \
    echo "export OT_SERVER_PORT=$OT_SERVER_PORT" >> /etc/profile && \
    echo "export OT_SERVER_UNIX_SOCKET_PATH=$OT_SERVER_UNIX_SOCKET_PATH" >> /etc/profile && \
    echo "export PIP_ROOT=$PIP_ROOT" >> /etc/profile && \
    echo "export LABWARE_DEF=$LABWARE_DEF" >> /etc/profile && \
    echo "export USER_DEFN_ROOT=$USER_DEFN_ROOT" >> /etc/profile && \
    echo "export AUDIO_FILES=$AUDIO_FILES" >> /etc/profile && \
    echo "export PIPENV_VENV_IN_PROJECT=$PIPENV_VENV_IN_PROJECT" >> /etc/profile && \
    echo "export DBUS_SYSTEM_BUS_ADDRESS=$DBUS_SYSTEM_BUS_ADDRESS" >> /etc/profile && \
    echo "export PYTHONPATH=$PYTHONPATH" >> /etc/profile && \
    echo "export PATH=$PATH" >> /etc/profile && \
    echo "export RUNNING_ON_PI=$RUNNING_ON_PI" >> /etc/profile && \
    echo "export OT_SMOOTHIE_ID=$OT_SMOOTHIE_ID" >> /etc/profile

# Updates, HTTPS (for future use), API, SSH for link-local over USB
EXPOSE 80 443 31950

STOPSIGNAL SIGTERM

# For backward compatibility, udev is enabled by default
ENV UDEV on

# For interactive one-off use:
#   docker run --name opentrons -it opentrons /bin/sh
# or uncomment:
# CMD ["python", "-c", "while True: pass"]
CMD ["bash", "-c", "source /etc/profile && setup.sh && exec start.sh"]

# Using Resin base image's default entrypoint and init system- tini
