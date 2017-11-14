import os

from avahi.service import AvahiService


UUID = os.environ.get('RESIN_DEVICE_UUID')
service_name = 'opentrons-{}'.format(UUID[0:6])
AvahiService(service_name, "_http._tcp", port=31951, keep_alive=True)
