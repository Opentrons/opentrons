def get_values(*names):
    import json
    _all_values = json.loads("""[{"name": "no_samps", "type": "dropDown", "label": "Number of Samples", "options": [{"label": "8", "value": "8"}, {"label": "16", "value": "16"}]}, {"name": "pip_tip", "type": "dropDown", "label": "Single Pipette and Tip Type", "options": [{"label": "P50 & 50\u00b5L/300\u00b5L Tips", "value": "p50_single opentrons_96_tiprack_300ul"}, {"label": "P50 & 200\u00b5L Filter Tips", "value": "p50_single opentrons_96_filtertiprack_200ul"}, {"label": "P20 & 10\u00b5L/20\u00b5L Tips", "value": "p20_single_gen2 opentrons_96_tiprack_20ul"}, {"label": "P20 & 20\u00b5L Filter Tips", "value": "p20_single_gen2 opentrons_96_filtertiprack_20ul"}, {"label": "P20 & 10\u00b5L Filter Tips", "value": "p20_single_gen2 opentrons_96_filtertiprack_10ul"}]}, {"name": "p300gen", "type": "dropDown", "label": "P300 8-Channel Pipette Type", "options": [{"label": "GEN1", "value": "p300_multi"}, {"label": "GEN2", "value": "p300_multi_gen2"}]}, {"name": "p300tips", "type": "dropDown", "label": "P300 8-Channel Pipette Tip Type", "options": [{"label": "Opentrons 200\u00b5L Filter Tips", "value": "opentrons_96_filtertiprack_200ul"}, {"label": "Opentrons 300\u00b5L Tips", "value": "opentrons_96_tiprack_300ul"}]}, {"name": "magmod", "type": "dropDown", "label": "Magnetic Module", "options": [{"label": "GEN1", "value": "magnetic module"}, {"label": "GEN2", "value": "magnetic module gen2"}]}, {"name": "a_index", "type": "dropDown", "label": "Automate Indexing", "options": [{"label": "Yes", "value": "yes"}, {"label": "No", "value": "no"}]}, {"name": "cycles", "type": "int", "label": "Number of Thermocycles", "default": 5}, {"name": "f_time", "type": "int", "label": "Fragmentation Time", "default": 10}]""")
    return [_all_values[n] for n in names]


metadata = {
    "protocolName": "Swift 2S Turbo DNA Library Kit Protocol: Fully Automated",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
    "apiLevel": "2.10",
}


