from typing import cast, List, Optional, Tuple
from opentrons.types import Point
from opentrons.protocol_api import (
    labware, InstrumentContext, ProtocolContext)

from opentrons.protocols.geometry import module_geometry


def _get_parent_slot_and_position(
        labware_obj: labware.Labware) -> Tuple[str, Optional[Point]]:
    if isinstance(labware_obj.parent, (module_geometry.ModuleGeometry)):
        return (
            cast(str, labware_obj.parent.parent),
            labware_obj.parent.labware_offset)
    else:
        return (cast(str, labware_obj.parent), None)


class Container:
    def __init__(
            self,
            container: labware.Labware,
            instruments: List[InstrumentContext],
            context: ProtocolContext) -> None:
        self._container = container
        self._context = context
        self.id = id(container)
        self.labware_offset_from_slot = 0

        # will be labware's load name or label
        self.name = container.name
        # type must be load_name so client can load correct definition
        self.type = container.load_name
        slot, position = _get_parent_slot_and_position(container)
        self.slot = slot
        self.position = position
        self.is_legacy = False
        self.is_tiprack = container.is_tiprack
        self.definition_hash = labware.get_labware_hash_with_parent(
            container)
        self.instruments = [
            Instrument(instrument, [], self._context)
            for instrument in instruments]


class Instrument:
    def __init__(
            self,
            instrument: InstrumentContext,
            containers: List[labware.Labware],
            context: ProtocolContext) -> None:
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
            Container(container, [], self._context)
            for container in containers
        ]
        self.tip_racks = [
            Container(container, [], self._context)
            for container in instrument.tip_racks]
        if context:
            self.tip_racks.extend([
                c for c in self.containers if c._container.is_tiprack])
        self.requested_as = instrument.requested_as


class Module:
    def __init__(
            self,
            module: module_geometry.ModuleGeometry,
            context: ProtocolContext) -> None:
        self.id = id(module)
        _type_lookup = {
            module_geometry.ModuleType.MAGNETIC: 'magdeck',
            module_geometry.ModuleType.TEMPERATURE: 'tempdeck',
            module_geometry.ModuleType.THERMOCYCLER: 'thermocycler'}
        self.name = _type_lookup[module.module_type]
        self.model = module.model.value
        self.slot = module.parent
        self._context = context
