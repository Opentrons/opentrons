"""ProtocolEngine-based InstrumentContext core implementation."""
from __future__ import annotations

import dataclasses
from typing import Optional, TYPE_CHECKING, cast, Union, List

from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    AspirateProperties,
    BlowoutLocation,
)

from opentrons.protocols.api_support.types import APIVersion

from opentrons.types import Location, Mount
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import FlowRates, find_value_for_api_version
from opentrons.protocol_engine import commands as cmd
from opentrons.protocol_engine import (
    DeckPoint,
    DropTipWellLocation,
    DropTipWellOrigin,
    WellLocation,
    WellOrigin,
    WellOffset,
    AllNozzleLayoutConfiguration,
    SingleNozzleLayoutConfiguration,
    RowNozzleLayoutConfiguration,
    ColumnNozzleLayoutConfiguration,
    QuadrantNozzleLayoutConfiguration,
)
from opentrons.protocol_engine.types import (
    PRIMARY_NOZZLE_LITERAL,
    NozzleLayoutConfigurationType,
    AddressableOffsetVector,
    ImmutableLiquidClass,
)
from opentrons.protocol_engine.errors.exceptions import TipNotAttachedError
from opentrons.protocol_engine.clients import SyncClient as EngineClient
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons_shared_data.pipette.types import PipetteNameType
from opentrons.protocol_api._nozzle_layout import NozzleLayout
from opentrons.hardware_control.nozzle_manager import NozzleConfigurationType
from opentrons.hardware_control.nozzle_manager import NozzleMap
from . import overlap_versions, pipette_movement_conflict

from ..instrument import AbstractInstrument
from .well import WellCore
from ... import LiquidClass

from ...disposal_locations import TrashBin, WasteChute, _DisposalLocation

if TYPE_CHECKING:
    from .protocol import ProtocolCore


_DISPENSE_VOLUME_VALIDATION_ADDED_IN = APIVersion(2, 17)


