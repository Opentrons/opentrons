from dataclasses import dataclass
from typing import Any


requirements = {"robotType": "Flex", "apiLevel": "2.24"}
metadata = {"protocolName": "PAPI Changes", "description": "Test PAPI changes for Interop in 2.24"}


def run(ctx):

    tiprack_50 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    filter_tiprack_50 = ctx.load_labware("opentrons_flex_96_filtertiprack_50ul", "C1")
    trash = ctx.load_trash_bin("A3")

    source = ctx.load_labware("nest_12_reservoir_15ml", "B1", "source")


    # Target
    # https://labware.opentrons.com/#/?loadName=nest_96_wellplate_2ml_deep
    target = ctx.load_labware("nest_96_wellplate_2ml_deep", "D2")


    pipette_50 = ctx.load_instrument("flex_1channel_50", "right", tip_racks=[tiprack_50])
    pipette_8ch_50 = ctx.load_instrument("flex_8channel_50", "left", tip_racks=[filter_tiprack_50])

    # Happy path test cases for API 2.24 features
    # 1. Test aspirate/dispense/air_gap with flow_rate (expect success)
    pipette_50.pick_up_tip()
    pipette_50.aspirate(20, source.wells()[0], flow_rate=10)
    pipette_50.air_gap(5, flow_rate=5)
    pipette_50.dispense(20, target.wells()[0], flow_rate=10)
    pipette_50.drop_tip()

    # 2. Test mix with aspirate_flow_rate (expect success)
    # 3. Test mix with dispense_flow_rate (expect success)
    pipette_50.pick_up_tip()
    pipette_50.mix(repetitions=2, volume=10, location=source.wells()[1], aspirate_flow_rate=8)
    pipette_50.mix(repetitions=2, volume=10, location=target.wells()[1], dispense_flow_rate=2)
    pipette_50.mix(repetitions=2, volume=10, location=source.wells()[1], aspirate_flow_rate=2, dispense_flow_rate=8)
    pipette_50.drop_tip()

    # 4. Test aspirate with aspirate_delay (expect delay behavior)
    # 5. Test dispense with dispense_delay (expect delay behavior)
    pipette_50.pick_up_tip()
    pipette_50.mix(repetitions=1, volume=10, location=source.wells()[3], aspirate_delay=3)
    pipette_50.mix(repetitions=1, volume=10, location=target.wells()[3], dispense_delay=1)
    pipette_50.mix(repetitions=1, volume=10, location=target.wells()[3], aspirate_delay=1, dispense_delay=3)
    pipette_50.drop_tip()

    # 6. Test dispense with final_push_out (expect push)
    pipette_50.pick_up_tip()
    pipette_50.mix(repetitions=3, volume=10, location=target.wells()[5], final_push_out=True)
    pipette_50.drop_tip()

    # All
    pipette_50.pick_up_tip()
    pipette_50.mix(volume=10, location=target.wells()[5], aspirate_flow_rate=4, dispense_flow_rate=2.22, aspirate_delay=1, dispense_delay=3, final_push_out=True)
    pipette_50.drop_tip()

    # 7. Test move_to with mm_from_edge (expect offset)
    pipette_50.pick_up_tip()
    pipette_50.touch_tip(target.wells()[6], mm_from_edge=2)
    pipette_50.drop_tip()

    # 8. Test air_gap with rate (expect success)
    pipette_50.pick_up_tip()
    pipette_50.aspirate(10, source.wells()[7])
    pipette_50.air_gap(5, rate=1.5)
    pipette_50.drop_tip()

    # 9. Test air_gap with in_place=True (expect in-place gap)
    pipette_50.pick_up_tip()
    pipette_50.aspirate(10, source.wells()[8])
    pipette_50.air_gap(5, in_place=True)
    pipette_50.drop_tip()

    # 9. Test air_gap with in_place=True && rate (expect in-place gap)
    pipette_50.pick_up_tip()
    pipette_50.aspirate(10, source.wells()[8])
    pipette_50.air_gap(5, in_place=True, rate=.5)
    pipette_50.drop_tip()


        # .. versionchanged:: 2.24
        #     ``location`` is no longer required if the pipette just moved to, dispensed, or blew out
        #     into a trash bin or waste chute.