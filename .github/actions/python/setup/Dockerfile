FROM python:3.7.13-slim-bullseye as base
ENV TZ=Etc/UTC
ENV HOME="/root"
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get update && apt-get install --yes pkg-config libsystemd-dev curl git \
make build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev wget \
curl llvm libncurses5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev \
libsystemd-dev

#nvm
SHELL ["/bin/bash", "--login", "-i", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash 
RUN source /root/.bashrc && nvm install 14 && nvm use 14 && npm install --global yarn
RUN yarn global add shx

RUN git clone https://github.com/Opentrons/opentrons.git
WORKDIR /opentrons
RUN make setup-py
CMD ["/bin/bash","-c", ". /root/.bashrc && cd /opentrons && git fetch && git checkout ${GITHUB_SHA} && make -C ${INPUT_PROJECT} ${INPUT_TARGET}"]