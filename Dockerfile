# Use this for local development
# FROM resin/amd64-alpine:3.6

# Use this for running on a robot
FROM resin/raspberrypi3-alpine:3.6

# enable container init system.
ENV INITSYSTEM on
ENV RUNNING_ON_PI 1

ENV PYTHONPATH /data/packages/

RUN apk add --update \
      dropbear \
      avahi \
      gnupg \
      gcc \
      musl-dev \
      make \
      nginx \
      python3 \
      python3-dev \
      && rm -rf /var/cache/apk/*

COPY ./api /tmp/api
RUN pip3 install /tmp/api && \
    rm -rf /tmp/api && \
    apk del \
      gcc \
      musl-dev \
      make \
      python3-dev

RUN ln -s /usr/bin/python3 /usr/bin/python && \
    ln -s /usr/bin/pip3 /usr/bin/pip

COPY ./compute/alpine/opentrons.asc .
RUN gpg --import opentrons.asc && rm opentrons.asc

COPY ./compute/alpine/services/api /etc/init.d/
COPY ./compute/alpine/services/nginx /etc/init.d/
COPY ./compute/alpine/services/updates /etc/init.d/
COPY ./compute/alpine/services/networking /etc/init.d/
COPY ./compute/alpine/services/dropbear /etc/init.d/

COPY ./compute/alpine/services/avahi/api.service /etc/avahi/services/
RUN rm /etc/avahi/services/ssh.service

COPY ./compute/alpine/scripts/* /usr/local/bin/
COPY ./compute/scripts/announce_mdns.py /usr/local/bin/

RUN rc-update add api && \
    rc-update add nginx && \
    rc-update add updates && \
    rc-update add dropbear && \
    rc-update add avahi-daemon

COPY ./compute/alpine/conf/rc.conf /etc/rc.conf
COPY ./compute/alpine/conf/nginx.conf /etc/nginx/nginx.conf
COPY ./compute/alpine/conf/interfaces /etc/network/interfaces

COPY ./compute/alpine/static /usr/share/nginx/html

# Updates, HTTPS (for future use), API, SSH for link-local over USB
EXPOSE 80 443 31950 50022

STOPSIGNAL SIGTERM