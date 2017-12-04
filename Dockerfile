# Use this for local development
# FROM resin/amd64-alpine-python:3.6-slim

# Use this for running on a robot
FROM resin/raspberrypi3-alpine-python:3.6-slim

ENV RUNNING_ON_PI 1
ENV DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
ENV PYTHONPATH $PYTHONPATH:/data/packages

RUN echo "export DBUS_SYSTEM_BUS_ADDRESS=$DBUS_SYSTEM_BUS_ADDRESS" >> /etc/profile && \
    echo "export PYTHONPATH=$PYTHONPATH" >> /etc/profile && \
    echo "export RUNNING_ON_PI=$RUNNING_ON_PI" >> /etc/profile

RUN apk add --update \
      dumb-init \
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

# Redirect nginx logs to stdout and stderr
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

COPY ./compute/alpine/opentrons.asc .
RUN gpg --import opentrons.asc && rm opentrons.asc

COPY ./compute/alpine/scripts/* /usr/local/bin/
COPY ./compute/scripts/* /usr/local/bin/

COPY ./compute/alpine/conf/inetd.conf /etc/inetd.conf

COPY ./compute/alpine/conf/nginx.conf /etc/nginx/nginx.conf
COPY ./compute/alpine/static /usr/share/nginx/html

# Updates, HTTPS (for future use), API, SSH for link-local over USB
EXPOSE 80 443 31950 50022

STOPSIGNAL SIGTERM

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["bash", "-c", "setup.sh && exec start.sh"]