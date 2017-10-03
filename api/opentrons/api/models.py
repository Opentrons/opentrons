class Container:
    def __init__(self, container, instruments=None):
        instruments = instruments or []
        self._container = container

        self.id = id(container)
        self.name = container.get_name()
        self.type = container.get_type()
        self.slot = container.parent.get_name()
        self.instruments = [
            Instrument(instrument)
            for instrument in instruments]


class Instrument:
    def __init__(self, instrument, containers=None):
        containers = containers or []
        self._instrument = instrument

        self.id = id(instrument)
        self.name = instrument.name
        self.channels = instrument.channels
        self.axis = instrument.axis
        self.tip_racks = [
            Container(container)
            for container in instrument.tip_racks]
        self.containers = [
            Container(container)
            for container in containers
        ]
