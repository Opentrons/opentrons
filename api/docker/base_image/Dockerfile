FROM resin/rpi-raspbian:jessie
ENTRYPOINT []

RUN apt-get update && \  
    apt-get -qy install curl \
                build-essential \
                python3 \
                ca-certificates \
                gcc make \
                python3-dev \
                iproute2 \ 
                vim \
                ifupdown \
                net-tools \
                wireless-tools
                
RUN easy_install3 pip

WORKDIR /root/  
RUN curl -O \  
  https://nodejs.org/dist/v4.5.0/node-v4.5.0-linux-armv6l.tar.gz
RUN tar -xvf node-*.tar.gz -C /usr/local \  
  --strip-components=1

CMD ["bash"] 
