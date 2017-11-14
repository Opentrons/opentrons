import os

from avahi.service import AvahiService


DEVICE_NAME = os.environ.get('RESIN_DEVICE_NAME_AT_INIT')
service_name = 'opentrons-{}'.format(DEVICE_NAME)
AvahiService(service_name, "_http._tcp", port=31951, keep_alive=True)