class InstrumentCore(AbstractInstrument[WellCore]):
    """Instrument API core using a ProtocolEngine.

    Args:
        pipette_id: ProtocolEngine ID of the loaded instrument.
    """

    def __init__(
        self,
        pipette_id: str,
        engine_client: EngineClient,
        sync_hardware_api: SyncHardwareAPI,
        protocol_core: ProtocolCore,
        default_movement_speed: float,
    ) -> None:
        self._pipette_id = pipette_id
        self._engine_client = engine_client
        self._sync_hardware_api = sync_hardware_api
        self._protocol_core = protocol_core

        # TODO(jbl 2022-11-03) flow_rates should not live in the cores, and should be moved to the protocol context
        #   along with other rate related refactors (for the hardware API)
        flow_rates = self._engine_client.state.pipettes.get_flow_rates(pipette_id)
        self._aspirate_flow_rate = find_value_for_api_version(
            MAX_SUPPORTED_VERSION, flow_rates.default_aspirate
        )
        self._dispense_flow_rate = find_value_for_api_version(
            MAX_SUPPORTED_VERSION, flow_rates.default_dispense
        )
        self._blow_out_flow_rate = find_value_for_api_version(
            MAX_SUPPORTED_VERSION, flow_rates.default_blow_out
        )
        self._flow_rates = FlowRates(self)

        self.set_default_speed(speed=default_movement_speed)
        self._liquid_presence_detection = bool(
            self._engine_client.state.pipettes.get_liquid_presence_detection(pipette_id)
        )

    @property
    def pipette_id(self) -> str:
        """The instrument's unique ProtocolEngine ID."""
        return self._pipette_id

    def get_default_speed(self) -> float:
        speed = self._engine_client.state.pipettes.get_movement_speed(
            pipette_id=self._pipette_id
        )
        assert speed is not None, "Pipette loading should have set a default speed."
        return speed

    def set_default_speed(self, speed: float) -> None:
        self._engine_client.set_pipette_movement_speed(
            pipette_id=self._pipette_id, speed=speed
        )

    def aspirate(
        self,
        location: Location,
        well_core: Optional[WellCore],
        volume: float,
        rate: float,
        flow_rate: float,
        in_place: bool,
        is_meniscus: Optional[bool] = None,
    ) -> None:
        """Aspirate a given volume of liquid from the specified location.
        Args:
            volume: The volume of liquid to aspirate, in microliters.
            location: The exact location to aspirate from.
            well_core: The well to aspirate from, if applicable.
            rate: Not used in this core.
            flow_rate: The flow rate in µL/s to aspirate at.
            in_place: whether this is a in-place command.
        """
        if well_core is None:
            if not in_place:
                self._engine_client.execute_command(
                    cmd.MoveToCoordinatesParams(
                        pipetteId=self._pipette_id,
                        coordinates=DeckPoint(
                            x=location.point.x, y=location.point.y, z=location.point.z
                        ),
                        minimumZHeight=None,
                        forceDirect=False,
                        speed=None,
                    )
                )

            self._engine_client.execute_command(
                cmd.AspirateInPlaceParams(
                    pipetteId=self._pipette_id, volume=volume, flowRate=flow_rate
                )
            )

        else:
            well_name = well_core.get_name()
            labware_id = well_core.labware_id

            well_location = self._engine_client.state.geometry.get_relative_liquid_handling_well_location(
                labware_id=labware_id,
                well_name=well_name,
                absolute_point=location.point,
                is_meniscus=is_meniscus,
            )
            pipette_movement_conflict.check_safe_for_pipette_movement(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
            self._engine_client.execute_command(
                cmd.AspirateParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    volume=volume,
                    flowRate=flow_rate,
                )
            )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def dispense(
        self,
        location: Union[Location, TrashBin, WasteChute],
        well_core: Optional[WellCore],
        volume: float,
        rate: float,
        flow_rate: float,
        in_place: bool,
        push_out: Optional[float],
        is_meniscus: Optional[bool] = None,
    ) -> None:
        """Dispense a given volume of liquid into the specified location.
        Args:
            volume: The volume of liquid to dispense, in microliters.
            location: The exact location to dispense to.
            well_core: The well to dispense to, if applicable.
            rate: Not used in this core.
            flow_rate: The flow rate in µL/s to dispense at.
            in_place: whether this is a in-place command.
            push_out: The amount to push the plunger below bottom position.
        """
        if self._protocol_core.api_version < _DISPENSE_VOLUME_VALIDATION_ADDED_IN:
            # In older API versions, when you try to dispense more than you can,
            # it gets clamped.
            volume = min(volume, self.get_current_volume())
        else:
            # Newer API versions raise an error if you try to dispense more than
            # you can. Let the error come from Protocol Engine's validation.
            pass

        if well_core is None:
            if not in_place:
                if isinstance(location, (TrashBin, WasteChute)):
                    self._move_to_disposal_location(
                        disposal_location=location, force_direct=False, speed=None
                    )
                else:
                    self._engine_client.execute_command(
                        cmd.MoveToCoordinatesParams(
                            pipetteId=self._pipette_id,
                            coordinates=DeckPoint(
                                x=location.point.x,
                                y=location.point.y,
                                z=location.point.z,
                            ),
                            minimumZHeight=None,
                            forceDirect=False,
                            speed=None,
                        )
                    )

            self._engine_client.execute_command(
                cmd.DispenseInPlaceParams(
                    pipetteId=self._pipette_id,
                    volume=volume,
                    flowRate=flow_rate,
                    pushOut=push_out,
                )
            )
        else:
            if isinstance(location, (TrashBin, WasteChute)):
                raise ValueError("Trash Bin and Waste Chute have no Wells.")
            well_name = well_core.get_name()
            labware_id = well_core.labware_id

            well_location = self._engine_client.state.geometry.get_relative_liquid_handling_well_location(
                labware_id=labware_id,
                well_name=well_name,
                absolute_point=location.point,
                is_meniscus=is_meniscus,
            )
            pipette_movement_conflict.check_safe_for_pipette_movement(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
            self._engine_client.execute_command(
                cmd.DispenseParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    volume=volume,
                    flowRate=flow_rate,
                    pushOut=push_out,
                )
            )

        if isinstance(location, (TrashBin, WasteChute)):
            self._protocol_core.set_last_location(location=None, mount=self.get_mount())
        else:
            self._protocol_core.set_last_location(
                location=location, mount=self.get_mount()
            )

    def blow_out(
        self,
        location: Union[Location, TrashBin, WasteChute],
        well_core: Optional[WellCore],
        in_place: bool,
    ) -> None:
        """Blow liquid out of the tip.

        Args:
            location: The location to blow out into.
            well_core: The well to blow out into.
            in_place: whether this is a in-place command.
        """
        flow_rate = self.get_blow_out_flow_rate(1.0)
        if well_core is None:
            if not in_place:
                if isinstance(location, (TrashBin, WasteChute)):
                    self._move_to_disposal_location(
                        disposal_location=location, force_direct=False, speed=None
                    )
                else:
                    self._engine_client.execute_command(
                        cmd.MoveToCoordinatesParams(
                            pipetteId=self._pipette_id,
                            coordinates=DeckPoint(
                                x=location.point.x,
                                y=location.point.y,
                                z=location.point.z,
                            ),
                            forceDirect=False,
                            minimumZHeight=None,
                            speed=None,
                        )
                    )

            self._engine_client.execute_command(
                cmd.BlowOutInPlaceParams(pipetteId=self._pipette_id, flowRate=flow_rate)
            )
        else:
            if isinstance(location, (TrashBin, WasteChute)):
                raise ValueError("Trash Bin and Waste Chute have no Wells.")
            well_name = well_core.get_name()
            labware_id = well_core.labware_id

            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )
            pipette_movement_conflict.check_safe_for_pipette_movement(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
            self._engine_client.execute_command(
                cmd.BlowOutParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    # TODO(jbl 2022-11-07) PAPIv2 does not have an argument for rate and
                    #   this also needs to be refactored along with other flow rate related issues
                    flowRate=flow_rate,
                )
            )

        if isinstance(location, (TrashBin, WasteChute)):
            self._protocol_core.set_last_location(location=None, mount=self.get_mount())
        else:
            self._protocol_core.set_last_location(
                location=location, mount=self.get_mount()
            )

    def touch_tip(
        self,
        location: Location,
        well_core: WellCore,
        radius: float,
        z_offset: float,
        speed: float,
    ) -> None:
        """Touch pipette tip to edges of the well

        Args:
            location: Location moved to, only used for ProtocolCore location cache.
            well_core: The target well for touch tip.
            radius: Percentage modifier for well radius to touch.
            z_offset: Vertical offset for pipette tip during touch tip.
            speed: Speed for the touch tip movements.
        """
        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        # Touch tip is always done from the top of the well.
        well_location = WellLocation(
            origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=z_offset)
        )
        pipette_movement_conflict.check_safe_for_pipette_movement(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        self._engine_client.execute_command(
            cmd.TouchTipParams(
                pipetteId=self._pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                radius=radius,
                speed=speed,
            )
        )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def pick_up_tip(
        self,
        location: Location,
        well_core: WellCore,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool = True,
    ) -> None:
        """Move to and pick up a tip from a given well.

        Args:
            location: The location of the well we're picking up from.
                Used to calculate the relative well offset for the pick up command.
            well_core: The "well" to pick up from.
            presses: Customize the number of presses the pipette does.
            increment: Customize the movement "distance" of the pipette to press harder.
            prep_after: Not used by this core, pipette preparation will always happen.
        """
        assert (
            presses is None and increment is None
        ), "Tip pick-up with custom presses or increment deprecated"

        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        well_location = (
            self._engine_client.state.geometry.get_relative_pick_up_tip_well_location(
                labware_id=labware_id,
                well_name=well_name,
                absolute_point=location.point,
            )
        )
        pipette_movement_conflict.check_safe_for_tip_pickup_and_return(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
        )
        pipette_movement_conflict.check_safe_for_pipette_movement(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )

        self._engine_client.execute_command(
            cmd.PickUpTipParams(
                pipetteId=self._pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
            )
        )

        # Set the "last location" unconditionally, even if the command failed
        # and was recovered from and we don't know if the pipette is physically here.
        # This isn't used for path planning, but rather for implicit destination
        # selection like in `pipette.aspirate(location=None)`.
        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def drop_tip(
        self,
        location: Optional[Location],
        well_core: WellCore,
        home_after: Optional[bool],
        alternate_drop_location: Optional[bool] = False,
    ) -> None:
        """Move to and drop a tip into a given well.

        Args:
            location: The location of the well we're dropping tip into.
                Used to calculate the relative well offset for the drop command.
            well_core: The well we're dropping into
            home_after: Whether to home the pipette after the tip is dropped.
            alternate_drop_location: Whether to randomize the exact location to drop tip
                within the specified well.
        """
        well_name = well_core.get_name()
        labware_id = well_core.labware_id

        if location is not None:
            relative_well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )

            well_location = DropTipWellLocation(
                origin=DropTipWellOrigin(relative_well_location.origin.value),
                offset=relative_well_location.offset,
            )
        else:
            well_location = DropTipWellLocation()

        if self._engine_client.state.labware.is_tiprack(labware_id):
            pipette_movement_conflict.check_safe_for_tip_pickup_and_return(
                engine_state=self._engine_client.state,
                pipette_id=self._pipette_id,
                labware_id=labware_id,
            )
        pipette_movement_conflict.check_safe_for_pipette_movement(
            engine_state=self._engine_client.state,
            pipette_id=self._pipette_id,
            labware_id=labware_id,
            well_name=well_name,
            well_location=well_location,
        )
        self._engine_client.execute_command(
            cmd.DropTipParams(
                pipetteId=self._pipette_id,
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                homeAfter=home_after,
                alternateDropLocation=alternate_drop_location,
            )
        )

        self._protocol_core.set_last_location(location=location, mount=self.get_mount())

    def drop_tip_in_disposal_location(
        self,
        disposal_location: Union[TrashBin, WasteChute],
        home_after: Optional[bool],
        alternate_tip_drop: bool = False,
    ) -> None:
        self._move_to_disposal_location(
            disposal_location,
            force_direct=False,
            speed=None,
            alternate_tip_drop=alternate_tip_drop,
        )
        self._drop_tip_in_place(home_after=home_after)
        self._protocol_core.set_last_location(location=None, mount=self.get_mount())

    def _move_to_disposal_location(
        self,
        disposal_location: Union[TrashBin, WasteChute],
        force_direct: bool,
        speed: Optional[float],
        alternate_tip_drop: bool = False,
    ) -> None:
        # TODO (nd, 2023-11-30): give appropriate offset when finalized
        # https://opentrons.atlassian.net/browse/RSS-391

        disposal_offset = disposal_location.offset
        offset = AddressableOffsetVector(
            x=disposal_offset.x, y=disposal_offset.y, z=disposal_offset.z
        )

        if isinstance(disposal_location, TrashBin):
            addressable_area_name = disposal_location.area_name
            self._engine_client.execute_command(
                cmd.MoveToAddressableAreaForDropTipParams(
                    pipetteId=self._pipette_id,
                    addressableAreaName=addressable_area_name,
                    offset=offset,
                    forceDirect=force_direct,
                    speed=speed,
                    minimumZHeight=None,
                    alternateDropLocation=alternate_tip_drop,
                    ignoreTipConfiguration=True,
                )
            )

        if isinstance(disposal_location, WasteChute):
            num_channels = self.get_channels()
            addressable_area_name = {
                1: "1ChannelWasteChute",
                8: "8ChannelWasteChute",
                96: "96ChannelWasteChute",
            }[num_channels]

            self._engine_client.execute_command(
                cmd.MoveToAddressableAreaParams(
                    pipetteId=self._pipette_id,
                    addressableAreaName=addressable_area_name,
                    offset=offset,
                    forceDirect=force_direct,
                    speed=speed,
                    minimumZHeight=None,
                )
            )

    def _drop_tip_in_place(self, home_after: Optional[bool]) -> None:
        self._engine_client.execute_command(
            cmd.DropTipInPlaceParams(
                pipetteId=self._pipette_id,
                homeAfter=home_after,
            )
        )

    def home(self) -> None:
        z_axis = self._engine_client.state.pipettes.get_z_axis(self._pipette_id)
        plunger_axis = self._engine_client.state.pipettes.get_plunger_axis(
            self._pipette_id
        )
        self._engine_client.execute_command(cmd.HomeParams(axes=[z_axis, plunger_axis]))

    def home_plunger(self) -> None:
        plunger_axis = self._engine_client.state.pipettes.get_plunger_axis(
            self._pipette_id
        )
        self._engine_client.execute_command(cmd.HomeParams(axes=[plunger_axis]))

    def move_to(
        self,
        location: Union[Location, TrashBin, WasteChute],
        well_core: Optional[WellCore],
        force_direct: bool,
        minimum_z_height: Optional[float],
        speed: Optional[float],
    ) -> None:
        if well_core is not None:
            if isinstance(location, (TrashBin, WasteChute)):
                raise ValueError("Trash Bin and Waste Chute have no Wells.")
            labware_id = well_core.labware_id
            well_name = well_core.get_name()
            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )

            self._engine_client.execute_command(
                cmd.MoveToWellParams(
                    pipetteId=self._pipette_id,
                    labwareId=labware_id,
                    wellName=well_name,
                    wellLocation=well_location,
                    minimumZHeight=minimum_z_height,
                    forceDirect=force_direct,
                    speed=speed,
                )
            )
        else:
            if isinstance(location, (TrashBin, WasteChute)):
                self._move_to_disposal_location(
                    disposal_location=location, force_direct=force_direct, speed=speed
                )
            else:
                self._engine_client.execute_command(
                    cmd.MoveToCoordinatesParams(
                        pipetteId=self._pipette_id,
                        coordinates=DeckPoint(
                            x=location.point.x, y=location.point.y, z=location.point.z
                        ),
                        minimumZHeight=minimum_z_height,
                        forceDirect=force_direct,
                        speed=speed,
                    )
                )
        if isinstance(location, (TrashBin, WasteChute)):
            self._protocol_core.set_last_location(location=None, mount=self.get_mount())
        else:
            self._protocol_core.set_last_location(
                location=location, mount=self.get_mount()
            )

    def get_mount(self) -> Mount:
        """Get the mount the pipette is attached to."""
        return self._engine_client.state.pipettes.get(
            self._pipette_id
        ).mount.to_hw_mount()

    def get_pipette_name(self) -> str:
        """Get the pipette's load name as a string.

        Will match the load name of the actually loaded pipette,
        which may differ from the requested load name.
        """
        # TODO (tz, 11-23-22): revert this change when merging
        # https://opentrons.atlassian.net/browse/RLIQ-251
        pipette = self._engine_client.state.pipettes.get(self._pipette_id)
        return (
            pipette.pipetteName.value
            if isinstance(pipette.pipetteName, PipetteNameType)
            else pipette.pipetteName
        )

    def get_model(self) -> str:
        return self._engine_client.state.pipettes.get_model_name(self._pipette_id)

    def get_display_name(self) -> str:
        return self._engine_client.state.pipettes.get_display_name(self._pipette_id)

    def get_min_volume(self) -> float:
        return self._engine_client.state.pipettes.get_minimum_volume(self._pipette_id)

    def get_max_volume(self) -> float:
        return self._engine_client.state.pipettes.get_maximum_volume(self._pipette_id)

    def get_working_volume(self) -> float:
        return self._engine_client.state.pipettes.get_working_volume(self._pipette_id)

    def get_current_volume(self) -> float:
        try:
            current_volume = self._engine_client.state.pipettes.get_aspirated_volume(
                self._pipette_id
            )
        except TipNotAttachedError:
            current_volume = None

        return current_volume or 0

    def get_available_volume(self) -> float:
        try:
            available_volume = self._engine_client.state.pipettes.get_available_volume(
                self._pipette_id
            )
        except TipNotAttachedError:
            available_volume = None

        return available_volume or 0

    def get_hardware_state(self) -> PipetteDict:
        """Get the current state of the pipette hardware as a dictionary."""
        return self._sync_hardware_api.get_attached_instrument(self.get_mount())  # type: ignore[no-any-return]

    def get_channels(self) -> int:
        return self._engine_client.state.tips.get_pipette_channels(self._pipette_id)

    def get_active_channels(self) -> int:
        return self._engine_client.state.tips.get_pipette_active_channels(
            self._pipette_id
        )

    def get_nozzle_map(self) -> NozzleMap:
        return self._engine_client.state.tips.get_pipette_nozzle_map(self._pipette_id)

    def has_tip(self) -> bool:
        return (
            self._engine_client.state.pipettes.get_attached_tip(self._pipette_id)
            is not None
        )

    def get_return_height(self) -> float:
        return self._engine_client.state.pipettes.get_return_tip_scale(self._pipette_id)

    def get_flow_rate(self) -> FlowRates:
        return self._flow_rates

    def get_aspirate_flow_rate(self, rate: float = 1.0) -> float:
        return self._aspirate_flow_rate * rate

    def get_dispense_flow_rate(self, rate: float = 1.0) -> float:
        return self._dispense_flow_rate * rate

    def get_blow_out_flow_rate(self, rate: float = 1.0) -> float:
        return self._blow_out_flow_rate * rate

    def get_nozzle_configuration(self) -> NozzleConfigurationType:
        return self._engine_client.state.pipettes.get_nozzle_layout_type(
            self._pipette_id
        )

    def get_liquid_presence_detection(self) -> bool:
        return self._liquid_presence_detection

    def is_tip_tracking_available(self) -> bool:
        if self.get_nozzle_configuration() == NozzleConfigurationType.FULL:
            return True
        else:
            if self.get_channels() == 96:
                return True
            if self.get_channels() == 8:
                return True
        return False

    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        if aspirate is not None:
            assert aspirate > 0
            self._aspirate_flow_rate = aspirate
        if dispense is not None:
            assert dispense > 0
            self._dispense_flow_rate = dispense
        if blow_out is not None:
            assert blow_out > 0
            self._blow_out_flow_rate = blow_out

    def set_liquid_presence_detection(self, enable: bool) -> None:
        self._liquid_presence_detection = enable

    def configure_for_volume(self, volume: float) -> None:
        self._engine_client.execute_command(
            cmd.ConfigureForVolumeParams(
                pipetteId=self._pipette_id,
                volume=volume,
                tipOverlapNotAfterVersion=overlap_versions.overlap_for_api_version(
                    self._protocol_core.api_version
                ),
            )
        )

    def prepare_to_aspirate(self) -> None:
        self._engine_client.execute_command(
            cmd.PrepareToAspirateParams(pipetteId=self._pipette_id)
        )

    def configure_nozzle_layout(
        self,
        style: NozzleLayout,
        primary_nozzle: Optional[str],
        front_right_nozzle: Optional[str],
        back_left_nozzle: Optional[str],
    ) -> None:
        if style == NozzleLayout.COLUMN:
            configuration_model: NozzleLayoutConfigurationType = (
                ColumnNozzleLayoutConfiguration(
                    primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle)
                )
            )
        elif style == NozzleLayout.ROW:
            configuration_model = RowNozzleLayoutConfiguration(
                primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle)
            )
        elif style == NozzleLayout.QUADRANT or style == NozzleLayout.PARTIAL_COLUMN:
            assert (
                # We make sure to set these nozzles in the calling function
                # if using QUADRANT or PARTIAL_COLUMN. Asserting only for type verification here.
                front_right_nozzle is not None
                and back_left_nozzle is not None
            ), f"Both front right and back left nozzles are required for {style} configuration."
            configuration_model = QuadrantNozzleLayoutConfiguration(
                primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle),
                frontRightNozzle=front_right_nozzle,
                backLeftNozzle=back_left_nozzle,
            )
        elif style == NozzleLayout.SINGLE:
            configuration_model = SingleNozzleLayoutConfiguration(
                primaryNozzle=cast(PRIMARY_NOZZLE_LITERAL, primary_nozzle)
            )
        else:
            configuration_model = AllNozzleLayoutConfiguration()
        self._engine_client.execute_command(
            cmd.ConfigureNozzleLayoutParams(
                pipetteId=self._pipette_id, configurationParams=configuration_model
            )
        )

    def retract(self) -> None:
        """Retract this instrument to the top of the gantry."""
        z_axis = self._engine_client.state.pipettes.get_z_axis(self._pipette_id)
        self._engine_client.execute_command(cmd.HomeParams(axes=[z_axis]))

    def detect_liquid_presence(self, well_core: WellCore, loc: Location) -> bool:
        labware_id = well_core.labware_id
        well_name = well_core.get_name()
        well_location = WellLocation(
            origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=0)
        )

        # The error handling here is a bit nuanced and also a bit broken:
        #
        # - If the hardware detects liquid, the `tryLiquidProbe` engine command will
        #   succeed and return a height, which we'll convert to a `True` return.
        #   Okay so far.
        #
        # - If the hardware detects no liquid, the `tryLiquidProbe` engine command will
        #   succeed and return `None`, which we'll convert to a `False` return.
        #   Still okay so far.
        #
        # - If there is any other error within the `tryLiquidProbe` command, things get
        #   messy. It may kick the run into recovery mode. At that point, all bets are
        #   off--we lose our guarantee of having a `tryLiquidProbe` command whose
        #   `result` we can inspect. We don't know how to deal with that here, so we
        #   currently propagate the exception up, which will quickly kill the protocol,
        #   after a potential split second of recovery mode. It's unclear what would
        #   be good user-facing behavior here, but it's unfortunate to kill the protocol
        #   for an error that the engine thinks should be recoverable.
        result = self._engine_client.execute_command_without_recovery(
            cmd.TryLiquidProbeParams(
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                pipetteId=self.pipette_id,
            )
        )

        self._protocol_core.set_last_location(location=loc, mount=self.get_mount())

        return result.z_position is not None

    def liquid_probe_with_recovery(self, well_core: WellCore, loc: Location) -> None:
        labware_id = well_core.labware_id
        well_name = well_core.get_name()
        well_location = WellLocation(
            origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=2)
        )
        self._engine_client.execute_command(
            cmd.LiquidProbeParams(
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                pipetteId=self.pipette_id,
            )
        )

        self._protocol_core.set_last_location(location=loc, mount=self.get_mount())

    def liquid_probe_without_recovery(
        self, well_core: WellCore, loc: Location
    ) -> float:
        labware_id = well_core.labware_id
        well_name = well_core.get_name()
        well_location = WellLocation(
            origin=WellOrigin.TOP, offset=WellOffset(x=0, y=0, z=2)
        )
        result = self._engine_client.execute_command_without_recovery(
            cmd.LiquidProbeParams(
                labwareId=labware_id,
                wellName=well_name,
                wellLocation=well_location,
                pipetteId=self.pipette_id,
            )
        )

        self._protocol_core.set_last_location(location=loc, mount=self.get_mount())

        return result.z_position

    def transfer(
        self,
        liquid_class: LiquidClass,
        volume: float,
        transfers: List[SingleTransfer],
    ) -> None:
        """Perform transfers as specified."""
        tiprack_name_for_transfer = "get-tiprack-name-from-appropriate-info"
        transfer_props = liquid_class.get_for(
            self.get_pipette_name(), tiprack_name_for_transfer
        )

        pe_liquid_class = self._engine_client.execute_command_without_recovery(
            cmd.LoadLiquidClassParams(
                pipetteId=self._pipette_id,
                tiprackId=tiprack_name_for_transfer,
                aspirateProperties=transfer_props.aspirate,
                singleDispenseProperties=transfer_props.dispense,
                multiDispenseProperties=transfer_props.multi_dispense,
            )
        ).loadedLiquidClass

        self._transfer_steps_for_aspirate(
            liquid_class=pe_liquid_class,
            volume=volume,
            transfers=transfers,
        )
        self._transfer_steps_for_single_dispense(
            liquid_class=pe_liquid_class,
            volume=volume,
            transfers=transfers,
        )

    def _transfer_steps_for_aspirate(
        self,
        liquid_class: ImmutableLiquidClass,
        volume: float,
        transfers: List[SingleTransfer],
    ) -> None:
        """Perform pre-aspirate steps, aspirate and post-aspiration steps.

        Sequence:
            1. Submerge
            2. Delay (optional)
            3. Pre-wet (optional)
            4. Mix (optional)
            5. Aspirate
            6. Delay (optional)
            7. Retract
            8. Delay (optional)
            9. Touch tip (optional)
            10. Air gap (optional)
        """

        aspirate_props = liquid_class.aspirateProperties
        for transfer in transfers:
            if transfer.pick_up_tip.pick_up_new:
                self._engine_client.execute_command(
                    cmd.PickUpTipParams(..., liquidClassId=liquid_class.id)
                )

            # Submerge
            # ------------
            # Drawback of using the existing move-to command is that there's no good way
            # to differentiate between the different move-to's to have the run log show
            # that it's a submerge step or retract step
            self._engine_client.execute_command(
                cmd.MoveToWellParams(
                    pipetteId=self._pipette_id,
                    labwareId=transfer.source_well.labware_id,
                    wellName=transfer.source_well.get_name(),
                    wellLocation="<get well location from well core + submerge params>",
                    speed=aspirate_props.submerge.speed,
                    liquidClassId=liquid_class.id,
                )
            )
            # Post-submerge delay
            if aspirate_props.submerge.delay.enable:
                self._engine_client.execute_command(
                    cmd.WaitForDurationParams(
                        seconds=aspirate_props.submerge.delay.params.duration,
                        liquidClassId=liquid_class.id,
                        # hmm.. adding a liquid class id to a wait for feels kinda weird
                    )
                )
            # Pre-wet
            if aspirate_props.preWet:
                self._engine_client.execute_command(
                    cmd.AspirateParams(
                        ..., liquidClassId=liquid_class.id
                    )  # use same vol as transfer volume
                )
            # Mix
            # -----
            # Similar drawback as noted in 'submerge' - can't show that this
            # aspirate-dispense combo step is a part of a mix
            if aspirate_props.mix.enable:
                for _ in range(aspirate_props.mix.params.repetitions):
                    self._engine_client.execute_command(
                        cmd.AspirateParams(
                            pipetteId=self._pipette_id,
                            volume=aspirate_props.mix.params.volume,
                            flowRate=aspirate_props.flowRateByVolume.get(volume),
                            # This will need to provide interpolated/ extrapolated value for the volume in question
                            labwareId=transfer.source_well.labware_id,
                            wellName=transfer.source_well.get_name(),
                            wellLocation="<get well location from well core + aspirate well offset? >",
                            # find out which well location to use for mix
                            liquidClassId=liquid_class.id,
                        )
                    )
                    self._engine_client.execute_command(
                        cmd.DispenseParams(
                            pipetteId=self._pipette_id,
                            volume=aspirate_props.mix.params.volume,
                            flowRate=liquid_class.singleDispenseProperties.flowRateByVolume.get(
                                volume
                            ),
                            # This will need to provide interpolated/ extrapolated value for the volume in question
                            labwareId=transfer.source_well.labware_id,
                            wellName=transfer.source_well.get_name(),
                            wellLocation="<get well location from well core + aspirate well offset? >",
                            # find out which well location to use for mix
                            liquidClassId=liquid_class.id,
                        )
                    )
            # Aspirate
            self._engine_client.execute_command(
                cmd.AspirateParams(
                    pipetteId=self._pipette_id,
                    volume=volume,
                    flowRate=aspirate_props.flowRateByVolume.get(volume),
                    # This will need to provide interpolated/ extrapolated value for the volume in question
                    labwareId=transfer.source_well.labware_id,
                    wellName=transfer.source_well.get_name(),
                    wellLocation="<get well location from well core + aspirate well offset >",
                    liquidClassId=liquid_class.id,
                )
            )
            # Post-aspirate delay
            if aspirate_props.delay.enable:
                self._engine_client.execute_command(
                    cmd.WaitForDurationParams(
                        seconds=aspirate_props.delay.params.duration,
                        liquidClassId=liquid_class.id,
                    )
                )
            # Post-aspirate retract
            self._engine_client.execute_command(
                cmd.MoveToWellParams(
                    pipetteId=self._pipette_id,
                    labwareId=transfer.source_well.labware_id,
                    wellName=transfer.source_well.get_name(),
                    wellLocation="<get well location from well core + retract params>",
                    speed=aspirate_props.retract.speed,
                    liquidClassId=liquid_class.id,
                )
            )
            # Post-aspirate touch tip
            if aspirate_props.retract.touchTip.enable:
                self._engine_client.execute_command(
                    cmd.TouchTipParams(
                        pipetteId=self._pipette_id,
                        labwareId=transfer.source_well.labware_id,
                        wellName=transfer.source_well.get_name(),
                        wellLocation=transfer.source_well.get_top(
                            z_offset=aspirate_props.retract.touchTip.params.zOffset
                        ),
                        mmToEdge=aspirate_props.retract.touchTip.params.mmToEdge,  # anticipated new param to touch tip command
                        speed=aspirate_props.retract.touchTip.params.speed,
                        liquidClassId=liquid_class.id,
                    )
                )
            # Post-retract delay
            if aspirate_props.retract.delay.enable:
                self._engine_client.execute_command(
                    cmd.WaitForDurationParams(
                        seconds=aspirate_props.retract.delay.params.duration,
                        liquidClassId=liquid_class.id,
                    )
                )
            # Post-retract air gap
            self._engine_client.execute_command(
                cmd.AspirateInPlaceParams(
                    pipetteId=self._pipette_id,
                    volume=aspirate_props.retract.airGapByVolume(volume),
                    flowRate=aspirate_props.flowRateByVolume.get(
                        volume
                    ),  # This will need to provide interpolated/ extrapolated value for the volume in question
                    liquidClassId=liquid_class.id,
                )
            )

    def _transfer_steps_for_single_dispense(
        self,
        liquid_class: ImmutableLiquidClass,
        volume: float,
        transfers: List[SingleTransfer],
    ) -> None:
        """Perform pre-dispense steps, dispense and post-dispense steps.

        Sequence:
            1. Submerge
            2. Delay (optional)
            3. Dispense (with optional push-out)
            4. Mix (optional)
            5. Push out (optional)
            6. Delay (optional)
            7. Retract
            8. Delay (optional)
            9. Blow out (optional)
            10. Touch tip (optional)
            11. Air gap (optional)
        """
        dispense_props = liquid_class.singleDispenseProperties
        for transfer in transfers:
            # Submerge
            # ------------
            # Drawback of using the existing move-to command is that there's no good way
            # to differentiate between the different move-to's to have the run log show
            # that it's a submerge step or retract step
            self._engine_client.execute_command(
                cmd.MoveToWellParams(
                    pipetteId=self._pipette_id,
                    labwareId=transfer.dest_well.labware_id,
                    wellName=transfer.dest_well.get_name(),
                    wellLocation="<get well location from dest well core + submerge params>",
                    speed=dispense_props.submerge.speed,
                    liquidClassId=liquid_class.id,
                )
            )
            # Post-submerge delay
            if dispense_props.submerge.delay.enable:
                self._engine_client.execute_command(
                    cmd.WaitForDurationParams(
                        seconds=dispense_props.submerge.delay.params.duration,
                        liquidClassId=liquid_class.id,
                        # hmm.. adding a liquid class id to a wait for feels kinda weird
                    )
                )
            # Dispense
            self._engine_client.execute_command(
                cmd.DispenseParams(
                    pipetteId=self._pipette_id,
                    volume=volume,
                    flowRate=dispense_props.flowRateByVolume.get(
                        volume
                    ),  # This will need to provide interpolated/ extrapolated value for the volume in question
                    labwareId=transfer.source_well.labware_id,
                    wellName=transfer.source_well.get_name(),
                    wellLocation="<get well location from well core + dispense well offset >",
                    pushOut=dispense_props.pushOutByVolume.get(
                        volume
                    ),  # This will need to provide interpolated/ extrapolated value for the volume in question
                    liquidClassId=liquid_class.id,
                )
            )
            # Mix
            # -----
            # Similar drawback as noted in 'submerge' - can't show that this
            # aspirate-dispense combo step is a part of a mix
            if dispense_props.mix.enable:
                for _ in range(dispense_props.mix.params.repetitions):
                    self._engine_client.execute_command(
                        cmd.AspirateParams(
                            pipetteId=self._pipette_id,
                            volume=dispense_props.mix.params.volume,
                            flowRate=liquid_class.aspirateProperties.flowRateByVolume.get(
                                volume
                            ),
                            # This will need to provide interpolated/ extrapolated value for the volume in question
                            labwareId=transfer.dest_well.labware_id,
                            wellName=transfer.dest_well.get_name(),
                            wellLocation="<get well location from well core + aspirate well offset? >",
                            # find out which well location to use for mix
                            liquidClassId=liquid_class.id,
                        )
                    )
                    self._engine_client.execute_command(
                        cmd.DispenseParams(
                            pipetteId=self._pipette_id,
                            volume=dispense_props.mix.params.volume,
                            flowRate=dispense_props.flowRateByVolume.get(volume),
                            # This will need to provide interpolated/ extrapolated value for the volume in question
                            labwareId=transfer.dest_well.labware_id,
                            wellName=transfer.dest_well.get_name(),
                            wellLocation="<get well location from well core + dispense well offset? >",
                            pushOut=dispense_props.pushOutByVolume.get(
                                volume
                            ),  # This will need to provide interpolated/ extrapolated value for the volume in question
                            # find out which well location to use for mix
                            liquidClassId=liquid_class.id,
                        )
                    )

            # Post-dispense delay
            if dispense_props.delay.enable:
                self._engine_client.execute_command(
                    cmd.WaitForDurationParams(
                        seconds=dispense_props.delay.params.duration,
                        liquidClassId=liquid_class.id,
                    )
                )
            # Post-dispense retract
            self._engine_client.execute_command(
                cmd.MoveToWellParams(
                    pipetteId=self._pipette_id,
                    labwareId=transfer.dest_well.labware_id,
                    wellName=transfer.dest_well.get_name(),
                    wellLocation="<get well location from well core + retract params>",
                    speed=dispense_props.retract.speed,
                    liquidClassId=liquid_class.id,
                )
            )
            # Post-retract delay
            if dispense_props.retract.delay.enable:
                self._engine_client.execute_command(
                    cmd.WaitForDurationParams(
                        seconds=dispense_props.retract.delay.params.duration,
                        liquidClassId=liquid_class.id,
                    )
                )

            # Blow out
            if dispense_props.retract.blowout.enable:
                blow_out_loc_enum = dispense_props.retract.blowout.params.location
                match blow_out_loc_enum:
                    case BlowoutLocation.SOURCE:
                        blow_out_loc = transfer.source_well
                    case BlowoutLocation.DESTINATION:
                        blow_out_loc = transfer.dest_well
                    case BlowoutLocation.TRASH:
                        blow_out_loc = "<get the disposal location from somewhere>"
                if blow_out_loc_enum == BlowoutLocation.TRASH:
                    # <do a move to addressable area>
                    # <do a blowout in place>
                    pass

                else:
                    self._engine_client.execute_command(
                        cmd.BlowOutParams(
                            pipetteId=self._pipette_id,
                            flowRate=dispense_props.retract.blowout.params.flowRate,
                            labwareId=blow_out_loc.labware_id,
                            wellName=blow_out_loc.get_name(),
                            wellLocation="<get well location from well core + dispense well offset? >",
                            # find out which well location to use for mix
                            liquidClassId=liquid_class.id,
                        )
                    )

            # Post-dispense touch tip
            if dispense_props.retract.touchTip.enable:
                self._engine_client.execute_command(
                    cmd.TouchTipParams(
                        pipetteId=self._pipette_id,
                        labwareId=transfer.dest_well.labware_id,
                        wellName=transfer.dest_well.get_name(),
                        wellLocation=transfer.dest_well.get_top(
                            z_offset=dispense_props.retract.touchTip.params.zOffset
                        ),
                        mmToEdge=dispense_props.retract.touchTip.params.mmToEdge,  # anticipated new param to touch tip command
                        speed=dispense_props.retract.touchTip.params.speed,
                        liquidClassId=liquid_class.id,
                    )
                )

            # Air gap
            # Post-retract air gap
            self._engine_client.execute_command(
                cmd.AspirateInPlaceParams(
                    pipetteId=self._pipette_id,
                    volume=dispense_props.retract.airGapByVolume(volume),
                    flowRate=liquid_class.aspirateProperties.flowRateByVolume.get(
                        volume
                    ),
                    # This will need to provide interpolated/ extrapolated value for the volume in question
                    liquidClassId=liquid_class.id,
                )
            )


@dataclasses.dataclass
class PickUpTipInfo:
    tip_location: WellCore
    pick_up_new: bool


@dataclasses.dataclass
class DropTipInfo:
    drop_tip: bool
    location: Union[Location, _DisposalLocation]


@dataclasses.dataclass
class SingleTransfer:
    pick_up_tip: PickUpTipInfo
    source_well: WellCore
    dest_well: WellCore
    drop_tip: DropTipInfo
