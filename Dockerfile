# Use this for local development
# FROM resin/amd64-alpine-python:3.6-slim

# Use this for running on a robot
FROM resin/raspberrypi3-alpine-python:3.6-slim

ENV RUNNING_ON_PI=1
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
ENV PYTHONPATH=$PYTHONPATH:/data/packages/usr/local/lib/python3.6/site-packages
#port name for connecting to smoothie over serial
ENV OT_SMOOTHIE_ID=AMA
ENV OT_SERVER_PORT=31950

RUN echo "export DBUS_SYSTEM_BUS_ADDRESS=$DBUS_SYSTEM_BUS_ADDRESS" >> /etc/profile && \
    echo "export PYTHONPATH=$PYTHONPATH" >> /etc/profile && \
    echo "export RUNNING_ON_PI=$RUNNING_ON_PI" >> /etc/profile && \
    echo "export OT_SMOOTHIE_ID=AMA=$OT_SMOOTHIE_ID=AMA" >> /etc/profile

RUN apk add --update \
      avahi-tools \
      dumb-init \
      radvd \
      dropbear \
      dropbear-scp \
      gnupg \
      nginx \
      networkmanager \
      py3-urwid \
      py3-numpy \
      && rm -rf /var/cache/apk/*

RUN cp -r /usr/lib/python3.6/site-packages /usr/local/lib/python3.6/ && \
    rm -rf /usr/lib/python3.6

COPY ./api /tmp/api
COPY ./compute/avahi_tools /tmp/avahi_tools
RUN pip install /tmp/api && \
    pip install /tmp/avahi_tools && \
    rm -rf /tmp/api && \
    rm -rf /tmp/avahi_tools

# Redirect nginx logs to stdout and stderr
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

COPY ./compute/opentrons.asc .
RUN gpg --import opentrons.asc && rm opentrons.asc

COPY ./compute/scripts/* /usr/local/bin/

COPY ./compute/conf/radvd.conf /etc/
COPY ./compute/conf/inetd.conf /etc/

COPY ./compute/conf/nginx.conf /etc/nginx/nginx.conf
COPY ./compute/static /usr/share/nginx/html

# All newly installed packages will go to persistent storage
ENV PIP_ROOT /data/packages
RUN echo "export PIP_ROOT=$PIP_ROOT" >> /etc/profile

# Updates, HTTPS (for future use), API, SSH for link-local over USB
EXPOSE 80 443 31950 50022

STOPSIGNAL SIGTERM

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["bash", "-c", "setup.sh && exec start.sh"]