def run(protocol):
    [no_samps, pip_tip, p300gen, p300tips, magmod, a_index, cycles, f_time] = get_values(
        "no_samps", "pip_tip", "p300gen", "p300tips", "magmod", "a_index", "cycles", "f_time"
    )
    if cycles < 3 or cycles > 15:
        raise Exception("Number of Thermocycles should be between 3 and 15.")
    if f_time < 6 or f_time > 30:
        raise Exception("Fragmentation Time should be between 6 & 30 minutes.")
    pip_type, tip_name = pip_tip.split()
    s_tips = [protocol.load_labware(tip_name, "4")]
    p300tips = [protocol.load_labware(p300tips, s) for s in ["5", "6", "9"]]
    small_pip = protocol.load_instrument(pip_type, "left", tip_racks=s_tips)
    p300 = protocol.load_instrument(p300gen, "right", tip_racks=p300tips)
    rt_reagents = protocol.load_labware("nest_12_reservoir_15ml", "2")
    magdeck = protocol.load_module(magmod, "1")
    mag_plate = magdeck.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    tempdeck = protocol.load_module("Temperature Module", "3")
    cool_reagents = tempdeck.load_labware("opentrons_24_aluminumblock_generic_2ml_screwcap")
    thermocycler = protocol.load_module("thermocycler")
    reaction_plate = thermocycler.load_labware("nest_96_wellplate_100ul_pcr_full_skirt")
    enzymatic_prep_mm = cool_reagents.wells_by_name()["A1"]
    ligation_mm = cool_reagents.wells_by_name()["A2"]
    pcr_mm = cool_reagents.wells_by_name()["A3"]
    beads = rt_reagents.wells_by_name()["A2"]
    ethanol = rt_reagents.wells_by_name()["A3"]
    ethanol2 = rt_reagents.wells_by_name()["A4"]
    te = rt_reagents.wells_by_name()["A6"]
    waste = rt_reagents.wells_by_name()["A11"]
    waste2 = rt_reagents.wells_by_name()["A12"]
    tc_samps = reaction_plate.columns_by_name()
    mag_cols = mag_plate.columns_by_name()
    if no_samps == "8":
        enzymatic_prep_samples = tc_samps["1"]
        enzymatic_300 = [enzymatic_prep_samples[0]]
        pcr_prep_samples = tc_samps["2"]
        pcr_300 = [pcr_prep_samples[0]]
        purified_samples = [tc_samps["3"][0]]
        mag_samples = mag_cols["1"]
        mag_300 = [mag_samples[0]]
        mag_pure = [mag_cols["2"][0]]
    else:
        enzymatic_prep_samples = tc_samps["1"] + tc_samps["2"]
        enzymatic_300 = [tc_samps["1"][0], tc_samps["2"][0]]
        pcr_prep_samples = tc_samps["3"] + tc_samps["4"]
        pcr_300 = [tc_samps["3"][0], tc_samps["4"][0]]
        purified_samples = [tc_samps["5"][0], tc_samps["6"][0]]
        mag_samples = mag_cols["1"] + mag_cols["2"]
        mag_300 = [mag_cols["1"][0], mag_cols["2"][0]]
        mag_pure = [mag_cols["3"][0], mag_cols["4"][0]]
    small_pip.flow_rate.aspirate = 150
    small_pip.flow_rate.dispense = 300
    small_pip.flow_rate.blow_out = 300
    small_max = int(tip_name.split("_")[-1][:-2])
    if small_max > 100:
        small_max = 50
    s_vol = small_max * 0.8

    def vol_trans(vol, src, dest):
        nonlocal small_max
        nonlocal s_vol
        if vol <= small_max:
            small_pip.transfer(vol, src, dest, new_tip="never")
        else:
            while vol > s_vol:
                small_pip.transfer(s_vol, src, dest, new_tip="never")
                small_pip.blow_out(dest)
                small_pip.drop_tip()
                vol -= s_vol
                small_pip.pick_up_tip()
            small_pip.transfer(vol, src, dest, new_tip="never")

    tempdeck.set_temperature(4)
    thermocycler.set_block_temperature(4)
    for well in enzymatic_prep_samples:
        small_pip.pick_up_tip()
        vol_trans(10.5, enzymatic_prep_mm.bottom(0.2), well)
        small_pip.blow_out()
        small_pip.mix(2, 10, well.top(-13.5))
        small_pip.move_to(well.top(-12))
        protocol.delay(seconds=0.5)
        small_pip.blow_out()
        small_pip.drop_tip()
    thermocycler.close_lid()
    thermocycler.set_lid_temperature(70)
    thermocycler.set_block_temperature(32, hold_time_minutes=f_time)
    thermocycler.set_block_temperature(65, hold_time_minutes=30)
    thermocycler.set_block_temperature(4)
    thermocycler.deactivate_lid()
    thermocycler.open_lid()
    small_pip.pick_up_tip()
    small_pip.mix(5, s_vol, ligation_mm)
    small_pip.blow_out(ligation_mm.top())
    for well in enzymatic_prep_samples:
        if not small_pip.hw_pipette["has_tip"]:
            small_pip.pick_up_tip()
        vol_trans(30, ligation_mm, well.top(-7))
        small_pip.mix(2, s_vol, well.top(-13.5))
        small_pip.blow_out(well.top(-7))
        small_pip.drop_tip()
    thermocycler.set_block_temperature(20, hold_time_minutes=20)
    thermocycler.set_block_temperature(4)
    """Ligation Purification"""
    p300.flow_rate.aspirate = 10
    for enz_samp, mag_samp in zip(enzymatic_300, mag_300):
        p300.pick_up_tip()
        p300.aspirate(60, enz_samp)
        p300.dispense(60, mag_samp.top(-4))
        p300.blow_out(mag_samp.top(-4))
        p300.drop_tip()
    p300.flow_rate.aspirate = 75
    p300.pick_up_tip()
    p300.mix(10, 200, beads)
    for mag_samp in mag_300:
        if not p300.hw_pipette["has_tip"]:
            p300.pick_up_tip()
        p300.flow_rate.aspirate = 10
        p300.flow_rate.dispense = 10
        p300.aspirate(48, beads)
        p300.default_speed = 50
        p300.move_to(mag_samp.top(-2))
        p300.default_speed = 400
        p300.dispense(48, mag_samp.top(-5))
        p300.blow_out()
        p300.flow_rate.aspirate = 50
        p300.flow_rate.dispense = 50
        p300.mix(10, 80, mag_samp.top(-13.5))
        p300.blow_out(mag_samp.top(-5))
        p300.drop_tip()
    protocol.comment("Incubating for 5 minutes.")
    protocol.delay(minutes=5)
    magdeck.engage()
    protocol.comment("Engaging Magnetic Module and incubating for 6 minutes.")
    protocol.delay(minutes=6)
    p300.flow_rate.aspirate = 20
    p300.flow_rate.dispense = 50
    for mag_samp in mag_300:
        p300.pick_up_tip()
        p300.aspirate(108, mag_samp.bottom(2))
        p300.dispense(108, waste.bottom(1.5))
        p300.drop_tip()
    p300.default_speed = 200
    p300.flow_rate.aspirate = 75
    p300.flow_rate.dispense = 50
    for _ in range(2):
        for mag_samp in mag_300:
            if not p300.hw_pipette["has_tip"]:
                p300.pick_up_tip()
            p300.aspirate(10, ethanol.top())
            p300.aspirate(180, ethanol)
            p300.air_gap(5)
            p300.dispense(210, mag_samp.top(-2))
        if no_samps == "8":
            protocol.delay(seconds=15)
        for mag_samp in mag_300:
            if not p300.hw_pipette["has_tip"]:
                p300.pick_up_tip()
            p300.aspirate(5, mag_samp.top())
            p300.aspirate(190, mag_samp)
            p300.air_gap(5)
            p300.dispense(210, waste.bottom(1.5))
            p300.drop_tip()
    for mag_samp in mag_300:
        p300.pick_up_tip()
        p300.aspirate(30, mag_samp.bottom(-0.5))
        p300.air_gap(5)
        p300.drop_tip()
    protocol.comment("Letting beads dry for 30 seconds.")
    protocol.delay(seconds=30)
    magdeck.disengage()
    for mag_samp in mag_300:
        p300.pick_up_tip()
        p300.aspirate(22, te)
        p300.dispense(22, mag_samp.top(-12))
        p300.blow_out(mag_samp.top())
        p300.flow_rate.aspirate = 100
        p300.flow_rate.dispense = 200
        p300.mix(10, 20, mag_samp.top(-13.5))
        p300.blow_out(mag_samp.top())
        p300.flow_rate.aspirate = 75
        p300.flow_rate.dispense = 50
        p300.drop_tip()
    protocol.comment("Incubating for 2 minutes.")
    protocol.delay(minutes=2)
    protocol.comment("Engaging Magnetic Module and incubating for 6 minutes.")
    magdeck.engage()
    protocol.delay(minutes=6)
    for mag_samp, pcr_samp in zip(mag_300, pcr_300):
        p300.pick_up_tip()
        p300.aspirate(22, mag_samp.bottom(0.25))
        p300.dispense(22, pcr_samp)
        p300.blow_out(pcr_samp.top())
        p300.drop_tip()
    magdeck.disengage()
    """PCR Prep"""
    if a_index == "yes":
        x = int(no_samps)
        primers = [w for row in cool_reagents.rows()[1:] for w in row][:x]
        for primer, well in zip(primers, pcr_prep_samples):
            small_pip.pick_up_tip()
            small_pip.aspirate(5, primer.top(-24))
            small_pip.dispense(5, well)
            small_pip.drop_tip()
    else:
        protocol.pause(
            'You selected "No" to automated indexing. Please add         indices to samples. When ready to continue, click RESUME.'
        )
    small_pip.pick_up_tip()
    small_pip.mix(6, s_vol, pcr_mm)
    for well in pcr_prep_samples:
        if not small_pip.hw_pipette["has_tip"]:
            small_pip.pick_up_tip()
        vol_trans(25, pcr_mm, well)
        small_pip.mix(5, s_vol, well.top(-13.5))
        small_pip.blow_out(well.top(-12))
        small_pip.drop_tip()
    plate_temp = 4
    t_holds = [[98, 30], [98, 10], [60, 30], [68, 60]]
    cycled_steps = [
        {"temperature": t_holds[1][0], "hold_time_seconds": t_holds[1][1]},
        {"temperature": t_holds[2][0], "hold_time_seconds": t_holds[2][1]},
        {"temperature": t_holds[3][0], "hold_time_seconds": t_holds[3][1]},
    ]
    thermocycler.set_block_temperature(plate_temp)
    thermocycler.set_lid_temperature(105)
    thermocycler.close_lid()
    thermocycler.set_block_temperature(t_holds[0][0], hold_time_seconds=t_holds[0][1])
    thermocycler.execute_profile(steps=cycled_steps, repetitions=cycles)
    thermocycler.set_block_temperature(plate_temp)
    thermocycler.open_lid()
    """PCR Purication"""
    p300.flow_rate.aspirate = 10
    for src, dest in zip(pcr_300, mag_pure):
        p300.pick_up_tip()
        p300.aspirate(60, src)
        p300.dispense(60, dest.top(-4))
        p300.blow_out(dest.top(-4))
        p300.drop_tip()
    p300.flow_rate.aspirate = 75
    p300.pick_up_tip()
    p300.mix(5, 60, beads)
    for mag_samps in mag_pure:
        if not p300.hw_pipette["has_tip"]:
            p300.pick_up_tip()
        p300.flow_rate.aspirate = 10
        p300.flow_rate.dispense = 10
        p300.aspirate(32.5, beads)
        p300.default_speed = 50
        p300.move_to(mag_samps.top(-2))
        p300.default_speed = 400
        p300.dispense(32.5, mag_samps.top(-12))
        p300.flow_rate.aspirate = 50
        p300.flow_rate.dispense = 50
        p300.blow_out()
        p300.mix(10, 60, mag_samps.top(-13.5))
        p300.blow_out(mag_samps.top(-12))
        p300.drop_tip()
    protocol.comment("Incubating for 5 minutes.")
    protocol.delay(minutes=5)
    magdeck.engage()
    protocol.delay(minutes=5)
    for mag_samps in mag_pure:
        p300.pick_up_tip()
        p300.aspirate(82.5, mag_samps.bottom(2))
        p300.dispense(82.5, waste2)
        p300.drop_tip()
    for _ in range(2):
        for mag_samps in mag_pure:
            if not p300.hw_pipette["has_tip"]:
                p300.pick_up_tip()
            p300.aspirate(5, ethanol2.top())
            p300.aspirate(180, ethanol2)
            p300.air_gap(10)
            p300.dispense(200, mag_samps.top(-2))
        if no_samps == "8":
            protocol.delay(seconds=15)
        for mag_samps in mag_pure:
            if not p300.hw_pipette["has_tip"]:
                p300.pick_up_tip()
            p300.aspirate(5, mag_samps.top())
            p300.aspirate(190, mag_samps.bottom(1.5))
            p300.air_gap(5)
            p300.dispense(210, waste2)
            p300.drop_tip()
    for mag_samps in mag_pure:
        p300.pick_up_tip()
        p300.aspirate(30, mag_samps.bottom(-0.5))
        p300.air_gap(5)
        p300.drop_tip()
    protocol.delay(minutes=1)
    magdeck.disengage()
    for mag_samps in mag_pure:
        p300.pick_up_tip()
        p300.aspirate(22, te)
        p300.dispense(22, mag_samps.top(-12))
        p300.blow_out(mag_samps.top())
        p300.mix(10, 20, mag_samps.top(-13.5))
        p300.blow_out(mag_samps.top())
        p300.drop_tip()
    protocol.comment("Incubating for 4 minutes,     then engaging Magnetic Module.")
    protocol.delay(minutes=4)
    magdeck.engage()
    protocol.delay(minutes=5)
    for mag_samps, p_samps in zip(mag_pure, purified_samples):
        p300.pick_up_tip()
        p300.aspirate(20, mag_samps)
        p300.dispense(22, p_samps.top(-12))
        p300.blow_out()
        p300.drop_tip()
    protocol.comment(
        "Swift 2S Turbo DNA Library Kit completed.     Store freshly prepared libraries at 4C (-20C for long term),     or proceed to quantification."
    )
