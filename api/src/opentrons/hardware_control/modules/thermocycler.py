from . import mod_abc


class SimulatingDriver:
    def __init__(self):
        self._port = None

    @property
    def status(self):
        return '???'

    def connect(self, port):
        self._port = port

    def disengage(self):
        pass


class Thermocycler(mod_abc.AbstractModule):
    """
    Under development. API subject to change without a version bump
    """
    @classmethod
    def build(cls, port, simulating=False):
        """Build and connect to a Thermocycler
        """
        mod = cls(port, simulating)
        return mod

    @classmethod
    def name(cls):
        return 'thermocycler'

    @classmethod
    def display_name(cls):
        return 'Thermocycler'

    def __init__(self, port, simulating):
        if simulating:
            self._driver = SimulatingDriver()
        else:
            # self._driver = ThermocyclerDriver()
            self._driver = None
        self._port = port
        self._device_info = None
        self._poller = None

    def disengage(self):
        self._driver.disengage()

    @property
    def status(self):
        return self._driver.status

    @property
    def device_info(self):
        return self._device_info

    @property
    def live_data(self):
        return {
            'status': self.status,
            'data': {}
        }

    @property
    def is_simulated(self):
        return isinstance(self._driver, SimulatingDriver)

    @property
    def port(self):
        return self._port

    async def prep_for_update(self):
        pass
