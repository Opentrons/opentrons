from opentrons import protocol_api
from opentrons import types

metadata = {
    'protocolName': 'lld overpressure stuff ',
    'author': 'Your Name <your.email@example.com>'
}

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.22'
}


def run(ctx: protocol_api.ProtocolContext):

    pcr = ctx.load_labware(load_name='opentrons_tough_1_reservoir_300ml', location='D2', version=1)
    reservoir = ctx.load_labware(load_name='nest_1_reservoir_195ml', location='D3', version=3)
    tiprack = ctx.load_labware('opentrons_flex_96_tiprack_1000ul', 'C2')

    pip = ctx.load_instrument('flex_1channel_1000', 'left', tip_racks=[tiprack])
    offset = -0.5
    reservoir_well = reservoir["A1"]
    pcr_well = pcr["A1"]
    volume = 750

    reservoir.load_empty(reservoir.wells())
    pcr.load_empty(pcr.wells())

    pip.pick_up_tip()
    pip.measure_liquid_height(reservoir_well)
    pip.measure_liquid_height(pcr_well)
    pip.return_tip()

    pip.flow_rate.aspirate = 716
    pip.flow_rate.dispense = 716

    def _test_well() -> None:
        pip.pick_up_tip()
        
        pip.transfer(
            volume, 
            pcr_well.meniscus(z=offset, target="end"),
            reservoir_well.meniscus(z=offset, target="end"),
            new_tip="never"
        )
        ctx.pause(f"meniscus position = {pcr_well.meniscus(z=-0.5)}")
        pip.move_to(pcr_well.meniscus(z=-0.5))
        ctx.pause()
        pip.move_to(pcr_well.bottom(z=-0.5))
        ctx.pause()

        pip.transfer(
            volume, 
            reservoir_well.meniscus(z=offset, target="end"),
            pcr_well.meniscus(z=offset, target="end"),
            new_tip="never"
        )
        pip.move_to(reservoir_well.meniscus(z=-0.5))
        ctx.pause()
        pip.move_to(reservoir_well.bottom(z=-0.5))
        ctx.pause()

        pip.return_tip()

    for i in range(38):
        _test_well()