from opentrons.protocol_api import module_geometry
from opentrons.legacy_api.containers import Slot, placeable


def _get_parent_slot_legacy(placeable):
    if isinstance(placeable, Slot) or not placeable:
        res = placeable
    else:
        res = _get_parent_slot_legacy(placeable.parent)
    return res


def _get_parent_slot_and_position(labware_obj):
    if isinstance(labware_obj.parent, (module_geometry.ModuleGeometry)):
        return (labware_obj.parent.parent, labware_obj.parent.labware_offset)
    else:
        return (labware_obj.parent, None)


class Container:
    def __init__(self, container, instruments=None, context=None):
        instruments = instruments or []
        self._container = container
        self._context = context
        self.id = id(container)
        self.labware_offset_from_slot = 0

        if isinstance(container, placeable.Placeable):
            self.name = container.get_name()
            self.type = container.get_type()
            self.slot = _get_parent_slot_legacy(container).get_name()
            self.is_legacy = container.properties.get(
                'labware_hash') is None
        else:
            # will be labware's load name or label
            self.name = container.name
            # type must be load_name so client can load correct definition
            self.type = container.load_name
            slot, position = _get_parent_slot_and_position(container)
            self.slot = slot
            self.position = position
            self.is_legacy = False
            self.is_tiprack = container.is_tiprack
        self.instruments = [
            Instrument(instrument)
            for instrument in instruments]


class Instrument:
    def __init__(self, instrument, containers=None, context=None):
        containers = containers or []
        self._instrument = instrument
        self._context = context

        self.id = id(instrument)
        # The name element here is actually the pipette model for historical
        # reasons
        self.name = instrument.model
        self.model_name = instrument.name
        self.channels = instrument.channels
        self.mount = instrument.mount
        self.containers = [
            Container(container)
            for container in containers
        ]
        self.tip_racks = [
            Container(container)
            for container in instrument.tip_racks]
        if context:
            self.tip_racks.extend([
                c for c in self.containers if c._container.is_tiprack])
        self.requested_as = instrument.requested_as


class Module:
    def __init__(self, module, context=None):
        self.id = id(module)
        if isinstance(module, module_geometry.ModuleGeometry):
            _type_lookup = {
                module_geometry.ModuleType.MAGNETIC: 'magdeck',
                module_geometry.ModuleType.TEMPERATURE: 'tempdeck',
                module_geometry.ModuleType.THERMOCYCLER: 'thermocycler'}
            self.name = _type_lookup[module.module_type]
            self.model = module.model.value
            self.slot = module.parent
        else:
            self.name = module.get_name()
            _legacy_lookup = {
                'tempdeck': 'temperatureModuleV1',
                'magdeck': 'magneticModuleV1',
                'thermocycler': 'thermocyclerModuleV1'
            }
            self.model = _legacy_lookup[module.get_name()]
            self.slot = module.parent.get_name()
        self._context = context
