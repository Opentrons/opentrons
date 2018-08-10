from opentrons.drivers.temp_deck import TempDeck as TempDeckDriver
from opentrons import commands

class MissingDevicePortError(Exception):
    pass


# TODO: BC 2018-08-03 this class shares a fair amount verbatim from MagDeck,
# there should be an upstream ABC in the future to contain shared logic
# between modules
class TempDeck:
    """
    Under development. API subject to change without a version bump
    """
    def __init__(self, lw=None, port=None):
        self.labware = lw
        self._port = port
        self._driver = None
        self._device_info = None

    @commands.publish.both(command=commands.tempdeck_set_temp)
    def set_temperature(self, celsius):
        """
        Set temperature in degree Celsius
        Range: -9 to 99 degree Celsius.
        The range is limited by the 2-digit temperature display. Any input
        outside of this range will be clipped to the nearest limit
        """
        if self._driver and self._driver.is_connected():
            self._driver.set_temperature(celsius)

    @commands.publish.both(command=commands.tempdeck_deactivate)
    def deactivate(self):
        """ Stop heating/cooling and turn off the fan """
        if self._driver and self._driver.is_connected():
            self._driver.disengage()

    def _wait_for_temp(self):
        """
        This method exits only if set temperature has reached.Subject to change
        """
        if self._driver and self._driver.is_connected():
            while self.status != 'holding at target':
                pass

    # TODO: there should be a separate decoupled set of classes that construct
    # the http api response entity given the model instance.
    def to_dict(self):
        return {
            'name': 'tempdeck',
            'port': self.port,
            'serial': self.device_info and self.device_info.get('serial'),
            'model': self.device_info and self.device_info.get('model'),
            'fwVersion': self.device_info and self.device_info.get('version'),
            'displayName': 'Temperature Deck',
            'status': self.status,
            'data': {'currentTemp': self.temperature, 'targetTemp': self.target}
        }

    @property
    def port(self):
        """ Serial Port """
        return self._port

    @property
    def device_info(self):
        """
        Returns a dict:
            { 'serial': 'abc123', 'model': '8675309', 'version': '9001' }
        """
        return self._device_info

    @property
    def temperature(self):
        """ Current temperature in degree celsius """
        self._driver.update_temperature()
        return self._driver.temperature

    @property
    def target(self):
        """
        Target temperature in degree celsius.
        Returns None if no target set
        """
        self._driver.update_temperature()
        return self._driver.target

    @property
    def status(self):
        """
        Returns a string: 'heating'/'cooling'/'holding at target'/'idle'
        """
        return self._driver and self._driver.status

    # Internal Methods

    def connect(self):
        """
        Connect to the 'TempDeck' port
        Planned change- will connect to the correct port in case of multiple
        TempDecks
        """
        if self._port:
            self._driver = TempDeckDriver()
            self._driver.connect(self._port)
            self._device_info = self._driver.get_device_info()
        else:
            # Sanity check Should never happen, because connect should never
            # be called without a port on Module
            raise MissingDevicePortError(
                "TempDeck couldnt connect to port {}".format(self._port)
            )

    def disconnect(self):
        '''
        Disconnect from the serial port
        '''
        if self._driver:
            self._driver.disconnect()
