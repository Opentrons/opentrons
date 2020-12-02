from __future__ import annotations

from typing import cast, Tuple, TYPE_CHECKING, List, Union, Optional
from opentrons.types import Location
from opentrons.protocols.api_support import labware_like

import opentrons.commands.types as command_types

if TYPE_CHECKING:
    from opentrons.protocol_api import InstrumentContext
    from opentrons.protocol_api.labware import Labware, Well
    from opentrons.protocols.geometry.module_geometry import ModuleGeometry
    ReferredObjects = Tuple[
        List[InstrumentContext], List[Labware], List[ModuleGeometry]]


def _labware_from_location(loc: Union[Location, Well]) -> Labware:
    if isinstance(loc, Location):
        if not loc.labware:
            raise ValueError('Cannot handle location without labware')
        labware, _ = loc.labware.get_parent_labware_and_well()
        if not labware:
            raise ValueError(f'Cannot handle location {loc}')
        return labware
    else:
        return loc.parent

# The casts and type: ignores in _get_locations and _get_instruments are necessary
# until we either a) refactor this so payloads have tags that mypy can use to
# discriminate the unions (or make commands dataclasses that can be checked with
# isinstance) or b) mypy learns full disjoint union discrimination.


def _get_locations(
        command: command_types.HasLocationPayload) -> List[Optional[Labware]]:
    if 'location' in command and command['location']:  # type: ignore
        return [_labware_from_location(
            cast(command_types.SingleLocationPayload, command)['location'])]
    elif 'locations' in command and command['locations']:  # type: ignore
        return [_labware_from_location(loc) for loc in
                cast(command_types.MultiLocationPayload, command)['locations']]
    else:
        return []


def _get_instruments(
        command: command_types.HasInstrumentPayload) -> List[InstrumentContext]:
    if 'instrument' in command:  # type: ignore
        return [cast(command_types.SingleInstrumentPayload, command)['instrument']]
    else:  # type: ignore
        return [
            inst for inst
            in cast(command_types.MultiInstrumentPayload, command)['instruments']]


def get_referred_objects(command: command_types.CommandPayload) -> ReferredObjects:
    if 'location' in command or 'locations' in command:
        locations = [lw for lw in _get_locations(
            cast(command_types.HasLocationPayload, command)) if lw is not None]
    else:
        locations = []
    if 'instrument' in command or 'instruments' in command:
        instruments = _get_instruments(
            cast(command_types.HasInstrumentPayload, command))
    else:
        instruments = []

    maybe_modules = [
        labware_like.LabwareLike(labware).module_parent() for labware in locations]
    return instruments, locations, [mod for mod in maybe_modules if mod]
