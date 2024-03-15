# Use 3.10 just like the app does
FROM python:3.10-slim-bullseye

# Update packages and install git
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git libsystemd-dev

# Define a build argument for the commit/tag/hash to clone
ARG OPENTRONS_VERSION=edge

# Set the working directory in the container
WORKDIR /opentrons

# Clone the Opentrons repository at the specified commit or tag
RUN git clone --branch $OPENTRONS_VERSION --depth 1 https://github.com/Opentrons/opentrons .

# Install packages from local directories
RUN python -m pip install -U ./shared-data/python
RUN python -m pip install -U ./hardware[flex]
RUN python -m pip install -U ./api
RUN python -m pip install -U pandas==1.4.3

# The default command to run when starting the container
CMD ["tail", "-f", "/dev/null"]

