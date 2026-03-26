# mypy: ignore-errors
from opentrons import protocol_api
from opentrons.protocol_api import ALL, SINGLE
from opentrons import types
import math
import numpy as np

metadata = {
    "protocolName": "MagAttract® PowerSoil® Pro DNA Kit - Binding, Washing, and Elution",
    "author": "SL",
    "description": "Beads-binding, washing, and elution protocol with magnetic separation",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def add_parameters(parameters):
    parameters.add_bool(
        variable_name="DRY_WATER_RUN",
        display_name="Dry or Sample Run",
        description="Do you want to perform a dry run?",
        default=False,
    )
    parameters.add_int(
        variable_name="num_samples",
        display_name="Number of Samples",
        description="The number of samples to process",
        default=48,
        minimum=1,
        maximum=48,
        unit="x Samples",
    )
    parameters.add_float(
        variable_name="sample_rate",
        display_name="Sample Rate",
        description="Sample liquid handling rate",
        default=0.5,
        minimum=0,
        maximum=1.5,
    )
    parameters.add_float(
        variable_name="beads_rate",
        display_name="Beads Rate",
        description="Beads handling rate",
        default=0.2,
        minimum=0,
        maximum=1.5,
    )
    parameters.add_float(
        variable_name="buffer_rate",
        display_name="Buffer Rate",
        description="Buffer liquid handling rate",
        default=0.6,
        minimum=0,
        maximum=1.5,
    )
    parameters.add_float(
        variable_name="ethanol_rate",
        display_name="Ethanol Rate",
        description="Ethanol liquid handling rate",
        default=0.75,
        minimum=0,
        maximum=1.5,
    )
    parameters.add_float(
        variable_name="elution_rate",
        display_name="Elution Rate",
        description="Elution liquid handling rate",
        default=0.4,
        minimum=0,
        maximum=1.5,
    )
    parameters.add_float(
        variable_name="x_offset",
        display_name="X Offset",
        description="X offset for all removal steps",
        default=0.0,
        minimum=-1.0,
        maximum=1.0,
    )
    parameters.add_float(
        variable_name="y_offset",
        display_name="Y Offset",
        description="Y offset for all removal steps",
        default=0.0,
        minimum=-1.0,
        maximum=1.0,
    )
    parameters.add_float(
        variable_name="z_height_1",
        display_name="Z Height 1",
        description="Z height for the full removal",
        default=1.2,
        minimum=0,
        maximum=3.0,
    )
    parameters.add_float(
        variable_name="z_height_2",
        display_name="Z Height 2",
        description="Z height for the 2x extra removal",
        default=0.8,
        minimum=0,
        maximum=3.0,
    )
    parameters.add_int(
        variable_name="str_col",
        display_name="Starting Column #",
        description="The column number to start processing samples from",
        default=1,
        minimum=1,
        maximum=12,
        unit="Column",
    )
    parameters.add_int(
        variable_name="str_vol",
        display_name="Starting Volume",
        description="The starting volume of the sample",
        default=500,
        minimum=0,
        maximum=1000,
        unit="µL",
    )
    parameters.add_bool(
        variable_name="remove_test",
        display_name="Remove Test Mode only?",
        description="If True, the protocol will only run one wash and one elution step",
        default=False,
    )
    parameters.add_float(
        variable_name="test_beads_vol",
        display_name="Beads Volume for Remove Mode",
        description="The volume of beads to use in remove test mode",
        default=470,
        minimum=0,
        maximum=1000,
        unit="µL",
    )


def run(protocol: protocol_api.ProtocolContext):
    # ------------------------------------------------------------------ #
    #                             Parameters                             #
    # ------------------------------------------------------------------ #

    # ------------------ Load the run time parameters ------------------ #
    DRY_WATER_RUN = protocol.params.DRY_WATER_RUN
    num_samples = protocol.params.num_samples
    sample_rate = protocol.params.sample_rate
    beads_rate = protocol.params.beads_rate
    buffer_rate = protocol.params.buffer_rate
    ethanol_rate = protocol.params.ethanol_rate
    elution_rate = protocol.params.elution_rate
    x_offset = protocol.params.x_offset
    y_offset = protocol.params.y_offset
    z_height_1 = protocol.params.z_height_1
    z_height_2 = protocol.params.z_height_2
    str_col = protocol.params.str_col
    str_vol = protocol.params.str_vol
    remove_test = protocol.params.remove_test
    test_beads_vol = protocol.params.test_beads_vol

    # ------------------------ volume parameters ----------------------- #
    beads_vol = 470  # MagAttract Suspension G beads/Buffer QSB1 mix volume
    mw1_vol = 500  # Buffer MW1 volume
    ethanol_vol = 500  # 80% Ethanol volume
    elution_vol = 100  # Solution C6 volume

    # -------------------- magnetic block parameters ------------------- #
    wash_incubation_time = 0.5  # minutes
    elution_incubation_time = 5  # minutes
    beads_binding_time = 5  # minutes

    # ------------------------------------------------------------------ #
    #                             Calculation                            #
    # ------------------------------------------------------------------ #
    cols = math.ceil(num_samples / 8)
    if num_samples % 8 == 0:
        cols_m = cols
        cols_s = 0
    elif num_samples % 8 != 0:
        if cols == 1:
            cols_m = 0
            cols_s = num_samples
        else:
            cols_m = cols - 1
            cols_s = num_samples % 8

    # Calculate tip requirements
    required_cols_1000_1 = cols  # Add beads
    required_cols_1000_2 = cols  # Remove supernatant after beads
    required_cols_1000_3 = cols  # Add MW1
    required_cols_1000_4 = cols  # Remove MW1
    required_cols_1000_5 = cols * 2  # Add ethanol x2
    required_cols_1000_6 = cols * 2  # Remove ethanol x2
    required_cols_1000_7 = cols  # Add elution
    required_cols_1000_8 = cols  # Remove eluted sample

    required_cols_1000 = (
        required_cols_1000_1
        + required_cols_1000_2
        + required_cols_1000_3
        + required_cols_1000_4
        + required_cols_1000_5
        + required_cols_1000_6
        + required_cols_1000_7
        + required_cols_1000_8
    )

    required_slots_num_1000 = math.ceil(required_cols_1000 / 12)

    print(f"required_cols_1000: {required_cols_1000}")
    print(f"required_slots_num_1000: {required_slots_num_1000}")

    # ------------------------------------------------------------------ #
    #                                tips                                #
    # ------------------------------------------------------------------ #
    slots_1000 = ["C1", "A1", "A2", "A3", "C3"][:required_slots_num_1000]
    tips1000 = [
        protocol.load_labware("opentrons_flex_96_filtertiprack_1000ul", slot)
        for slot in slots_1000
    ]

    # ------------------------------------------------------------------ #
    #                               Pipettes                             #
    # ------------------------------------------------------------------ #
    p1000m = protocol.load_instrument(
        "flex_8channel_1000",
        "left",
        tips1000,
    )

    # set the flow rates for the pipettes
    def set_up_flow_rate(p, asp_rate, disp_rate):
        p.flow_rate.aspirate = asp_rate
        p.flow_rate.dispense = disp_rate

    p1000m_default_flow_rate = 200
    set_up_flow_rate(
        p1000m, p1000m_default_flow_rate, p1000m_default_flow_rate
    )
    p1000m.flow_rate.blow_out = p1000m_default_flow_rate * 2

    # ------------------------------------------------------------------ #
    #                               Modules                              #
    # ------------------------------------------------------------------ #
    mag = protocol.load_module("magneticBlockV1", "D1")
    trash = protocol.load_trash_bin("D3")

    # ------------------------------------------------------------------ #
    #                               labware                              #
    # ------------------------------------------------------------------ #
    reagent_res = protocol.load_labware(
        "opentrons_tough_4_reservoir_72ml", "B2", "Reagent Reservoir"
    )
    ethanol_res = protocol.load_labware(
        "opentrons_tough_4_reservoir_72ml", "B3", "Ethanol Reservoir"
    )
    sample_plate = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "C2", "Sample Plate"
    )
    waste_res = protocol.load_labware(
        "nest_1_reservoir_195ml", "D2", "Waste Reservoir"
    )
    final_plate = protocol.load_labware(
        "nest_96_wellplate_2ml_deep", "B1", "Final Elution Plate"
    )
    transition_slot = sample_plate.parent

    # ------------------------------------------------------------------ #
    #                           Plate mapping                           #
    # ------------------------------------------------------------------ #

    # ------------------------ Reagent Reservoir ------------------------ #
    beads_res = reagent_res["A1"]
    mw1_res = reagent_res["A2"]
    elution_res = reagent_res["A3"]
    ethanol_res_1 = ethanol_res["A1"]
    ethanol_res_2 = ethanol_res["A2"]
    waste = waste_res.wells()[0]

    # -------------------------- Sample plate -------------------------- #
    str_index = str_col - 1
    end_index = str_index + cols
    if end_index > 12:
        raise ValueError(
            "The combination of starting column and number of columns exceeds the 12-column limit of the plate."
        )
    sample_plate_cols = sample_plate.rows()[0][str_index:end_index]
    sample_plate_cols_m = sample_plate.rows()[0][str_index : str_index + cols_m]
    if cols_s:
        sample_plate_cols_s = sample_plate.columns()[str_index + cols_m][:cols_s]
    else:
        sample_plate_cols_s = []
    sample_plate_wells = sample_plate.wells()[
        str_index * 8 : str_index * 8 + num_samples
    ]

    # ------------------- Final plate wells ------------------ #
    final_cols = final_plate.rows()[0][:cols]
    final_wells = [well for col in final_plate.columns()[:cols] for well in col][
        :num_samples
    ]

    print(f"sample_plate_cols: {sample_plate_cols}")
    print(f"sample_plate_cols_m: {sample_plate_cols_m}")
    print(f"sample_plate_cols_s: {sample_plate_cols_s}")
    print(f"sample_plate_wells: {sample_plate_wells}")
    print(f"final_cols: {final_cols}")
    print(f"final_wells: {final_wells}")

    # ------------------------------------------------------------------ #
    #                               liquids                              #
    # ------------------------------------------------------------------ #
    l_locations = [
        [beads_res],
        [mw1_res],
        [ethanol_res_1],
        [ethanol_res_2],
        [elution_res],
        [waste],
    ]
    l_volumes = [
        max(beads_vol * num_samples * 1.2, 25),
        max(mw1_vol * num_samples * 1.2, 25),
        max(ethanol_vol * num_samples * 1.2, 25),
        max(ethanol_vol * num_samples * 1.2, 25),
        max(elution_vol * num_samples * 1.2, 15),
        0,
    ]

    liquids = [
        "MagAttract Beads/QSB1 Mix",
        "Buffer MW1",
        "80% Ethanol",
        "80% Ethanol",
        "Solution C6 (Elution)",
        "Waste",
    ]
    descriptions = [
        f"MagAttract Suspension G beads/Buffer QSB1 mix, {beads_vol} µL per sample, {num_samples}x Samples, {l_volumes[0]:.1f} µL prepared",
        f"Buffer MW1, {mw1_vol} µL per sample, {num_samples}x Samples, {l_volumes[1]:.1f} µL prepared",
        f"80% Ethanol (Wash 1), {ethanol_vol} µL per sample, {num_samples}x Samples, {l_volumes[2]:.1f} µL prepared",
        f"80% Ethanol (Wash 2), {ethanol_vol} µL per sample, {num_samples}x Samples, {l_volumes[3]:.1f} µL prepared",
        f"Solution C6 (Elution), {elution_vol} µL per sample, {num_samples}x Samples, {l_volumes[4]:.1f} µL prepared",
        "Waste, reserved for waste, 0 µL at the beginning",
    ]
    # print description and only show one item in one line
    print("Liquid description:")
    for i, des in enumerate(descriptions):
        print(f"{i+1}: {des}")
    colors_full = [
        "#FF0000",  # Red
        "#0000FF",  # Blue
        "#008000",  # Green
        "#FFFF00",  # Yellow
        "#FFC0CB",  # Pink
        "#800080",  # Purple
        "#FFA500",  # Orange
        "#808080",  # Grey
        "#00FFFF",  # Cyan
        "#FF00FF",  # Magenta
        "#00FF00",  # Lime
        "#000080",  # Navy
        "#800000",  # Maroon
        "#808000",  # Olive
        "#008080",  # Teal
        "#C0C0C0",  # Silver
        "#FF6347",  # Tomato
        "#4682B4",  # SteelBlue
        "#D2691E",  # Chocolate
        "#FF4500",  # OrangeRed
        "#8A2BE2",  # BlueViolet
        "#A52A2A",  # Brown
        "#DEB887",  # BurlyWood
        "#5F9EA0",  # CadetBlue
        "#7FFF00",  # Chartreuse
        "#D2691E",  # Chocolate
        "#FF7F50",  # Coral
        "#6495ED",  # CornflowerBlue
        "#FFF8DC",  # Cornsilk
        "#DC143C",  # Crimson
        "#00FFFF",  # Cyan
        "#00008B",  # DarkBlue
        "#008B8B",  # DarkCyan
        "#B8860B",  # DarkGoldenRod
        "#A9A9A9",  # DarkGray
        "#006400",  # DarkGreen
        "#BDB76B",  # DarkKhaki
        "#8B008B",  # DarkMagenta
        "#556B2F",  # DarkOliveGreen
        "#FF8C00",  # DarkOrange
    ]  # 40 colors

    colors_full = [x.upper() for x in colors_full]

    # make a new color list to match the liquids order.
    # Use the same color for the same liquid.
    # If the liquid is used more than once,
    # use the same color for all instances.
    colors = []
    for i, liquid in enumerate(liquids):
        if liquid not in liquids[:i]:
            colors.append(colors_full[i])
        else:
            colors.append(colors[liquids.index(liquid)])

    for liquid, des, color, v, loc_list in zip(
        liquids, descriptions, colors, l_volumes, l_locations
    ):
        liq = protocol.define_liquid(
            name=str(liquid), description=str(des), display_color=color
        )
        for loc in loc_list:
            loc.load_liquid(liquid=liq, volume=v)

    # label the wells in the sample_wells
    for k, well in enumerate(sample_plate_wells):
        liq = protocol.define_liquid(
            f"Sample x{k+1}",
            description=f"Sample x{k+1}, lysate, {str_vol} µL at beginning",
            display_color=colors_full[len(colors) + 1],
        )
        well.load_liquid(liquid=liq, volume=str_vol)

    # label the reserved wells in the final plate
    for j, well in enumerate(final_wells):
        liq = protocol.define_liquid(
            f"Final Eluted Sample x{j+1}",
            description=f"Final Eluted Sample x{j+1}, {elution_vol} µL, 0 µL at beginning",
            display_color=colors_full[len(colors) + 2],
        )
        well.load_liquid(liquid=liq, volume=0)

    protocol.comment("Liquids defined successfully.")

    # ------------------------------------------------------------------ #
    #                       custom functions, basic                      #
    # ------------------------------------------------------------------ #
    pause_count = 1

    def pause_attention(msg="Pause", flash=False):
        """Pause the robot, flash the lights, and display a message."""
        nonlocal pause_count

        if flash:
            for _ in range(3):
                protocol.set_rail_lights(False)
                protocol.delay(seconds=0.25)
                protocol.set_rail_lights(True)
                protocol.delay(seconds=0.25)
            protocol.set_rail_lights(False)
            protocol.delay(seconds=0.25)
            protocol.set_rail_lights(True)
        protocol.home()
        protocol.comment(f"\n\nPAUSE x{pause_count}")
        protocol.pause(msg)
        pause_count += 1

    def custom_delay(name, time):
        """Custom delay function to pause the protocol for a specified time."""
        if DRY_WATER_RUN:
            for j in np.arange(time, 0, -time):
                msg = f"There are {j} seconds left in the {name} step"
                protocol.delay(seconds=time, msg=msg)
        else:
            for j in np.arange(time, 0, -0.5):
                msg = f"There are {j} minutes left in the {name} step"
                protocol.delay(minutes=0.5, msg=msg)

    def pipette_mode_selection(single=False):
        """Select the appropriate pipette based on the volume."""
        p = p1000m
        r = tips1000
        if single:
            protocol.comment("\n--------------------------")
            protocol.comment("---Single-channel Mode---")
            protocol.comment(f"---P{p.max_volume}---")
            protocol.comment("--------------------------\n")
            if p.active_channels != 1:
                p.configure_nozzle_layout(style=SINGLE, start="A1", tip_racks=r)
        else:
            protocol.comment("\n--------------------------")
            protocol.comment("---Multi-channel Mode---")
            protocol.comment(f"---P{p.max_volume}M---")
            protocol.comment("--------------------------\n")
            if p.active_channels != 8:
                p.configure_nozzle_layout(style=ALL, tip_racks=r)
        return p

    def pick_up(pipette):
        """Pick up tip with error handling."""
        try:
            pipette.pick_up_tip()
        except protocol_api.labware.OutOfTipsError:
            pause_attention(
                f"\n\nReplace empty tipracks for {pipette} before resuming."
            )
            pipette.reset_tipracks()
            pipette.pick_up_tip()

    def tip_disposal(pipette):
        """Dispose of or return the tip based on the run mode."""
        if DRY_WATER_RUN:
            pipette.return_tip()
        elif pipette.has_tip:
            pipette.drop_tip(trash)

    def slow_withdraw(pipette, well, z=0, delay_seconds=0):
        """Slowly withdraw pipette from a well to minimize sample loss."""
        original_speed = pipette.default_speed
        pipette.default_speed = 10  # mm/s
        if delay_seconds > 0:
            protocol.delay(seconds=delay_seconds)
        pipette.move_to(well.top(z))
        pipette.default_speed = original_speed

    # ------------------------------------------------------------------ #
    #                      custom function, advanced                     #
    # ------------------------------------------------------------------ #
    def custom_mix(p, mvol, mix_loc, mix_rep, low=False, high=False):
        """Custom mixing function for pipettes.

        Args:
            p (protocol_api.Pipette): pipette
            mvol (float): mixing volume
            mix_loc (protocol_api.Well): location to mix
            mix_rep (int): number of mixing repetitions
            low (bool, optional): low position for mixing. Defaults to False.
            high (bool, optional): high position for mixing. Defaults to False.
        Raises:
            ValueError: If the mixing volume exceeds the tip capacity.
        """
        asp = mix_loc.bottom(low if low else 1.5)
        disp = mix_loc.bottom(high if high else 2.5)

        extra_vol = 5
        max_vol = 0.5 * p.tip_racks[0].wells()[0].max_volume
        mix_vol = sorted([extra_vol, max_vol, mvol])[1]
        if mix_vol + extra_vol > p.tip_racks[0].wells()[0].max_volume:
            raise ValueError(
                f"Mixing volume {mix_vol} + extra {extra_vol} exceeds tip capacity"
            )
        protocol.comment(
            f"\n---Mixing: {mix_vol} µL with {extra_vol} µL extra for {mix_rep}x reps---"
        )
        # Perform mixing
        p.aspirate(extra_vol, asp, rate=1)
        for i in range(mix_rep):
            last_mix = i == mix_rep - 1
            p.aspirate(mix_vol, asp, rate=1)
            # For last mix, move to center with offset
            last_disp_loc = (
                mix_loc.bottom().move(
                    types.Point(x=-2.0, y=0, z=0.5 * mix_loc.depth)
                )
                if last_mix
                else disp
            )
            vol = p.current_volume if last_mix else mix_vol
            if last_mix:
                p.move_to(last_disp_loc, speed=10)
            p.dispense(vol, last_disp_loc, rate=1)
        protocol.comment("---Mixing complete---\n")

    def well_to_list(
        s_l,
        d_l,
        a_vol,
        c_vol,
        l_rate,
        z1,
        z2,
        pre_mix=False,
        post_mix_vol=0,
        post_mix_rep=0,
        single_tip=False,
        change_tip=True,
        y_adjustment=False,
    ):
        """Transfer liquid from source wells to destination wells with optional pre- and post-mixing.

        Args:
            s_l (list): List of source wells.
            d_l (list): List of destination wells.
            a_vol (float): Aspirate volume.
            c_vol (float): Compensation volume.
            l_rate (float): Liquid handling rate.
            z1 (float): Aspiration height.
            z2 (float): Dispense height.
            pre_mix (bool, optional): Whether to pre-mix the source well. Defaults to False.
            post_mix_vol (float, optional): Volume for post-mixing. Defaults to 0.
            post_mix_rep (int, optional): Number of post-mixing repetitions. Defaults to 0.
            single_tip (bool, optional): Whether to use a single tip. Defaults to False.
            change_tip (bool, optional): Whether to change tips between transfers. Defaults to True.
            y_adjustment (bool, optional): Whether to adjust the Y position for aspiration for the single-tip mode. Defaults to False.
        """
        total_vol = a_vol + c_vol
        pipette = pipette_mode_selection(single=single_tip)
        for i, (s, d) in enumerate(zip(s_l, d_l)):
            if y_adjustment:
                asp_loc = s.bottom(z1).move(types.Point(x=0, y=s.width / 2 - 3))
                c_loc = s.bottom(z1).move(types.Point(x=0, y=s.width / 2 - 3))
            else:
                asp_loc = s.bottom(z1)
                c_loc = s.bottom(z1)
            protocol.comment(f"\n---x{i+1}: {a_vol} µL---")
            protocol.comment(f"---Source: {s}---")
            protocol.comment(f"---Destination: {d}---")
            if not pipette.has_tip:
                pick_up(pipette)

            if pre_mix:
                custom_mix(
                    pipette,
                    total_vol,
                    s,
                    mix_rep=5,
                    low=1 if total_vol <= 100 else 1.5,
                    high=1.5 if total_vol <= 100 else 3,
                )

            pipette.aspirate(total_vol, asp_loc, rate=l_rate)
            protocol.delay(seconds=1)
            if c_vol > 0:
                pipette.dispense(c_vol, c_loc, rate=l_rate / 2)
            slow_withdraw(pipette, s, z=-3, delay_seconds=1)
            pipette.dispense(pipette.current_volume, d.bottom(z2), rate=l_rate)

            if post_mix_vol > 0:
                custom_mix(
                    pipette,
                    post_mix_vol,
                    d,
                    post_mix_rep,
                    low=1 if post_mix_vol <= 100 else 1.5,
                    high=1.5 if post_mix_vol <= 100 else 2.5,
                )
            slow_withdraw(pipette, d, z=-3, delay_seconds=1)

            if change_tip or (not change_tip and i == len(s_l) - 1):
                if single_tip:
                    pipette.drop_tip(trash)
                else:
                    tip_disposal(pipette)

    def add_reagent(name="beads"):
        """
        Add a reagent to the sample plate based on the name.

        Args:
            name (str, optional): Name of the reagent to add. Defaults to "beads".

        Raises:
            ValueError: If the reagent name is not recognized.
        """
        reagents = {
            "beads": {
                "source_m": [beads_res] * cols_m,
                "source_s": [beads_res] * cols_s if cols_s > 0 else [],
                "destination_m": sample_plate_cols_m,
                "destination_s": sample_plate_cols_s,
                "volume": beads_vol,
                "conditioning_volume": 5,
                "liquid_rate": beads_rate,
                "asp_height": 1.5,
                "disp_height": 1.5,
                "pre_mix_status": True,
                "post_mix_volume": 0.75 * beads_vol,
                "post_mix_reps": 10,
            },
            "mw1_buffer": {
                "source_m": [mw1_res] * cols_m,
                "source_s": [mw1_res] * cols_s if cols_s > 0 else [],
                "destination_m": sample_plate_cols_m,
                "destination_s": sample_plate_cols_s,
                "volume": mw1_vol,
                "conditioning_volume": 5,
                "liquid_rate": buffer_rate,
                "asp_height": 1.5,
                "disp_height": sample_plate.wells()[0].depth - 1.5,
                "pre_mix_status": False,
                "post_mix_volume": 0.6 * mw1_vol,
                "post_mix_reps": 5,
            },
            "ethanol_1": {
                "source_m": [ethanol_res_1] * cols,
                "source_s": [],
                "destination_m": sample_plate_cols,
                "destination_s": [],
                "volume": ethanol_vol,
                "conditioning_volume": 5,
                "liquid_rate": ethanol_rate,
                "asp_height": 2,
                "disp_height": sample_plate.wells()[0].depth - 1.5,
                "pre_mix_status": False,
                "post_mix_volume": 0.6 * ethanol_vol,
                "post_mix_reps": 5,
            },
            "ethanol_2": {
                "source_m": [ethanol_res_2] * cols,
                "source_s": [],
                "destination_m": sample_plate_cols,
                "destination_s": [],
                "volume": ethanol_vol,
                "conditioning_volume": 5,
                "liquid_rate": ethanol_rate,
                "asp_height": 2,
                "disp_height": sample_plate.wells()[0].depth - 1.5,
                "pre_mix_status": False,
                "post_mix_volume": 0.6 * ethanol_vol,
                "post_mix_reps": 5,
            },
            "elution_buffer": {
                "source_m": [elution_res] * cols_m,
                "source_s": [elution_res] * cols_s if cols_s > 0 else [],
                "destination_m": sample_plate_cols_m,
                "destination_s": sample_plate_cols_s,
                "volume": elution_vol,
                "conditioning_volume": 5,
                "liquid_rate": elution_rate,
                "asp_height": 1.5,
                "disp_height": 1.5,
                "pre_mix_status": False,
                "post_mix_volume": 0.6 * elution_vol,
                "post_mix_reps": 15,
            },
        }

        if name not in reagents:
            raise ValueError(f"Invalid reagent name: {name}")

        reagent = reagents[name]
        source_m = reagent["source_m"]
        source_s = reagent["source_s"]
        destination_m = reagent["destination_m"]
        destination_s = reagent["destination_s"]
        volume = reagent["volume"]
        conditioning_volume = reagent["conditioning_volume"]
        liquid_rate = reagent["liquid_rate"]
        asp_height = reagent["asp_height"]
        disp_height = reagent["disp_height"]
        pre_mix_status = reagent["pre_mix_status"]
        post_mix_volume = reagent["post_mix_volume"]
        post_mix_reps = reagent["post_mix_reps"]

        protocol.comment(f"\n\n~~~{name.title()} Addition~~~")
        if destination_m:
            well_to_list(
                s_l=source_m,
                d_l=destination_m,
                a_vol=volume,
                c_vol=conditioning_volume,
                l_rate=liquid_rate,
                z1=asp_height,
                z2=disp_height,
                pre_mix=pre_mix_status,
                post_mix_vol=post_mix_volume,
                post_mix_rep=post_mix_reps,
                single_tip=False,
                change_tip=True,
                y_adjustment=False,
            )
        if destination_s:
            well_to_list(
                s_l=source_s,
                d_l=destination_s,
                a_vol=volume,
                c_vol=conditioning_volume,
                l_rate=liquid_rate,
                z1=asp_height,
                z2=disp_height,
                pre_mix=pre_mix_status,
                post_mix_vol=post_mix_volume,
                post_mix_rep=post_mix_reps,
                single_tip=True,
                change_tip=True,
                y_adjustment=True,
            )

    def remove(re_vol, re_s_list, re_mode, re_after=False):
        """
        Remove liquids from the source wells to the destination wells.

        Args:
            re_vol (float): Volume to remove.
            re_s_list (list): List of source wells.
            re_mode (str): Mode of removal, one of ["beads_supernatant", "wash_buffer", "elution"].
            re_after (bool, optional): Whether to move the labware after removal. Defaults to False.

        Raises:
            ValueError: If an invalid mode is provided.
        """
        if re_mode not in ["beads_supernatant", "wash_buffer", "elution"]:
            raise ValueError("A wrong mode is used")

        if re_mode == "elution":
            dest_list = final_cols
        else:
            dest_list = [waste] * len(re_s_list)
        # always use multiple channel
        pip = pipette_mode_selection(single=False)

        for i, (s, d) in enumerate(zip(re_s_list, dest_list)):
            protocol.comment(f"\n~~~{re_mode.title()} Removal, Column x{i+1}~~~")
            protocol.comment(f"---Source: {str(s)}")
            protocol.comment(f"---Destination: {str(d)}")

            if re_mode == "elution":
                re_rate = elution_rate
                loc = d.bottom(1.5).move(types.Point(x=-0.75, y=0, z=0))
                loc_opposite = d.bottom(1.5).move(
                    types.Point(x=0.75, y=0, z=0)
                )
            elif re_mode == "wash_buffer":
                re_rate = buffer_rate
                loc = d.top(-3)
            elif re_mode == "beads_supernatant":
                re_rate = sample_rate
                loc = d.top(-3)

            if not pip.has_tip:
                pick_up(pip)

            # For large volumes (>500 µL), split into multiple aspirations
            if re_vol > 500:
                # First aspiration: 50% of volume from mid-height
                first_vol = re_vol * 0.5
                pip.aspirate(
                    first_vol,
                    s.bottom().move(types.Point(x=0, y=0, z=0.5 * s.depth)),
                    rate=0.1,
                )
                slow_withdraw(pip, s, z=3, delay_seconds=2)
                pip.aspirate(10, rate=0.2)
                pip.dispense(pip.current_volume, loc, rate=re_rate)
                protocol.delay(seconds=1)
                pip.blow_out(loc)
                protocol.delay(seconds=5)

                # Second aspiration: remaining volume from bottom
                asp_vol = re_vol - first_vol
                extra_vol = 20
            else:
                asp_vol = re_vol
                extra_vol = 20

            if asp_vol + extra_vol * 2 > pip.tip_racks[0].wells()[0].max_volume:
                extra_vol = (
                    pip.tip_racks[0].wells()[0].max_volume - asp_vol
                ) / 2

            disp_vol = asp_vol + 2 * extra_vol

            # Main aspiration from bottom with offset
            pip.aspirate(
                asp_vol,
                s.bottom().move(types.Point(x=x_offset, y=y_offset, z=z_height_1)),
                rate=0.05,
            )
            pip.move_to(s.top(-0.5 * s.depth), speed=10)
            protocol.delay(seconds=10)

            # Extra aspiration for complete removal
            pip.aspirate(
                2 * extra_vol,
                s.bottom().move(types.Point(x=x_offset, y=y_offset, z=z_height_2)),
                rate=0.05,
            )
            slow_withdraw(pip, s, z=-3, delay_seconds=2)
            pip.dispense(disp_vol, loc, rate=re_rate)

            if re_mode != "elution":
                pip.blow_out(loc)

            if re_mode == "elution":
                pip.move_to(loc_opposite, speed=10)
                slow_withdraw(pip, d, z=-0.5 * d.depth, delay_seconds=2)
                pip.blow_out(d.top(-0.5 * d.depth))
            else:
                protocol.comment("\n---Residual Removal---")
                pip.move_to(s.top(-0.5 * s.depth))
                protocol.delay(seconds=5)
                # 3rd removal for residual liquid
                pip.aspirate(
                    extra_vol,
                    s.bottom().move(types.Point(x=x_offset, y=y_offset, z=z_height_2)),
                    rate=0.05,
                )
                slow_withdraw(pip, s, z=-3, delay_seconds=2)
                pip.dispense(extra_vol, loc, rate=re_rate)
                protocol.delay(seconds=1)

            tip_disposal(pip)
            protocol.comment("\n")

        if re_after:
            protocol.move_labware(re_s_list[0].parent, re_after, use_gripper=True)

    def bind(b_re_vol, b_list, b_mode, b_after=False):
        """
        Handle the binding of beads to the sample, incubation, and removal.

        Args:
            b_re_vol (float): Volume to remove during binding.
            b_list (list): List of wells to bind.
            b_mode (str): Mode of binding, one of ["beads_supernatant", "wash_buffer", "elution"].
            b_after (bool, optional): Whether to perform the removal after a certain step. Defaults to False.

        Raises:
            ValueError: If an invalid mode is provided.
        """
        protocol.comment("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        protocol.comment(" Binding starts")
        protocol.comment("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        protocol.move_labware(b_list[0].parent, mag, use_gripper=True)
        custom_delay("Beads Binding", beads_binding_time)
        protocol.comment("\n Beads Binding Removal Starts")
        remove(b_re_vol, b_list, b_mode, b_after)

    def wash(w_vol, w_list, w_mode, reagent_name, move_after=None):
        """
        Handle the washing of beads with buffer.

        Args:
            w_vol (float): Volume to wash with.
            w_list (list): List of wells to wash.
            w_mode (str): Mode of washing, one of ["wash_buffer"].
            reagent_name (str): Name of reagent to add.
            move_after (str, optional): Location to move plate after wash. Defaults to None.

        Raises:
            ValueError: If an invalid mode is provided.

        """
        protocol.comment("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        protocol.comment(f" {w_mode.title()} Wash starts")
        protocol.comment("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

        # Move plate off magnetic block if needed for reagent addition
        if w_list[0].parent.parent != transition_slot:
            protocol.move_labware(w_list[0].parent, transition_slot, use_gripper=True)

        add_reagent(reagent_name)
        custom_delay("Wash Incubation", time=wash_incubation_time)

        protocol.comment("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        protocol.comment(f" {w_mode.title()} Removal starts")
        protocol.comment("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

        # Move to magnetic block for removal
        protocol.move_labware(w_list[0].parent, mag, use_gripper=True)
        custom_delay("Magnetic Binding", beads_binding_time)
        remove(w_vol, w_list, w_mode, re_after=False)

        # Move plate to specified location after wash if provided
        if move_after is not None:
            protocol.move_labware(w_list[0].parent, move_after, use_gripper=True)

    def elution(e_re_vol, e_d_list, e_mode, e_after=False):
        """
        Handle the elution of the sample from the beads.

        Args:
            e_re_vol (float): Volume to remove during elution.
            e_d_list (list): List of wells to elute.
            e_mode (str): Mode of elution, one of ["elution"].
            e_after (bool, optional): Whether to perform the removal after a certain step. Defaults to False.

        Raises:
            ValueError: If an invalid mode is provided.
        """
        protocol.comment("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        protocol.comment(f" {e_mode.title()} starts")
        protocol.comment("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")

        # Move plate off magnetic block for elution buffer addition
        if e_d_list[0].parent.parent != transition_slot:
            protocol.move_labware(e_d_list[0].parent, transition_slot, use_gripper=True)

        add_reagent("elution_buffer")

        # Move to magnetic block for elution
        protocol.move_labware(e_d_list[0].parent, mag, use_gripper=True)
        custom_delay("Elution Binding", time=elution_incubation_time)

        protocol.comment("\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        protocol.comment(" Elution Removal starts")
        protocol.comment("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        remove(e_re_vol, e_d_list, e_mode, re_after=e_after)

    # ------------------------------------------------------------------ #
    #                        protocol starts here                        #
    # ------------------------------------------------------------------ #
    if remove_test:
        if sample_plate.parent != mag:
            protocol.move_labware(sample_plate, mag, use_gripper=True)
        if test_beads_vol > 0:
            custom_delay(
                "Test Run for Removing Beads Supernatant", time=beads_binding_time
            )
            remove(test_beads_vol, sample_plate_cols, "beads_supernatant", re_after=False)
        protocol.comment(
            "\n\n---Remove Test Run---\n"
            "This is a test run for removing liquids. No reagents will be added.\n\n"
        )
        wash(
            mw1_vol,
            sample_plate_cols,
            "wash_buffer",
            "mw1_buffer",
            move_after=transition_slot,
        )
        elution(elution_vol, sample_plate_cols, "elution")
    else:
        protocol.comment("\n---Protocol starts---\n")
        pause_attention(
            "Make sure all reagents are prepared and placed in the correct slots. Then, click Resume.",
            flash=True,
        )

        protocol.comment("---Step 1: Add MagAttract Beads/QSB1 Mix---")
        add_reagent("beads")

        protocol.comment("---Step 2: Bind beads and remove supernatant---")
        bind(beads_vol + str_vol, sample_plate_cols, "beads_supernatant")

        protocol.comment("---Step 3-4: Add Buffer MW1, bind and remove---")
        wash(
            mw1_vol,
            sample_plate_cols,
            "wash_buffer",
            "mw1_buffer",
            move_after=transition_slot,
        )

        protocol.comment("---Step 5: Add 80% Ethanol (Wash 1), bind and remove---")
        wash(
            ethanol_vol,
            sample_plate_cols,
            "wash_buffer",
            "ethanol_1",
            move_after=transition_slot,
        )

        protocol.comment("---Step 6: Add 80% Ethanol (Wash 2), bind and remove---")
        wash(
            ethanol_vol,
            sample_plate_cols,
            "wash_buffer",
            "ethanol_2",
            move_after=transition_slot,
        )

        protocol.comment(
            "---Step 7-8: Add Solution C6 (Elution) and transfer to final plate---"
        )
        elution(elution_vol, sample_plate_cols, "elution")

        pause_attention(
            f"Protocol completed. Remove the final plate on slot {final_plate.parent}",
            flash=True,
        )
