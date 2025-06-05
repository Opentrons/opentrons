from opentrons import protocol_api

# metadata

metadata = {
    'protocolName': 'Cell Viability and Cytotoxicity Assay',
    'author': 'Opentrons',
    'description': 'To measure viability and cytotoxicity of A549 cells\ntreated with Thapsigargin using the OT-2',
    'apiLevel': '2.13'
}

NUM_SAMPLES = 10
# protocol run function


def run(protocol: protocol_api.ProtocolContext):

    def custom_mix(no_of_mix, p300, vol, well, top_height=25):
        for i in range(no_of_mix):
            p300.aspirate(vol, well.bottom())
            p300.dispense(vol, well.bottom(top_height))

    # lab ware

    tiprack = protocol.load_labware('opentrons_96_filtertiprack_20ul', 10)
    tiprack1 = protocol.load_labware('opentrons_96_tiprack_300ul', 4)
    falcontubes = protocol.load_labware(
        'opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical', 11)
    hs_module = protocol.load_module('heaterShakerModuleV1', 1)
    hs_module.close_labware_latch()
    plate = hs_module.load_labware('corning_96_wellplate_360ul_flat')

    # pipettes
    p300 = protocol.load_instrument(
        'p300_single_gen2', mount='left', tip_racks=[tiprack1])
    p20 = protocol.load_instrument(
        'p20_single_gen2', mount='right', tip_racks=[tiprack])

    # commands
    # Day 4 (After 72 hours) measurement of viability and cytotoxicity of \n    # A549 cells
    # Reagent for Cytotoxicity Assay added
    cyto_reagent = 19
    wells_a = plate.columns()[0]
    wells_b = plate.columns()[1]
    wells_c = plate.columns()[2]
    wells_d = plate.columns()[3][0:6]
    wells_e = plate.columns()[4][0:3]
    dest1 = [*wells_a, *wells_b, *wells_c, *wells_d, *wells_e]
    p20.pick_up_tip()
    for well in dest1:
        p20.flow_rate.aspirate = 92
        p20.flow_rate.dispense = 70
        p20.flow_rate.blow_out = 70
        p20.aspirate(cyto_reagent, falcontubes['B2'])
        protocol.delay(0.5)
        p20.move_to(falcontubes['B2'].bottom(35), speed=5)
        p20.dispense(cyto_reagent, well)
        protocol.delay(0.5)
        p20.blow_out(well)
        protocol.delay(0.6)
    p20.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(500)
    protocol.delay(minutes=2)
    hs_module.deactivate_shaker()

    protocol.delay(minutes=35)

    # Reagent for Viability Assay added

    volume_reagent = 100
    wells_a = plate.columns()[0]
    wells_b = plate.columns()[1]
    wells_c = plate.columns()[2]
    wells_d = plate.columns()[3][0:6]
    wells_e = plate.columns()[4][0:3]
    dest = [*wells_a, *wells_b, *wells_c, *wells_d, *wells_e]
    p300.pick_up_tip()
    for well in dest:
        p300.flow_rate.aspirate = 92
        p300.flow_rate.dispense = 70
        p300.flow_rate.blow_out = 70
        p300.aspirate(volume_reagent, falcontubes['B1'])
        protocol.delay(0.5)
        p300.move_to(falcontubes['B1'].bottom(35), speed=5)
        p300.dispense(volume_reagent, well)
        protocol.delay(0.5)
        p300.blow_out(well)
        protocol.delay(0.6)
    p300.drop_tip()

    hs_module.close_labware_latch()
    hs_module.set_and_wait_for_shake_speed(500)
    protocol.delay(minutes=2)
    hs_module.deactivate_shaker()
