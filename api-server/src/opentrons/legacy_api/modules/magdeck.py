from opentrons.drivers.mag_deck import MagDeck as MagDeckDriver
from opentrons.drivers.mag_deck.driver import mag_locks
from opentrons import commands

LABWARE_ENGAGE_HEIGHT = {
    'biorad-hardshell-96-PCR': 18}  # mm
MAX_ENGAGE_HEIGHT = 45  # mm from home position


class MissingDevicePortError(Exception):
    pass


# TODO: BC 2018-08-03 this class shares a fair amount verbatim from TempDeck,
# there should be an upstream ABC in the future to contain shared logic
# between modules
class MagDeck(commands.CommandPublisher):
    '''
    Under development. API subject to change
    '''
    def __init__(self, lw=None, port=None, broker=None):
        super().__init__(broker)
        self.labware = lw
        self._port = port
        self._driver = None
        self._device_info = None
        self._height_shadow = 0

    @commands.publish.both(command=commands.magdeck_calibrate)
    def calibrate(self):
        '''
        Calibration involves probing for top plate to get the plate height
        '''
        if self._driver and self._driver.is_connected():
            self._driver.probe_plate()
            # return if successful or not?

    @commands.publish.both(command=commands.magdeck_engage)
    def engage(self, **kwargs):
        '''
        Move the magnet to either:
            the default height for the labware loaded on magdeck
            [engage()]
        or  a +/- 'offset' from the default height for the labware
            [engage(offset=2)]
        or  a 'height' value specified as mm from magdeck home position
            [engage(height=20)]
        '''
        if 'height' in kwargs:
            height = kwargs.get('height')
        else:
            try:
                height = self.labware.get_children_list()[1].\
                    magdeck_engage_height()
            except KeyError:
                height = LABWARE_ENGAGE_HEIGHT.get(
                    self.labware.get_children_list()[1].get_original_name())
            if not height:
                raise ValueError(
                    'No engage height definition found for {}. Provide a'
                    'custom height instead'.format(
                        self.labware.get_children_list()[1].get_name()))
            if 'offset' in kwargs:
                height += kwargs.get('offset')
        if height > MAX_ENGAGE_HEIGHT or height < 0:
            raise ValueError('Invalid engage height. Should be 0 to {}'.format(
                MAX_ENGAGE_HEIGHT))
        if self._driver and self._driver.is_connected():
            self._driver.move(height)
        self._height_shadow = height

    @commands.publish.both(command=commands.magdeck_disengage)
    def disengage(self):
        '''
        Home the magnet
        '''
        if self._driver and self._driver.is_connected():
            self._driver.home()
        self._height_shadow = 0

    @property
    def current_height(self):
        if self._driver and self._driver.is_connected():
            return self._driver.mag_position
        else:
            return self._height_shadow

    @property
    def engaged(self):
        if self.current_height > 0:
            return True
        else:
            return False

    @classmethod
    def name(cls):
        return 'magdeck'

    @classmethod
    def display_name(cls):
        return 'Magnetic Deck'

    # TODO: there should be a separate decoupled set of classes that
    # construct the http api response entity given the model instance.
    def to_dict(self):
        return {
            'name': self.name(),
            'port': self.port,
            'serial': self.device_info and self.device_info.get('serial'),
            'model': self.device_info and self.device_info.get('model'),
            'fwVersion': self.device_info and self.device_info.get('version'),
            'displayName': self.display_name(),
            **self.live_data
        }

    @property
    def live_data(self):
        return {
            'status': self.status,
            'data': {
                'engaged': self.engaged,
                'height': self.current_height
            }
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
    def status(self):
        if self.current_height > 0:
            return 'engaged'
        else:
            return 'disengaged'

    # Internal Methods

    def connect(self):
        '''
        Connect to the serial port
        '''
        if self._port:
            if mag_locks.get(self._port):
                self._driver = mag_locks[self._port][1]
            else:
                self._driver = MagDeckDriver()
            if not self._driver.is_connected():
                self._driver.connect(self._port)
            self._device_info = self._driver.get_device_info()
        else:
            # Sanity check: Should never happen, because connect should
            # never be called without a port on Module
            raise MissingDevicePortError(
                "MagDeck couldnt connect to port {}".format(self._port)
            )

    def disconnect(self):
        '''
        Disconnect from the serial port
        '''
        if self._driver:
            self._driver.disconnect(port=self._port)
