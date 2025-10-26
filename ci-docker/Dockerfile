# syntax=docker/dockerfile:1.6

# Base image tuned for GitHub-hosted Ubuntu runners
FROM ubuntu:22.04 AS runtime

ARG DEBIAN_FRONTEND=noninteractive
ARG NODE_MAJOR=22
ARG NODE_VERSION=22.12.0
ARG USERNAME=ci
ARG USER_UID=1000
ARG USER_GID=1000
ARG PYTHON_VERSION=3.10
ARG OPENTRONS_REPO_URL=https://github.com/Opentrons/opentrons.git
ARG OPENTRONS_DEFAULT_REF=edge

ENV TZ=Etc/UTC \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8 \
    PATH=/home/${USERNAME}/.local/bin:${PATH} \
    OT_PYTHON=/usr/bin/python3 \
    OT_REPO_CACHE=/opt/opentrons \
    GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/opentrons/.git/objects

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install OS packages that our monorepo toolchain depends on.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        git \
        gnupg \
        jq \
        libffi-dev \
        libsystemd-dev \
        libssl-dev \
        libudev-dev \
        libusb-1.0-0-dev \
        locales \
        lsb-release \
        pkg-config \
        python3 \
        python3-dev \
        python3-distutils \
        python3-pip \
        python3-setuptools \
        python3-venv \
        python3-wheel \
        rsync \
        sudo \
        tzdata \
        unzip \
        wget \
        xz-utils \
        zlib1g-dev && \
    rm -rf /var/lib/apt/lists/*

# Configure UTF-8 locale for deterministic builds.
RUN locale-gen en_US.UTF-8

# Install Node.js toolchain that matches actions/setup-node configuration.
RUN ARCH=$(dpkg --print-architecture) && \
        case "$ARCH" in \
            amd64) NODE_DIST_ARCH="x64" ;; \
            arm64) NODE_DIST_ARCH="arm64" ;; \
            *) echo "Unsupported architecture: $ARCH" && exit 1 ;; \
        esac && \
        curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_DIST_ARCH}.tar.xz" -o /tmp/node.tar.xz && \
        mkdir -p /usr/local/lib/nodejs && \
        tar -xJf /tmp/node.tar.xz -C /usr/local/lib/nodejs && \
        NODE_DIR="/usr/local/lib/nodejs/node-v${NODE_VERSION}-linux-${NODE_DIST_ARCH}" && \
        ln -sf ${NODE_DIR}/bin/node /usr/local/bin/node && \
        ln -sf ${NODE_DIR}/bin/npm /usr/local/bin/npm && \
        ln -sf ${NODE_DIR}/bin/npx /usr/local/bin/npx && \
        ln -sf ${NODE_DIR}/bin/corepack /usr/local/bin/corepack && \
        corepack enable && \
        npm install --global yarn@1.22.19 && \
        npm install --global corepack@0.31.0 && \
        rm -f /tmp/node.tar.xz

# Align Python tooling with composite setup-py action.
RUN python3 -m pip install --no-cache-dir --upgrade pip && \
    python3 -m pip install --no-cache-dir \
        pipenv==2023.12.1 \
        virtualenv==20.30.0 \
        uv==0.4.29

# Pre-clone repository with minimal history while keeping tags for versioning.
RUN git clone --single-branch --filter=blob:none --branch ${OPENTRONS_DEFAULT_REF} \
        ${OPENTRONS_REPO_URL} ${OT_REPO_CACHE} && \
    git -C ${OT_REPO_CACHE} fetch --tags --force && \
    git config --system --add safe.directory ${OT_REPO_CACHE}

# Create predictable non-root CI user.
RUN groupadd --gid ${USER_GID} ${USERNAME} && \
    useradd --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME} && \
    mkdir -p /workspace && \
    chown -R ${USERNAME}:${USERNAME} /workspace ${OT_REPO_CACHE}

USER ${USERNAME}
WORKDIR ${OT_REPO_CACHE}

# Warm dependency caches without keeping project virtualenvs or node_modules.
RUN make --output-sync=target -j setup-py && \
    make setup-js && \
    make teardown && \
    git reset --hard && \
    git clean -ffdx

RUN git rev-parse HEAD > ${OT_REPO_CACHE}/.ci-default-ref

WORKDIR /workspace

# Default to an interactive shell so `docker run` drops straight into a shell.
CMD ["/bin/bash"]
