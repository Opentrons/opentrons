from opentrons.config import feature_flags as ff
from opentrons.protocol_api import labware
from opentrons.legacy_api.containers import Slot, placeable


def _get_parent_slot(placeable):
    if isinstance(placeable, Slot) or not placeable:
        res = placeable
    else:
        res = _get_parent_slot(placeable.parent)
    return res


class Container:
    def __init__(self, container, instruments=None, context=None):
        instruments = instruments or []
        self._container = container
        self._context = context
        self.id = id(container)

        if isinstance(container, placeable.Placeable):
            self.name = container.get_name()
            self.type = container.get_type()
            self.slot = _get_parent_slot(container).get_name()
        else:
            self.name = container.name
            self.type = container.name
            self.slot = container.parent
        self.instruments = [
            Instrument(instrument)
            for instrument in instruments]


class Instrument:
    def __init__(self, instrument, containers=None, context=None):
        containers = containers or []
        self._instrument = instrument
        self._context = context

        self.id = id(instrument)
        self.name = instrument.name
        self.channels = instrument.channels
        self.mount = instrument.mount
        self.containers = [
            Container(container)
            for container in containers
        ]
        self.tip_racks = [
            Container(container)
            for container in instrument.tip_racks]
        if ff.use_protocol_api_v2():
            self.tip_racks.extend([
                c for c in self.containers if c._container.is_tiprack])


class Module:
    def __init__(self, module, context=None):
        self.id = id(module)
        if isinstance(module, labware.ModuleGeometry):
            self.name = module.load_name
            self.slow = module.parent
        else:
            self.name = module.get_name()
            self.slot = module.parent.get_name()
        self._context = context
