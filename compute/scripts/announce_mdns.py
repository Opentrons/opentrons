#!/usr/bin/env python

import os
from avahi_tools.service import AvahiService


DEVICE_NAME = os.environ.get('RESIN_DEVICE_NAME_AT_INIT')
service_name = 'opentrons-{}'.format(DEVICE_NAME)
AvahiService(service_name, "_http._tcp", port=31950, keep_alive=True)
