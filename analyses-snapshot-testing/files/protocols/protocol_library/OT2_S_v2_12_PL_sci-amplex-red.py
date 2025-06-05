def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "NUM_SAMPLES", "type": "int", "label": "Number of Samples (5-12)", "default": 7}, {"name": "p300_mount", "type": "dropDown", "label": "P300 Single-Channel Mount", "options": [{"label": "Right", "value": "right"}, {"label": "Left", "value": "left"}]}, {"name": "p20_mount", "type": "dropDown", "label": "P20 Single-Channel Mount", "options": [{"label": "Left", "value": "left"}, {"label": "Right", "value": "right"}]}]""")
    return [_all_values[n] for n in names]


from opentrons import protocol_api

# metadata
metadata = {
    'protocolName': 'Amplex Red Hydrogen Peroxide Assay',
    'author': 'Opentrons',
    'description': 'Protocol to measure hydrogen peroxide levels from THP-1 cells using the OT-2',
    'apiLevel': '2.12'
}

# protocol run function
def run(protocol: protocol_api.ProtocolContext):

    [NUM_SAMPLES, p300_mount, p20_mount] = get_values(  # noqa: F821
    "NUM_SAMPLES", "p300_mount", "p20_mount")

    def custom_mix(no_of_mix, p300, vol, well, top_height=25):
        for i in range(no_of_mix):
            p300.aspirate(vol, well.bottom())
            p300.dispense(vol, well.bottom(top_height))

    # lab ware
    tiprack = protocol.load_labware('opentrons_96_filtertiprack_20ul', 10)
    tiprack1 = protocol.load_labware('opentrons_96_tiprack_300ul', 4)
    falcontubes = protocol.load_labware('opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical', 11)
    tubes1 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 7)
    tubes2 = protocol.load_labware('opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap', 5)
    temperature_module = protocol.load_module('temperature module', 3)
    plate = temperature_module.load_labware('corning_96_wellplate_360ul_flat')

    # pipettes
    p300 = protocol.load_instrument(
        'p300_single_gen2', mount=p300_mount, tip_racks=[tiprack1])
    p20 = protocol.load_instrument(
        'p20_single_gen2', mount=p20_mount, tip_racks=[tiprack])

    # commands

    # Dilution of 5X Reaction Buffer
    p300.pick_up_tip()
    for i in range(10):
        p300.aspirate(200, falcontubes['A1'])
        p300.dispense(200, falcontubes['A3'])
    custom_mix(3, p300, 200, falcontubes['A3'])
    p300.mix(2, 200, falcontubes['A3'])
    p300.drop_tip()

    # Preparation of 20mM working stock of H2O2
    p300.pick_up_tip()
    for i in range(4):
        p300.aspirate(200, falcontubes['A3'])
        p300.dispense(200, tubes1['A1'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(177, falcontubes['A3'])
    p300.dispense(177, tubes1['A1'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(22.7, tubes1['D3'])
    p300.dispense(22.7, tubes1['A1'])
    p300.drop_tip()

    p300.pick_up_tip()
    custom_mix(2, p300, 200, tubes1['A1'])
    p300.mix(2, 200, tubes1['A1'])
    p300.drop_tip()

    # Preparation of Standard concentrations of H2O2
    reaction_buffer = [150, 148.5, 147, 145.5, 144, 142.5, 135, 120]
    dilution_wells = ['A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3']
    p300.pick_up_tip()
    for v, w in zip(reaction_buffer, dilution_wells):
        p300.aspirate(v, falcontubes['A3'])
        p300.dispense(v, tubes1[w])
    p300.drop_tip()

    p300.pick_up_tip()
    for i in range(4):
        p300.aspirate(200, falcontubes['A3'])
        p300.dispense(200, tubes1['B4'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(150, falcontubes['A3'])
    p300.dispense(150, tubes1['B4'])
    p300.drop_tip()

    p300.pick_up_tip()
    for i in range(3):
        p300.aspirate(150, falcontubes['A3'])
        p300.dispense(150, tubes1['B5'])
    p300.drop_tip()

    p300.pick_up_tip()
    for i in range(2):
        p300.aspirate(200, falcontubes['A3'])
        p300.dispense(200, tubes1['B6'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(50, tubes1['A1'])
    p300.dispense(50, tubes1['B4'])
    p300.drop_tip()

    p300.pick_up_tip()
    custom_mix(2, p300, 200, tubes1['B4'])
    p300.mix(2, 200, tubes1['B4'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(50, tubes1['B4'])
    p300.dispense(50, tubes1['B5'])
    custom_mix(2, p300, 200, tubes1['B5'])
    p300.mix(2, 200, tubes1['B5'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(100, tubes1['B5'])
    p300.dispense(100, tubes1['B6'])
    custom_mix(2, p300, 200, tubes1['B6'])
    p300.mix(2, 200, tubes1['B6'])
    p300.drop_tip()

    working_h2o2 = [1.5, 3, 4.5, 6, 7.5, 15, 20, 10]
    concentration_wells = ['A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B3']
    p20.pick_up_tip()
    for a, b in zip(working_h2o2, concentration_wells):
        p20.aspirate(a, tubes1['B6'])
        p20.dispense(a, tubes1[b])
    p20.drop_tip()

    p300.pick_up_tip()
    p300.mix(3, 150, tubes1['A3'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.mix(3, 150, tubes1['A4'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.mix(3, 150, tubes1['A5'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.mix(3, 150, tubes1['A6'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.mix(3, 150, tubes1['B1'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.mix(3, 150, tubes1['B2'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.mix(3, 150, tubes1['B3'])
    p300.drop_tip()

    p300.pick_up_tip()
    for i in range(9):
        p300.aspirate(200, falcontubes['A3'])
        p300.dispense(200, falcontubes['B1'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(140, falcontubes['A3'])
    p300.dispense(140, falcontubes['B1'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(40, tubes1['D4'])
    p300.dispense(40, falcontubes['B1'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(20, tubes1['D5'])
    p300.dispense(20, falcontubes['B1'])
    custom_mix(3, p300, 200, falcontubes['B1'])
    p300.mix(3, 200, falcontubes['B1'])
    p300.drop_tip()

    # Addition of standard H2O2 concentrations in first and four wells of third row of the 96 well plate
    vol_h2o2 = 50
    dest_wells = [*plate.rows()[0], *plate.rows()[2][:4]]
    src_wells = [*tubes1.rows()[0][1:], *tubes1.rows()[1][:3]]
    count = 0
    for src in src_wells:
        p300.pick_up_tip()
        p300.flow_rate.aspirate = 92
        p300.flow_rate.dispense = 70
        p300.flow_rate.blow_out = 70
        for loop in range(2):
            p300.aspirate(vol_h2o2,src)
            protocol.delay(0.5)
            p300.move_to(src.bottom(35), speed=5)
            p300.dispense(vol_h2o2, dest_wells[count])
            protocol.delay(0.5)
            p300.blow_out(dest_wells[count])
            protocol.delay(0.6)
            count = count+1
        p300.drop_tip()

    # Dilution of PMA stock and preparation of working concentrations of PMA
    volume_pma = [90, 90]
    pma_tubes = ['A2', 'A3']
    p300.pick_up_tip()
    for vp, pt in zip(volume_pma, pma_tubes):
        p300.aspirate(vp, falcontubes['A3'])
        p300.dispense(vp, tubes2[pt])
    p300.drop_tip()

    p20.pick_up_tip()
    p20.aspirate(10, tubes2['A1'])
    p20.dispense(10, tubes2['A2'])
    p20.drop_tip()

    p300.pick_up_tip()
    custom_mix(2, p300, 100, tubes2['A2'])
    p300.mix(2, 100, tubes2['A2'])
    p300.drop_tip()

    p300.pick_up_tip()
    p300.aspirate(10, tubes2['A2'])
    p300.dispense(10, tubes2['A3'])
    custom_mix(2, p300, 100, tubes2['A3'])
    p300.mix(2, 100, tubes2['A3'])
    p300.drop_tip()

    working_pma = [200, 198, 195, 191, 187, 183, 175]
    pma_wells = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1']
    p300.pick_up_tip()
    for wp, pw in zip(working_pma, pma_wells):
        p300.aspirate(wp, falcontubes['A3'])
        p300.dispense(wp, tubes1[pw])
    p300.drop_tip()

    pma1 = [200, 200, 200, 200, 200, 200, 200]
    pma_wells = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1']
    p300.pick_up_tip()
    for p1, pw in zip(pma1, pma_wells):
        p300.aspirate(p1, falcontubes['A3'])
        p300.dispense(p1, tubes1[pw])
    p300.drop_tip()

    pma2 = [100, 100.38, 100.95, 100.9, 100.85, 100.8, 100.7]
    pma_wells = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1']
    p300.pick_up_tip()
    for p2, pw in zip(pma2, pma_wells):
        p300.aspirate(p2, falcontubes['A3'])
        p300.dispense(p2, tubes1[pw])
    p300.drop_tip()

    pma3 = [1.62, 4.05, 8.1, 12.15, 16.2, 20, 4.3]
    pma_wells1 = ['C2', 'C3', 'C4', 'C5', 'C6', 'D1', 'D1']
    p20.pick_up_tip()
    for p3, pw3 in zip(pma3, pma_wells1):
        p20.aspirate(p3, tubes2['A3'])
        p20.dispense(p3, tubes1[pw3])
    p20.drop_tip()

    p300.pick_up_tip()
    custom_mix(3, p300, 200, tubes1['C2'])
    p300.mix(2, 200, tubes1['C2'])
    p300.drop_tip()

    p300.pick_up_tip()
    custom_mix(3, p300, 200, tubes1['C3'])
    p300.mix(2, 200, tubes1['C3'])
    p300.drop_tip()

    p300.pick_up_tip()
    custom_mix(3, p300, 200, tubes1['C4'])
    p300.mix(2, 200, tubes1['C4'])
    p300.drop_tip()

    p300.pick_up_tip()
    custom_mix(3, p300, 200, tubes1['C5'])
    p300.mix(2, 200, tubes1['C5'])
    p300.drop_tip()

    p300.pick_up_tip()
    custom_mix(3, p300, 200, tubes1['C6'])
    p300.mix(2, 200, tubes1['C6'])
    p300.drop_tip()

    p300.pick_up_tip()
    custom_mix(3, p300, 200, tubes1['D1'])
    p300.mix(2, 200, tubes1['D1'])
    p300.drop_tip()

    # Addition of various concentrations of PMA to wells containing cells
    vol_pma = 50
    dest_pma_wells = list(map(list, zip(plate.rows()[4][:7], plate.rows()[5][:7], plate.rows()[6][:7])))
    src_pma_wells = [*tubes1.rows()[2], *tubes1.rows()[3][:1]]
    for src, dest_3 in zip(src_pma_wells, dest_pma_wells):
        p300.pick_up_tip()
        p300.flow_rate.aspirate = 92
        p300.flow_rate.dispense = 70
        p300.flow_rate.blow_out = 70
        for dest in dest_3:
            p300.aspirate(vol_pma, src)
            protocol.delay(0.5)
            p300.move_to(src.bottom(35), speed=5)
            p300.dispense(vol_pma, dest)
            protocol.delay(0.5)
            p300.blow_out(dest)
            protocol.delay(0.6)
        p300.drop_tip()

    # Addition of working Amplex Red reagent to standard and sample wells
    volume_reagent = 50
    wells_a = plate.rows()[0]
    wells_c = plate.rows()[2][0:4]
    wells_e = plate.rows()[4][0:7]
    wells_f = plate.rows()[5][0:7]
    wells_g = plate.rows()[6][0:7]
    dest = [*wells_a, *wells_c, *wells_e, *wells_f, *wells_g]
    p300.pick_up_tip()
    for well in dest:
        p300.flow_rate.aspirate = 92
        p300.flow_rate.dispense = 70
        p300.flow_rate.blow_out = 70
        p300.aspirate(volume_reagent, falcontubes['B1'])
        protocol.delay(0.5)
        p300.move_to(falcontubes['B1'].bottom(35), speed=5)
        p300.dispense(volume_reagent, well.top(5))
        protocol.delay(0.5)
        p300.blow_out(well)
        protocol.delay(0.6)
    p300.drop_tip()

    temperature_module.set_temperature(37)
