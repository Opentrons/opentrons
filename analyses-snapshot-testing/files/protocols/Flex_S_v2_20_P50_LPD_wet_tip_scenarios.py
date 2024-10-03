import random
from typing import Set
from opentrons import protocol_api

# metadata
metadata = {
    "protocolName": "LPD with wet tip scenarios",
    "author": "Josh McVey",
    "description": "http://sandbox.docs.opentrons.com/edge/v2/pipettes/loading.html#liquid-presence-detection",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20",
}


def load_liquid_in_all_wells(labware, liquid) -> None:
    for well in labware.wells():
        well.load_liquid(liquid=liquid, volume=well.max_volume)


def run(protocol: protocol_api.ProtocolContext):

    # modules/fixtures
    trashbin = protocol.load_trash_bin(location="A3")

    # labware
    tiprack1 = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "A2")
    tiprack2 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    sample_plate = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "C3")
    reservoir = protocol.load_labware("nest_1_reservoir_290ml", "D3")
    wet_sample = protocol.load_labware("nest_12_reservoir_15ml", "B3")

    # liquids
    waterButMoreBlue = protocol.define_liquid(
        name="H20",
        description="Test this wet!!!",
        display_color="#0077b6",
    )

    wet_sample.well("A1").load_liquid(liquid=waterButMoreBlue, volume=200)
    wet_sample.well("A2").load_liquid(liquid=waterButMoreBlue, volume=200)
    wet_sample.well("A3").load_liquid(liquid=waterButMoreBlue, volume=200)

    # instruments
    p50 = protocol.load_instrument("flex_1channel_50", mount="right", tip_racks=[tiprack2], liquid_presence_detection=True)
    volume = 50

    pipette = p50
    total_volume = 30

    pipette.pick_up_tip()
    protocol.comment("touch_tip")
    pipette.touch_tip(wet_sample.well("A1"))
    protocol.comment("air_gap")
    pipette.air_gap(volume=20)
    protocol.comment("blow_out with no arguments")
    pipette.blow_out()
    pipette.drop_tip()

    protocol.comment(f"reuse=True")
    pipette.transfer(
        volume=10,
        source=[wet_sample.well("A1"), wet_sample.well("A2"), wet_sample.well("A3")],
        dest=sample_plate.well("A2"),
        reuse=True,
    )

    # example_1 = "During mixing, all aspirates on repetitions > 1 LPD with wet tip"
    # protocol.comment(f"{example_1} 🔽🔽🔽🔽🔽🔽🔽")
    # pipette.pick_up_tip()
    # pipette.mix(repetitions=3, volume=20, location=wet_sample.well("A1"))
    # pipette.drop_tip()
    # protocol.comment(f"{example_1} 🔼🔼🔼🔼🔼🔼🔼")

    # example_2 = "Consolidate default, reuse=true, new_tip once or never;second and subsequent aspirates LPD with wet tip"
    # protocol.comment(f"{example_2} 🔽🔽🔽🔽🔽🔽🔽")
    # protocol.comment(f"default tip use")
    # pipette.consolidate(
    #     volume=total_volume,
    #     source=[wet_sample.well("A1"), wet_sample.well("A2"), wet_sample.well("A3")],
    #     dest=sample_plate.well("A1"),
    # )
    # protocol.comment(f"reuse=True")
    # pipette.consolidate(
    #     volume=total_volume,
    #     source=[wet_sample.well("A1"), wet_sample.well("A2"), wet_sample.well("A3")],
    #     dest=sample_plate.well("A2"),
    #     reuse=True,
    # )
    # protocol.comment(f"new_tip='once'")
    # pipette.consolidate(
    #     volume=total_volume,
    #     source=[wet_sample.well("A1"), wet_sample.well("A2"), wet_sample.well("A3")],
    #     dest=sample_plate.well("A3"),
    #     new_tip="once",
    # )
    # protocol.comment(f"new_tip='never'")
    # pipette.pick_up_tip()
    # pipette.consolidate(
    #     volume=total_volume,
    #     source=[wet_sample.well("A1"), wet_sample.well("A2"), wet_sample.well("A3")],
    #     dest=sample_plate.well("A4"),
    #     new_tip="never",
    # )
    # pipette.drop_tip()
    # protocol.comment(f"{example_2} 🔼🔼🔼🔼🔼🔼🔼")

    # example_3 = "Consolidate mix_before or mix_after, during mixing, all aspirates on repetitions > 1 LPD with wet tip"
    # protocol.comment(f"{example_3} 🔽🔽🔽🔽🔽🔽🔽")
    # pipette.consolidate(
    #     volume=total_volume,
    #     source=[wet_sample.well("A1"), wet_sample.well("A2"), wet_sample.well("A3")],
    #     dest=sample_plate.well("A5"),
    #     mix_before=(3, 15),
    #     mix_after=(3, 20),
    # )
    # protocol.comment(f"{example_3} 🔼🔼🔼🔼🔼🔼🔼")

    # example_4 = "Distribute default and reuse=true;second and subsequent aspirates LPD with wet tip"
    # protocol.comment(f"{example_4} 🔽🔽🔽🔽🔽🔽🔽")
    # pipette.distribute(
    #     volume=total_volume,
    #     source=sample_plate.well("A2"),
    #     dest=[sample_plate.well("A1"), sample_plate.well("A3")],
    #     reuse=True,
    # )
    # protocol.comment(f"{example_4} 🔼🔼🔼🔼🔼🔼🔼")

    # example_5 = "Distribute mix=true, During mixing, all aspirates on repetitions > 1 LPD with wet tip"
    # protocol.comment(f"{example_5} 🔽🔽🔽🔽🔽🔽🔽")
    # pipette.distribute(
    #     volume=total_volume,
    #     source=sample_plate.well("A2"),
    #     dest=[sample_plate.well("A1"), sample_plate.well("A3")],
    #     mix=True,

    # # reuse the tip for a second transfer
    # # no error
    # # we must say in docs do not do this
    # protocol.comment("LPD no error thrown on simple command tip reuse 🔽🔽🔽🔽🔽🔽🔽")
    # well = "A2"
    # pipette.pick_up_tip()
    # pipette.aspirate(volume, wet_sample.well(well))
    # pipette.dispense(volume, sample_plate.well(well))

    # well = "A3"
    # pipette.aspirate(volume, wet_sample.well(well))
    # pipette.dispense(volume, sample_plate.well(well))
    # pipette.drop_tip()
    # protocol.comment("LPD no error thrown on simple command tip reuse 🔼🔼🔼🔼🔼🔼🔼")

    # # Again no error is thrown
    # # but we must say in docs do not do this
    # protocol.comment("LPD no error thrown on blowout + prepare_to_aspirate 🔽🔽🔽🔽🔽🔽🔽")
    # pipette.pick_up_tip()
    # pipette.aspirate(volume=20, location=reservoir["A1"])
    # pipette.blow_out(trashbin)  # make sure tip is empty then use for next step
    # protocol.comment(f"Current volume in pipette: {pipette.current_volume}")  # prints 0
    # # pipette.prepare_to_aspirate() removes the error from line 93
    # # but this should NOT be done!!!
    # # Error 4000 GENERAL_ERROR (ProtocolCommandFailedError): TipNotEmptyError:
    # # This operation requires a tip with no liquid in it.
    # pipette.prepare_to_aspirate()
    # is_liquid_in_reservoir = pipette.detect_liquid_presence(reservoir["A1"])
    # protocol.comment(f"Is there liquid in the reservoir? {is_liquid_in_reservoir}")
    # pipette.drop_tip()
    # protocol.comment("LPD no error thrown on blowout + prepare_to_aspirate 🔼🔼🔼🔼🔼🔼🔼")
