from opentrons.protocol_api import ProtocolContext
from helpers import load_config, pick_up_then_drop  # type: ignore[import]

metadata = {"apiLevel": "2.6"}


def run(protocol: ProtocolContext) -> None:
    configuration = load_config("basic_transfer_config.json")

    plate = protocol.load_labware(configuration["plate"], 1)
    tiprack_1 = protocol.load_labware(configuration["tiprack"], 2)
    instrument = protocol.load_instrument(
        configuration["instrument"]["model"],
        configuration["instrument"]["mount"],
        tip_racks=[tiprack_1],
    )

    transfers = configuration["transfers"]
    for transfer in transfers:
        with pick_up_then_drop(instrument):
            ml = transfer["ml"]
            instrument.aspirate(ml, plate[transfer["source_well"]])
            instrument.dispense(ml, plate[transfer["target_well"]])
