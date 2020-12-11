from opentrons import types
from opentrons.protocols.implementations.interfaces.instrument_context import \
    InstrumentContextInterface
from opentrons.protocols.implementations.protocol_context import \
    ProtocolContextImplementation
from opentrons.protocols.implementations.simulators.instrument_context import \
    SimInstrumentContext


class SimProtocolContext(ProtocolContextImplementation):
    def load_instrument(self,
                        instrument_name: str,
                        mount: types.Mount,
                        replace: bool = False) -> InstrumentContextInterface:
        """Create a simulating instrument context."""
        instr = self._instruments[mount]
        if instr and not replace:
            raise RuntimeError(
                f"Instrument already present in {mount.name.lower()} "
                f"mount: {instr.get_instrument_name()}")

        attached = {att_mount: instr.get('name', None)
                    for att_mount, instr
                    in self._hw_manager.hardware.attached_instruments.items()
                    if instr}
        attached[mount] = instrument_name
        self._hw_manager.hardware.cache_instruments(attached)

        new_instr = SimInstrumentContext(
            protocol_interface=self,
            pipette_dict=self._hw_manager.hardware.get_attached_instruments()[
                mount
            ],
            mount=mount,
            instrument_name=instrument_name,
        )
        self._instruments[mount] = new_instr
        self._log.info(f"Instrument {new_instr} loaded")
        return new_instr
