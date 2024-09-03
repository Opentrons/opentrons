import logging
from typing import Dict, Optional

from opentrons_shared_data.pipette.types import PipetteNameType
from opentrons_shared_data.pipette.pipette_load_name_conversions import (
    convert_to_pipette_name_type,
)
from opentrons_shared_data.pipette.types import PipetteGenerationType

from opentrons.types import Mount

from ..protocol import AbstractProtocol
from ..legacy.legacy_protocol_core import LegacyProtocolCore
from ..legacy.legacy_labware_core import LegacyLabwareCore
from ..legacy.legacy_module_core import LegacyModuleCore
from ..legacy.load_info import InstrumentLoadInfo

from .legacy_instrument_core import LegacyInstrumentCoreSimulator

logger = logging.getLogger(__name__)


class LegacyProtocolCoreSimulator(
    LegacyProtocolCore,
    AbstractProtocol[
        LegacyInstrumentCoreSimulator, LegacyLabwareCore, LegacyModuleCore
    ],
):
    _instruments: Dict[Mount, Optional[LegacyInstrumentCoreSimulator]]  # type: ignore[assignment]

    def load_instrument(  # type: ignore[override]
        self,
        instrument_name: PipetteNameType,
        mount: Mount,
        liquid_presence_detection: bool = False,
    ) -> LegacyInstrumentCoreSimulator:
        """Create a simulating instrument context."""
        pipette_generation = convert_to_pipette_name_type(
            instrument_name.value
        ).pipette_generation

        if pipette_generation not in [
            PipetteGenerationType.GEN1,
            PipetteGenerationType.GEN2,
        ]:
            raise ValueError(f"{instrument_name} is not a valid OT-2 pipette.")

        existing_instrument = self._instruments[mount]

        if (
            existing_instrument
            and existing_instrument.get_requested_as_name() == instrument_name.value
        ):
            # Replacing with the exact same instrument name. Just return the
            # existing instrument instance.
            return existing_instrument

        attached = {
            att_mount: instr.get("name", None)
            for att_mount, instr in self._sync_hardware.attached_instruments.items()
            if instr
        }
        attached[mount] = instrument_name.value
        self._sync_hardware.cache_instruments(attached)

        pipette_dict = self._sync_hardware.get_attached_instruments()[mount]
        new_instr = LegacyInstrumentCoreSimulator(
            protocol_interface=self,
            pipette_dict=pipette_dict,
            mount=mount,
            instrument_name=instrument_name.value,
            api_version=self._api_version,
        )
        self._instruments[mount] = new_instr

        logger.info(f"Instrument {new_instr} loaded")
        self._equipment_broker.publish(
            InstrumentLoadInfo(
                instrument_load_name=instrument_name.value,
                mount=mount,
                pipette_dict=pipette_dict,
            )
        )

        return new_instr
