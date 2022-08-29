import logging
from typing import Dict, Optional

from opentrons.types import Mount

from ..protocol import AbstractProtocol
from ..protocol_api.protocol_context import ProtocolContextImplementation
from ..protocol_api.labware import LabwareImplementation

from .instrument_context import InstrumentContextSimulation


logger = logging.getLogger(__name__)


class ProtocolContextSimulation(
    ProtocolContextImplementation,
    AbstractProtocol[InstrumentContextSimulation, LabwareImplementation],
):
    _instruments: Dict[Mount, Optional[InstrumentContextSimulation]]  # type: ignore[assignment]

    def load_instrument(  # type: ignore[override]
        self, instrument_name: str, mount: Mount, replace: bool
    ) -> InstrumentContextSimulation:
        """Create a simulating instrument context."""
        instr = self._instruments[mount]
        if instr:
            # There's already an instrument on this mount.
            if not replace:
                # If not replacing then error.
                raise RuntimeError(
                    f"Instrument already present in {mount.name.lower()} "
                    f"mount: {instr.get_instrument_name()}"
                )
            elif instr.get_instrument_name() == instrument_name:
                # Replacing with the exact same instrument name. Just return the
                # existing instrument instance.
                return instr

        attached = {
            att_mount: instr.get("name", None)
            for att_mount, instr in self._sync_hardware.attached_instruments.items()
            if instr
        }
        attached[mount] = instrument_name
        self._sync_hardware.cache_instruments(attached)

        new_instr = InstrumentContextSimulation(
            protocol_interface=self,
            pipette_dict=self._sync_hardware.get_attached_instruments()[mount],
            mount=mount,
            instrument_name=instrument_name,
            api_version=self._api_version,
        )
        self._instruments[mount] = new_instr
        logger.info(f"Instrument {new_instr} loaded")
        return new_instr
