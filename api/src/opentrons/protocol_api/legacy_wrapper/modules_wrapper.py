import logging

from opentrons import commands
from .util import log_call

log = logging.getLogger(__name__)


@log_call(log)
def load(name, slot):
    return None


class TempDeck(commands.CommandPublisher):
    """
    Legacy wrapper for the temperature module
    """
    def __init__(self, lw=None, port=None, broker=None):
        super().__init__(broker)

    @log_call(log)
    @commands.publish.both(command=commands.tempdeck_set_temp)
    def set_temperature(self, celsius):
        """
        Set temperature in degree Celsius
        Range: 4 to 95 degree Celsius (QA tested).
        The internal temp range is -9 to 99 C, which is limited by the 2-digit
        temperature display. Any input outside of this range will be clipped
        to the nearest limit
        """
        return None

    @log_call(log)
    @commands.publish.both(command=commands.tempdeck_deactivate)
    def deactivate(self):
        """ Stop heating/cooling and turn off the fan """
        return None

    @log_call(log)
    def wait_for_temp(self):
        """
        This method exits only if set temperature has reached.Subject to change
        """
        return None

    @classmethod
    def name(cls):
        return 'tempdeck'

    @classmethod
    def display_name(cls):
        return 'Temperature Deck'

    @property
    def temperature(self):
        """ Current temperature in degree celsius """
        log.info('TempDeck.temperature()')
        return None

    @property
    def target(self):
        """
        Target temperature in degree celsius.
        Returns None if no target set
        """
        log.info('TempDeck.target()')
        return None


class MagDeck(commands.CommandPublisher):
    '''
    Legacy wrapper for the magdeck module
    '''
    def __init__(self, lw=None, port=None, broker=None):
        super().__init__(broker)

    @log_call(log)
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
        return None

    @log_call(log)
    @commands.publish.both(command=commands.magdeck_disengage)
    def disengage(self):
        '''
        Home the magnet
        '''
        return None
