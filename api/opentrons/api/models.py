from opentrons.legacy_api.containers import Slot


def _get_parent_slot(placeable):
    if isinstance(placeable, Slot) or not placeable:
        res = placeable
    else:
        res = _get_parent_slot(placeable.parent)
    return res


class Container:
    def __init__(self, container, instruments=None):
        instruments = instruments or []
        self._container = container

        self.id = id(container)
        self.name = container.get_name()
        self.type = container.get_type()
        self.slot = _get_parent_slot(container).get_name()
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
        self.mount = instrument.mount
        # Although axis has been deprecated from the instrument
        # we still need to pass it to the UI for now
        # Warning: this does not correspond to the Smoothie axis!
        self.axis = 'a' if self.mount == 'right' else 'b'
        self.tip_racks = [
            Container(container)
            for container in instrument.tip_racks]
        self.containers = [
            Container(container)
            for container in containers
        ]


class Module:
    def __init__(self, module):
        self.id = id(module)
        self.name = module.get_name()
        self.slot = module.parent.get_name()
