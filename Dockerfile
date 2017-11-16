FROM resin/amd64-alpine:3.6
# enable container init system.
ENV INITSYSTEM on

RUN apk add --update \
  gcc \
  musl-dev \
  openssl \
  make \
  nginx \
  python3 \
  python3-dev \
  dhcp \
  && rm -rf /var/cache/apk/*

RUN ln -s /usr/bin/python3 /usr/bin/python && \
    ln -s /usr/bin/pip3 /usr/bin/pip

COPY ./api /tmp/api
RUN pip install /tmp/api && \
    rm -rf /tmp/api && \
    apk del \
      gcc \
      musl-dev \
      make \
      python3-dev

# copy api and nginx init scripts
COPY ./compute/alpine/api-init /etc/init.d/api
COPY ./compute/alpine/nginx-init /etc/init.d/nginx
# RUN rc-update add api && \
#     rc-update add nginx && \
#     ln -sf /dev/stdout /var/log/nginx/access.log && \
#     ln -sf /dev/stderr /var/log/nginx/error.log

COPY ./compute/alpine/rc.conf /etc/rc.conf

# Nginx configs
COPY ./compute/alpine/nginx.conf /etc/nginx/nginx.conf
COPY ./compute/alpine/static /usr/share/nginx/html

EXPOSE 80 443 31950

STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]