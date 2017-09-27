class Container:
    def __init__(self, container, instruments=None):
        instruments = instruments or []
        self.id = id(container)
        self.name = container.get_name()
        self.type = container.get_type()
        self.slot = container.parent.get_name()
        self.instruments = [
            Instrument(instrument)
            for instrument in instruments]
        self.wells = [Well(well) for well in container]


class Well:
    def __init__(self, well):
        self.id = id(well)
        self.properties = well.properties.copy()
        self.coordinates = well.coordinates(reference=well.parent)


class Instrument:
    def __init__(self, instrument, containers=None):
        containers = containers or []
        self._instruments = instrument
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
