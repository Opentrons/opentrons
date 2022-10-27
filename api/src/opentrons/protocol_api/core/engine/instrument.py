"""ProtocolEngine-based InstrumentContext core implementation."""
from typing import Optional

from opentrons.types import Location, Mount
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.dev_types import PipetteDict
from opentrons.protocols.api_support.util import Clearances, PlungerSpeeds, FlowRates
from opentrons.protocol_engine import DeckPoint
from opentrons.protocol_engine.clients import SyncClient as EngineClient

from ..instrument import AbstractInstrument
from .well import WellCore


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
    ) -> None:
        self._pipette_id = pipette_id
        self._engine_client = engine_client
        self._sync_hardware_api = sync_hardware_api

    @property
    def pipette_id(self) -> str:
        """The instrument's unique ProtocolEngine ID."""
        return self._pipette_id

    def get_default_speed(self) -> float:
        raise NotImplementedError("InstrumentCore.get_default_speed not implemented")

    def set_default_speed(self, speed: float) -> None:
        raise NotImplementedError("InstrumentCore.set_default_speed not implemented")

    def aspirate(self, volume: float, rate: float) -> None:
        raise NotImplementedError("InstrumentCore.aspirate not implemented")

    def dispense(self, volume: float, rate: float) -> None:
        raise NotImplementedError("InstrumentCore.dispense not implemented")

    def blow_out(self) -> None:
        raise NotImplementedError("InstrumentCore.blow_out not implemented")

    def touch_tip(
        self,
        location: WellCore,
        radius: float,
        v_offset: float,
        speed: float,
    ) -> None:
        raise NotImplementedError("InstrumentCore.touch_tip not implemented")

    def pick_up_tip(
        self,
        well: WellCore,
        tip_length: float,
        presses: Optional[int],
        increment: Optional[float],
        prep_after: bool,
    ) -> None:
        raise NotImplementedError("InstrumentCore.pick_up_tip not implemented")

    def drop_tip(self, home_after: bool) -> None:
        raise NotImplementedError("InstrumentCore.drop_tip not implemented")

    def home(self) -> None:
        raise NotImplementedError("InstrumentCore.home not implemented")

    def home_plunger(self) -> None:
        raise NotImplementedError("InstrumentCore.home_plunger not implemented")

    def move_to(
        self,
        location: Location,
        well_core: Optional[WellCore],
        force_direct: bool,
        minimum_z_height: Optional[float],
        speed: Optional[float],
    ) -> None:
        if speed is not None:
            raise NotImplementedError(
                "InstrumentCore.move_to with explicit speed not implemented"
            )

        if well_core is not None and (
            force_direct is True or minimum_z_height is not None
        ):
            raise NotImplementedError(
                "InstrumentCore.move_to with well and extra move parameters not implemented"
            )

        if well_core is not None:
            if force_direct is True or minimum_z_height is not None:
                raise NotImplementedError(
                    "InstrumentCore.move_to with well and extra move parameters not implemented"
                )

            labware_id = well_core.labware_id
            well_name = well_core.get_name()
            well_location = (
                self._engine_client.state.geometry.get_relative_well_location(
                    labware_id=labware_id,
                    well_name=well_name,
                    absolute_point=location.point,
                )
            )

            self._engine_client.move_to_well(
                pipette_id=self._pipette_id,
                labware_id=labware_id,
                well_name=well_name,
                well_location=well_location,
            )
        else:
            self._engine_client.move_to_coordinates(
                pipette_id=self._pipette_id,
                coordinates=DeckPoint(
                    x=location.point.x, y=location.point.y, z=location.point.z
                ),
                minimum_z_height=minimum_z_height,
                force_direct=force_direct,
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
        return self._engine_client.state.pipettes.get(
            self._pipette_id
        ).pipetteName.value

    def get_model(self) -> str:
        raise NotImplementedError("InstrumentCore.get_model not implemented")

    def get_min_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_min_volume not implemented")

    def get_max_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_max_volume not implemented")

    def get_current_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_current_volume not implemented")

    def get_available_volume(self) -> float:
        raise NotImplementedError("InstrumentCore.get_available_volume not implemented")

    def get_hardware_state(self) -> PipetteDict:
        """Get the current state of the pipette hardware as a dictionary."""
        return self._sync_hardware_api.get_attached_instrument(self.get_mount())  # type: ignore[no-any-return]

    def get_channels(self) -> int:
        raise NotImplementedError("InstrumentCore.get_channels not implemented")

    def has_tip(self) -> bool:
        raise NotImplementedError("InstrumentCore.has_tip not implemented")

    def is_ready_to_aspirate(self) -> bool:
        raise NotImplementedError("InstrumentCore.is_ready_to_aspirate not implemented")

    def prepare_for_aspirate(self) -> None:
        raise NotImplementedError("InstrumentCore.prepare_for_aspirate not implemented")

    def get_return_height(self) -> float:
        raise NotImplementedError("InstrumentCore.get_return_height not implemented")

    def get_well_bottom_clearance(self) -> Clearances:
        raise NotImplementedError(
            "InstrumentCore.get_well_bottom_clearance not implemented"
        )

    def get_speed(self) -> PlungerSpeeds:
        raise NotImplementedError("InstrumentCore.get_speed not implemented")

    def get_flow_rate(self) -> FlowRates:
        raise NotImplementedError("InstrumentCore.get_flow_rate not implemented")

    def set_flow_rate(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        raise NotImplementedError("InstrumentCore.set_flow_rate not implemented")

    def set_pipette_speed(
        self,
        aspirate: Optional[float] = None,
        dispense: Optional[float] = None,
        blow_out: Optional[float] = None,
    ) -> None:
        raise NotImplementedError("InstrumentCore.set_pipette_speed not implemented")
