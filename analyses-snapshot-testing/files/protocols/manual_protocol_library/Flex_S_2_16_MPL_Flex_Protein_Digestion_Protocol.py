def get_values(*names):
    import json

    _all_values = json.loads(
        """{"num_plates":4,"aspirate_height":5,"dispense_height":5,"buffer_vol":100,"num_mix":3,"mix_vol":100,"mix_height":5,"protocol_filename":"Flex_Protein_Digestion_Protocol"}"""
    )
    return [_all_values[n] for n in names]


from opentrons import protocol_api
import json


# metadata
metadata = {
    "protocolName": "Flex Digestion Protocol",
    "author": "<parrish.payne@opentrons.com>",
    "description": "Liquid transfer using 96 channel pipette",
}

# requirements
requirements = {"robotType": "Flex", "apiLevel": "2.16"}


# protocol run function
def run(ctx: protocol_api.ProtocolContext):

    [num_plates, aspirate_height, dispense_height, buffer_vol, num_mix, mix_vol, mix_height] = get_values(  # noqa: F821
        "num_plates", "aspirate_height", "dispense_height", "buffer_vol", "num_mix", "mix_vol", "mix_height"
    )

    # labware
    assay_plates = (
        ctx.load_labware("thermo_96_wellplate_2200ul", location=slot, namespace="custom_beta")
        for slot in ["C2", "C3", "D2", "D3"][:num_plates]
    )
    assay_reservoir = ctx.load_labware("nest_1_reservoir_290ml", location="C1")
    tiprack1 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", location="A1", adapter="opentrons_flex_96_tiprack_adapter")
    tiprack2 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", location="A2", adapter="opentrons_flex_96_tiprack_adapter")
    tiprack3 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", location="B1", adapter="opentrons_flex_96_tiprack_adapter")
    tiprack4 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", location="B2", adapter="opentrons_flex_96_tiprack_adapter")

    trash = ctx.load_trash_bin("A3")

    # pipettes
    flex96 = ctx.load_instrument(instrument_name="flex_96channel_1000", mount="left", tip_racks=[tiprack1, tiprack2, tiprack3, tiprack4])

    # Helper Functions
    def mix(pip):
        for i in range(num_mix):
            pip.aspirate(mix_vol, plate["A1"].bottom(dispense_height))
            pip.dispense(mix_vol, plate["A1"].bottom(dispense_height))

    # Step 1 -  Transfer assay buffer from Reservoir to Assay Plate:
    for plate in assay_plates:
        flex96.pick_up_tip()
        flex96.aspirate(buffer_vol, assay_reservoir["A1"].bottom(z=aspirate_height))
        flex96.dispense(buffer_vol, plate["A1"].bottom(z=dispense_height))
        flex96.mix(num_mix, mix_vol)
        flex96.blow_out()
        flex96.touch_tip()
        flex96.drop_tip()

    ctx.comment("End of Protocol")
