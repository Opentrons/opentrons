ARG base_image=resin/raspberrypi3-alpine-python:3.6-slim-20180120
# Use this for local development on intel machines
# FROM resin/amd64-alpine-python:3.6-slim-20180123


# Use this for running on a robot
FROM $base_image

# See compute/README.md for details. Make sure to keep them in sync
RUN apk add --update \
      util-linux \
      vim \
      dropbear \
      dropbear-scp \
      gnupg \
      openjdk8 \
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

COPY ./compute/container_setup.sh /usr/local/bin/container_setup.sh

COPY ./shared-data/robot-data /etc/robot-data
COPY ./shared-data/definitions /etc/labware
COPY ./api /tmp/api
# Make our shared data available for the api setup.py
COPY ./shared-data /tmp/shared-data
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
    rm -rf /tmp/shared-data && \
    rm -rf /tmp/avahi_tools

# Redirect nginx logs to stdout and stderr
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

# Use udev rules file from opentrons_data
RUN ln -sf /data/user_storage/opentrons_data/95-opentrons-modules.rules /etc/udev/rules.d/95-opentrons-modules.rules

# Logo for login shell
COPY ./compute/opentrons.motd /etc/motd

# Generate keys for dropbear
COPY ./compute/ssh_key_gen.sh /tmp/
RUN /tmp/ssh_key_gen.sh

# Updates, HTTPS (for future use), API, SSH for link-local over USB
EXPOSE 80 443 31950

STOPSIGNAL SIGTERM

# For backward compatibility, udev is enabled by default
ENV UDEV on

RUN echo "export CONTAINER_ID=$(uuidgen)" | tee -a /etc/profile.d/opentrons.sh

# The one link we have to make in the dockerfile still to make sure we get our
# environment variables
COPY ./compute/find_python_module_path.py /usr/local/bin/
RUN ln -sf /data/system/ot-environ.sh /etc/profile.d/00-persistent-ot-environ.sh &&\
    ln -sf `find_python_module_path.py opentrons`/resources/ot-environ.sh /etc/profile.d/01-builtin-ot-environ.sh


# This configuration is used both by both the build and runtime so it has to
# be here. When building a container for local use, set this to 0. If set to
# 0, ENABLE_VIRTUAL_SMOOTHIE will be set at runtime automatically
ARG running_on_pi=1
ENV RUNNING_ON_PI=$running_on_pi

ARG data_mkdir_path_slash_if_none=/
RUN mkdir -p $data_mkdir_path_slash_if_none

# For interactive one-off use:
#   docker run --name opentrons -it opentrons /bin/sh
# or uncomment:
# CMD ["python", "-c", "while True: pass"]
CMD ["bash", "-lc", "container_setup.sh && setup.sh && exec start.sh"]

# Using Resin base image's default entrypoint and init system- tini
