"""SMC High Sensitivity Immunoassay Protocol."""
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Well,
)
from opentrons import types
from opentrons.protocol_api.module_contexts import HeaterShakerContext


metadata = {
    "protocolName": "SMC High Sensitivity Immunoassay_updated increased tolerances and labware",
    "author": "Science Team, Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol context."""
    # Mount selection
    parameters.add_str(
        variable_name="mount_multi",
        display_name="P1000 8-ch Position",
        description="How P1000 8-channel pipette is mounted?",
        default="left",
        choices=[
            {"display_name": "Left", "value": "left"},
            {"display_name": "Right", "value": "right"},
        ],
    )

    # Detection antibody selection
    parameters.add_str(
        variable_name="detection_AB",
        display_name="Assay Target",
        description="Select the analyze for the assay",
        default="IL-22",
        choices=[
            {"display_name": "IL-22", "value": "IL-22"},
            {"display_name": "IL-17A", "value": "IL-17A"},
            {"display_name": "IL-6", "value": "IL-6"},
            {"display_name": "cTnI", "value": "cTnI"},
            {"display_name": "IL-23", "value": "IL-23"},
            {"display_name": "IL-17F", "value": "IL-17F"},
            {"display_name": "IL-12p70", "value": "IL-12p70"},
            {"display_name": "pTau217", "value": "pTau217"},
            {"display_name": "pTau231", "value": "pTau231"},
            {"display_name": "AB1-40", "value": "AB1-40"},
            {"display_name": "AB1-42", "value": "AB1-42"},
            {"display_name": "BDNF", "value": "BDNF"},
            {"display_name": "p-aSynuclein", "value": "p-aSynuclein"},
            {"display_name": "total aSynuclein", "value": "total aSynuclein"},
            {"display_name": "GFAP", "value": "GFAP"},
            {"display_name": "NF-L", "value": "NF-L"},
            {"display_name": "NPTX2", "value": "NPTX2"},
            {"display_name": "SNAP-25", "value": "SNAP-25"},
            {"display_name": "TDP-43", "value": "TDP-43"},
            {"display_name": "pTau181", "value": "pTau181"},
            {"display_name": "Total Tau", "value": "Total Tau"},
            {"display_name": "IFNL1", "value": "IFN-L1"},
            {"display_name": "IFN-a2", "value": "IFN-a2"},
            {"display_name": "IFN-b1", "value": "IFN-b1"},
            {"display_name": "IFN-g", "value": "IFN-g"},
            {"display_name": "IL-1a", "value": "IL-1a"},
            {"display_name": "IL-1b", "value": "IL-1b"},
            {"display_name": "IL-2", "value": "IL-2"},
            {"display_name": "IL-4", "value": "IL-4"},
            {"display_name": "IL-5", "value": "IL-5"},
            {"display_name": "IL-10", "value": "IL-10"},
            {"display_name": "IL-13", "value": "IL-13"},
            {"display_name": "IL-17A/F", "value": "IL-17A/F"},
            {"display_name": "IL-18", "value": "IL-18"},
            {"display_name": "MCP-1", "value": "MCP-1"},
            {"display_name": "TNFa", "value": "TNFa"},
            {"display_name": "VEGF", "value": "VEGF"},
            {"display_name": "UCHL1", "value": "UCHL1"},
            {"display_name": "PD-1", "value": "PD-1"},
            {"display_name": "PD-L1", "value": "PD-L1"},
            {"display_name": "Glucagon", "value": "Glucagon"},
            {"display_name": "NGFb", "value": "NGFb"}
            # Add other antibody options as needed
        ],
    )

    # Run type selection
    parameters.add_str(
        variable_name="run_type",
        display_name="Run Type",
        description="Standards only or Standards + Samples",
        default="Standards+Samples",
        choices=[
            {"display_name": "Standards", "value": "Standards"},
            {"display_name": "Standards+Samples", "value": "Standards+Samples"},
        ],
    )

    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="Skip delays, shorten mix steps, and return tips to racks",
        default=False,
    )

    parameters.add_bool(
        variable_name="dilute_samples",
        display_name="Dilute Samples",
        description="Enable/disable 1:2 sample dilution, otherwise Neat",
        default=False,
    )

    parameters.add_int(
        variable_name="num_samples",
        display_name="Number of Samples",
        description="Number of samples to process (max 20 in triplicate)",
        default=6,
        minimum=1,
        maximum=20,
    )


def run(ctx: ProtocolContext) -> None:
    """Run the SMC High Sensitivity Immunoassay protocol."""
    # Changing Parameters Depending on Download Configurations

    # # Changable parameters in the protocol
    jitterbug_3 = 750
    jitterbug_5 = 1000
    Z_OFFSET_RESERVOIR = 1.0
    Z_OFFSET_ELU = 0.4

    dil_ratio = 2

    mount_multi = ctx.params.mount_multi  # type: ignore[attr-defined]
    detection_AB = ctx.params.detection_AB  # type: ignore[attr-defined]
    run_type = ctx.params.run_type  # type: ignore[attr-defined]

    dry_run = ctx.params.dry_run  # type: ignore[attr-defined]
    dilute_samples = ctx.params.dilute_samples  # type: ignore[attr-defined]
    num_samples = ctx.params.num_samples  # type: ignore[attr-defined]

    if mount_multi == "left":
        mount_single = "right"
    else:
        mount_single = "left"

    ctx.comment(f"Detection AB Being Used: {detection_AB}")

    if detection_AB == "IL-17A" or "cTnI":
        detection_incubation = 0.5 if detection_AB == "cTnI" else 1  # hours
        capture_incubation = 1 if detection_AB == "cTnI" else 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 3 + [500] * 8
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-2":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 3 + [500] * 8
        stdrd_descrip = "Standard 1"

    if detection_AB == "NF-L":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 3 + [500] * 8
        stdrd_descrip = "Standard 1"

    if detection_AB == "NPTX2":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 3 + [500] * 8
        stdrd_descrip = "Standard 1"

    if detection_AB == "PD-1":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 3 + [500] * 8
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-6":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 75
        standard_dil_vols = [1000] * 4 + [500] * 7
        stdrd_descrip = "Standard 1"

    if detection_AB == "IFN-a2":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 4 + [500] * 7
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-5":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 4 + [500] * 7
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-13":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 4 + [500] * 7
        stdrd_descrip = "Standard 1"

    if detection_AB == "MCP-1":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 4 + [500] * 7
        stdrd_descrip = "Standard 1"

    if detection_AB == "BDNF":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 4 + [500] * 7
        stdrd_descrip = "Standard 1"

    if detection_AB == "GFAP":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 4 + [500] * 7
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-22":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-23":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-12p70":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-17F":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "pTau217":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "pTau231":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-1a":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-1b":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "PD-L1":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "Glucagon":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-17A/F":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-4":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-10":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "TNFa":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "VEGF-A":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "p-aSynuclein":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "total aSynuclein":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "AB1-40":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "AB1-42":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "pTau181":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "total Tau":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [500] * 11
        stdrd_descrip = "Standard 1"

    if detection_AB == "IFNb1":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 2 + [500] * 9
        stdrd_descrip = "Standard 1"

    if detection_AB == "IL-18":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 2 + [500] * 9
        stdrd_descrip = "Standard 1"

    if detection_AB == "NGFb":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 2 + [500] * 9
        stdrd_descrip = "Standard 1"

    if detection_AB == "SNAP-25":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 2 + [500] * 9
        stdrd_descrip = "Standard 1"

    if detection_AB == "TDP-43":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 2 + [500] * 9
        stdrd_descrip = "Standard 1"

    if detection_AB == "IFN-L1":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 1 + [500] * 10
        stdrd_descrip = "Standard 1"

    if detection_AB == "IFN-g":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 1 + [500] * 10
        stdrd_descrip = "Standard 1"

    if detection_AB == "UCHL1":
        detection_incubation = 1  # hours
        capture_incubation = 2  # hours
        volume_s = 100
        standard_dil_vols = [1000] * 1 + [500] * 10
        stdrd_descrip = "Standard 1"

    if (
        detection_AB != "IL-6"
        and detection_AB != "IL-17A"
        and detection_AB != "cTnI"
        and detection_AB != "IL-22"
        and detection_AB != "IL-2"
        and detection_AB != "NF-L"
        and detection_AB != "NPTX2"
        and detection_AB != "PD-1"
        and detection_AB != "IFN-a2"
        and detection_AB != "IL-5"
        and detection_AB != "IL-13"
        and detection_AB != "MCP-1"
        and detection_AB != "BDNF"
        and detection_AB != "GFAP"
        and detection_AB != "IL-23"
        and detection_AB != "IL-12p70"
        and detection_AB != "IL-17F"
        and detection_AB != "IL-17A/F"
        and detection_AB != "pTau217"
        and detection_AB != "pTau231"
        and detection_AB != "IL-1a"
        and detection_AB != "IL-1b"
        and detection_AB != "PD-L1"
        and detection_AB != "Glucagon"
        and detection_AB != "IFN-b1"
        and detection_AB != "IL-18"
        and detection_AB != "NGFb"
        and detection_AB != "IFN-L1"
        and detection_AB != "IFN-g"
        and detection_AB != "UCHL1"
        and detection_AB != "IL-4"
        and detection_AB != "IL-10"
        and detection_AB != "TNFa"
        and detection_AB != "VEGF-A"
        and detection_AB != "p-aSynuclein"
        and detection_AB != "total aSynuclein"
        and detection_AB != "AB1-40"
        and detection_AB != "AB1-42"
        and detection_AB != "pTau181"
        and detection_AB != "total Tau"
        and detection_AB != "SNAP-25"
        and detection_AB != "TDP-43"
    ):
        raise Exception(
            "No assay associated with the chosen Antibody, please pick another."
        )

    ctx.comment(
        f"""Detection Incubation: {detection_incubation};
        Capture Incubtation: {capture_incubation};
        Sample Vol: {volume_s}"""
    )

    sample_vol = 3.5 * volume_s

    h_s: HeaterShakerContext = ctx.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = h_s.load_adapter("opentrons_universal_flat_adapter")
    h_s.close_labware_latch()
    assay_plate = hs_adapter.load_labware("axygen_96_wellplate_500ul", "Assay plate")

    waste = ctx.load_trash_bin("D3")
    elution_plate = ctx.load_labware(
        "smc_384_read_plate", "C1", "Read plate without skirted lid"
    )
    standard_plate = ctx.load_labware(
        "nest_96_wellplate_2ml_deep", "D2", "Starting standards + sample plate"
    )

    magblock = ctx.load_adapter("millipore_24_ball_magnet", "C2")

    reservoir = ctx.load_labware("nest_12_reservoir_15ml", "B2", "Reagents")

    # Load tips for single (standards) and multi-channel (samples) use

    tips_1000 = ctx.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul", "A2", "1000ul Tip Box"
    )

    tips_50 = ctx.load_labware(
        "opentrons_flex_96_filtertiprack_50ul", "A1", "50ul tip box #1"
    )
    tips_51 = ctx.load_labware(
        "opentrons_flex_96_filtertiprack_50ul", "B1", "50ul tip box #2"
    )

    # pipettes
    M1000 = ctx.load_instrument(
        "flex_8channel_1000", mount_multi
    )  # Multi-channel pipette
    S1000 = ctx.load_instrument(
        "flex_1channel_1000", mount_single, tip_racks=[tips_1000]
    )  # Single-channel pipette

    # Placing Reagents

    standard_diluent = reservoir.rows()[0][0]
    if dilute_samples:
        sample_diluent = reservoir.rows()[0][1]
    coated_beads = reservoir.rows()[0][3]
    detection_antibody = reservoir.rows()[0][4]
    buffer_b = reservoir.rows()[0][5]
    buffer_d = reservoir.rows()[0][6]
    if run_type == "Standards+Samples":
        if num_samples > 12:
            dif = num_samples - 12
            samples = standard_plate.rows()[-2][0:] + standard_plate.rows()[-1][:dif]
        else:
            samples = standard_plate.rows()[-2][:num_samples]
    standard_1 = standard_plate.wells()[0]

    # Defining Liquids

    standard_diluent_liq = ctx.define_liquid(
        name="Standard Diluent",
        description="Standard Diluent",
        display_color="#00FF00",
    )
    if dilute_samples:
        sample_diluent_liq = ctx.define_liquid(
            name="Sample diluent",
            description="Sample Diluent only if 1:2 sample dilution selected",
            display_color="#0000FF",
        )
    coated_beads_liq = ctx.define_liquid(
        name="Coated Beads",
        description="Coated Beads",
        display_color="#FF0000",
    )
    detection_AB_liq = ctx.define_liquid(
        name="Detection Antibody",
        description="Detection Antibody",
        display_color="#348A06",
    )
    buffer_b_liq = ctx.define_liquid(
        name="Elution Buffer B",
        description="Elution Buffer B",
        display_color="#1D9EB6",
    )
    buffer_d_liq = ctx.define_liquid(
        name="Buffer D",
        description="Buffer D",
        display_color="#ffc933",
    )

    if run_type == "Standards+Samples":
        samples_liq = ctx.define_liquid(
            name="Samples", description="Samples", display_color="#f833ff"
        )
    standard_1_liq = ctx.define_liquid(
        name="Standard 1", description=stdrd_descrip, display_color="#D0BF15"
    )

    # Loading Liquids

    standard_diluent.load_liquid(standard_diluent_liq, volume=12100)
    if dilute_samples:
        sample_diluent.load_liquid(
            sample_diluent_liq, volume=((dil_ratio * num_samples) * volume_s) + 1500
        )
    coated_beads.load_liquid(coated_beads_liq, volume=11500)
    detection_antibody.load_liquid(detection_AB_liq, volume=4000)
    buffer_d.load_liquid(buffer_d_liq, volume=2500)  # mostly dead volume
    buffer_b.load_liquid(buffer_b_liq, volume=2500)
    standard_1.load_liquid(standard_1_liq, volume=1000)
    if run_type == "Standards+Samples":
        for well in samples:
            if not dilute_samples:
                well.load_liquid(samples_liq, volume=sample_vol + 20)
            else:
                well.load_liquid(samples_liq, volume=200)

    # Creating Definition

    def slow_withdraw(
        pip: InstrumentContext, well: Well, delay_seconds: int = 1
    ) -> None:
        """Withdraw liquid slowly to avoid splashing."""
        ctx.delay(seconds=delay_seconds)
        pip.default_speed /= 10
        pip.move_to(well.top())
        pip.default_speed *= 10

    # Pre-add Dilution

    # Use Single channel

    standard_dest_sets = [
        col[:3] for col in assay_plate.columns()
    ]  # creates list of 12 lists, with 3 items each

    ctx.comment("                          ")
    ctx.comment("**************************")
    ctx.comment("  Adding Standard Diluent ")
    ctx.comment("**************************")
    ctx.comment("                          ")

    S1000.pick_up_tip()

    for i, (vol, d) in enumerate(zip(standard_dil_vols, standard_plate.rows()[0][1:])):
        S1000.aspirate(
            550 if i == 0 else 500, standard_diluent.bottom(Z_OFFSET_RESERVOIR)
        )
        S1000.dispense(300, standard_diluent.bottom(Z_OFFSET_RESERVOIR))
        S1000.aspirate(300, standard_diluent.bottom(Z_OFFSET_RESERVOIR))
        slow_withdraw(S1000, standard_diluent)
        S1000.dispense(500, d.bottom(2))
        slow_withdraw(S1000, d)
        if vol > 500:
            S1000.aspirate(500, standard_diluent.bottom(Z_OFFSET_RESERVOIR))
            slow_withdraw(S1000, standard_diluent)
            S1000.dispense(500, d.bottom(2))
        slow_withdraw(S1000, d)

    S1000.dispense(S1000.current_volume, waste)

    S1000.drop_tip() if not dry_run else S1000.return_tip()

    # Perform Dilution
    ctx.comment("                          ")
    ctx.comment("**************************")
    ctx.comment("Performing Serial Dilution")
    ctx.comment("**************************")
    ctx.comment("                          ")

    for s, d in zip(standard_plate.rows()[0][:10], standard_plate.rows()[0][1:11]):
        dil_vol = 500
        if not S1000.has_tip:
            S1000.pick_up_tip()
        S1000.aspirate(dil_vol, s.bottom(2))
        S1000.dispense(400, s.bottom(2))
        S1000.aspirate(400, s.bottom(2))
        S1000.dispense(400, s.bottom(2))
        S1000.aspirate(400, s.bottom(2))
        S1000.dispense(400, s.bottom(2))
        S1000.aspirate(400, s.bottom(2))
        S1000.dispense(400, s.bottom(2))
        S1000.aspirate(400, s.bottom(2))
        S1000.dispense(400, s.bottom(2))
        S1000.aspirate(400, s.bottom(2))
        S1000.dispense(400, s.bottom(2))
        S1000.aspirate(400, s.bottom(2))
        slow_withdraw(S1000, s)
        S1000.dispense(dil_vol, d.top(-5))
        if not dry_run:
            S1000.dispense(S1000.current_volume, waste)
            S1000.drop_tip()
        else:
            S1000.dispense(S1000.current_volume, waste)
            S1000.return_tip()
        S1000.pick_up_tip()
        S1000.aspirate(10, d.top())
        for x in range(6 if not dry_run else 1):
            S1000.aspirate(500, d.bottom(2))
            S1000.dispense(500, d.bottom(8))
            S1000.aspirate(500, d.bottom(5), rate=0.2 if x == 5 else 1)
            S1000.dispense(500, d.bottom(1), rate=0.2 if x == 5 else 1)

    S1000.drop_tip() if not dry_run else S1000.return_tip()

    # Transfer Standards to Assay Plate

    ctx.comment("                          ")
    ctx.comment("***************************")
    ctx.comment("Transferring to Assay Plate")
    ctx.comment("***************************")
    ctx.comment("                          ")

    for s, dest_set in zip(standard_plate.rows()[0], standard_dest_sets):
        S1000.pick_up_tip()
        S1000.aspirate(sample_vol, s.bottom(2))
        for d in dest_set:
            S1000.dispense(volume_s, d.bottom(1))
            slow_withdraw(S1000, d)

        S1000.dispense(S1000.current_volume, waste)

        S1000.drop_tip() if not dry_run else S1000.return_tip()

    # Dilute and Transfer Standards+Samples to Assay Plate
    if run_type == "Standards+Samples":

        ctx.comment("                          ")
        ctx.comment("******************************************")
        ctx.comment("     Transfer Samples to Assay Plate      ")
        ctx.comment("******************************************")
        ctx.comment("                          ")

        sample_start_list = [
            3,
            27,
            51,
            75,
            4,
            28,
            52,
            76,
            5,
            29,
            53,
            77,
            6,
            30,
            54,
            78,
            7,
            31,
            55,
            79,
        ]
        # all of the possible starting wells for the samples in assay plate
        s_list = []

        for i in range(num_samples):
            s_list.append(
                sample_start_list[i]
            )  # creates list of actual starting wells depending on number of samples

        for i, s in zip(s_list, samples):
            S1000.pick_up_tip()
            if dilute_samples:
                S1000.aspirate(volume_s * 2 * (dil_ratio - 1), sample_diluent.bottom(5))
                S1000.dispense(S1000.current_volume, s.top(-3))
                S1000.mix(
                    7 if not dry_run else 1, (volume_s * dil_ratio) - 10, s.bottom(1)
                )
            S1000.aspirate(sample_vol, s.bottom(1))
            slow_withdraw(S1000, s)
            S1000.dispense(volume_s, assay_plate.wells()[i].bottom(3))
            slow_withdraw(S1000, assay_plate.wells()[i])
            S1000.dispense(volume_s, assay_plate.wells()[i + 8].bottom(3))
            slow_withdraw(S1000, assay_plate.wells()[i + 8])
            S1000.dispense(volume_s, assay_plate.wells()[i + 16].bottom(3))
            slow_withdraw(S1000, assay_plate.wells()[i + 16])
            S1000.dispense(S1000.current_volume, s.top(-3))

            S1000.drop_tip() if not dry_run else S1000.return_tip()

    # Add Beads to Assay Plate

    ctx.comment("                          ")
    ctx.comment("**************************")
    ctx.comment("    Adding Coated Beads   ")
    ctx.comment("**************************")
    ctx.comment("                          ")

    wells_to_pip1 = assay_plate.rows()[0][:6]
    wells_to_pip2 = assay_plate.rows()[0][6:]
    wells_to_pip = [wells_to_pip1, wells_to_pip2]

    M1000.pick_up_tip(tips_1000.wells()[88])

    # Leading air gap to help mixing
    M1000.aspirate(40, coated_beads.top())
    # Mixing beads in reservoir
    for _ in range(3 if not dry_run else 1):
        M1000.aspirate(800, coated_beads.bottom(1))
        M1000.dispense(800, coated_beads.bottom(1))

    # Aspirate extra for multi-dispense
    M1000.aspirate(100, coated_beads.bottom(Z_OFFSET_RESERVOIR))

    # Tip Touch in Reservoir
    M1000.default_speed /= 16
    M1000.move_to(coated_beads.top().move(types.Point(x=-3.5, z=-2)))
    ctx.delay(seconds=0.5)
    M1000.move_to(coated_beads.top().move(types.Point(x=-3.5, z=4)))
    M1000.default_speed *= 16
    for scheme in wells_to_pip:
        M1000.aspirate(600, coated_beads.bottom(0.5))
        slow_withdraw(M1000, coated_beads)
        for well in scheme:
            M1000.dispense(100, well.top(-1), rate=0.25)
            ctx.delay(seconds=1)
            M1000.default_speed /= 16
            diameter: float = well.diameter if well.diameter is not None else 8.5

            M1000.move_to(well.top().move(types.Point(x=-diameter / 2 + 0.1, z=-2)))
            ctx.delay(seconds=0.5)
            M1000.move_to(well.top().move(types.Point(x=-diameter / 2 + 2, z=4)))
            M1000.default_speed *= 16

    # Clear pipette tip of residual liquid
    M1000.dispense(M1000.current_volume, coated_beads.top(-2))

    M1000.drop_tip() if not dry_run else M1000.return_tip()

    # Target Capture Incubation
    ctx.comment("                          ")
    ctx.comment("**************************")
    ctx.comment("         Incubation       ")
    ctx.comment("**************************")
    ctx.comment("                          ")

    h_s.close_labware_latch()

    h_s.set_and_wait_for_shake_speed(jitterbug_3)
    ctx.delay(
        minutes=capture_incubation * 60 if not dry_run else 0.25,
        msg=f"Please allow {capture_incubation} hour(s) for incubation at room temperature.",
    )
    ctx.pause(msg="When back, press resume to continue.")
    h_s.deactivate_shaker()
    h_s.open_labware_latch()
    ctx.pause(
        f"""The Incubation is complete- perform the post-capture wash and
        return plate to the Heater-Shaker afterwards.
        Please add Detection AB ({detection_AB}) to reservoir."""
    )
    h_s.close_labware_latch()

    # Plate must be on magnet for adding AB
    h_s.open_labware_latch()
    ctx.move_labware(assay_plate, magblock, use_gripper=True)
    h_s.close_labware_latch()

    # Detection
    ctx.comment("                          ")
    ctx.comment("**********************************")
    ctx.comment(f"Detection - Adding {detection_AB}")
    ctx.comment("**********************************")
    ctx.comment("                          ")

    M1000.pick_up_tip(tips_1000.wells()[80])

    M1000.aspirate(
        260, detection_antibody.bottom(Z_OFFSET_RESERVOIR)
    )  # aspirate whole plate worth of antibody
    M1000.dispense(210, detection_antibody.bottom(Z_OFFSET_RESERVOIR))
    M1000.aspirate(210, detection_antibody.bottom(Z_OFFSET_RESERVOIR))

    # Dispense into each column with touch tip
    for i, d in enumerate((assay_plate.rows()[0])):
        M1000.dispense(
            20, d.bottom().move(types.Point(x=-1.2 if i % 2 == 0 else 1.2, z=0.8))
        )
        ctx.delay(seconds=1)

    M1000.drop_tip() if not dry_run else M1000.return_tip()

    # Detection Incubation

    h_s.open_labware_latch()
    ctx.move_labware(assay_plate, hs_adapter, use_gripper=True)

    ctx.comment("                          ")
    ctx.comment("**************************")
    ctx.comment("         Incubation       ")
    ctx.comment("**************************")
    ctx.comment("                          ")

    ctx.pause(
        """Starting Detection incubation on Flex. Please add seal to plate.
        Heater-shaker incubation will begin afterwards."""
    )
    h_s.close_labware_latch()
    h_s.set_and_wait_for_shake_speed(jitterbug_5)
    ctx.delay(
        minutes=detection_incubation * 60 if not dry_run else 0.25,
        msg=f"Please allow {detection_incubation} hour(s)\
        for incubation at room temperature.",
    )
    ctx.pause(msg="When back, press resume to continue.")
    h_s.deactivate_shaker()
    h_s.open_labware_latch()

    ctx.pause(
        msg="""Carefully remove seal.
        Perform post-detection wash then return plate (without seal) to heater-shaker for final
        shake before final aspiration."""
    )

    h_s.close_labware_latch()
    h_s.set_and_wait_for_shake_speed(jitterbug_3)
    ctx.delay(
        minutes=1.5 if not dry_run else 0.1,
        msg=f"Shaking for 90s at {jitterbug_3} rpm.",
    )
    h_s.deactivate_shaker()
    h_s.open_labware_latch()
    ctx.pause(
        msg="""Place plate on plate washer for final aspiration,
        then return the plate to the Heater-Shaker (without seal)."""
    )
    h_s.close_labware_latch()
    h_s.open_labware_latch()
    ctx.move_labware(assay_plate, magblock, use_gripper=True)
    h_s.close_labware_latch()

    # Elution

    ctx.comment("                          ")
    ctx.comment("**************************")
    ctx.comment("    Starting Elution      ")
    ctx.comment("**************************")
    ctx.comment("                          ")

    # Setting up for elution
    elutionB_tips = tips_50.rows()[0][0:]
    elutionD_tips = tips_51.rows()[0][0:]
    samples_e = assay_plate.rows()[0][0:]
    elution_dests = elution_plate.rows()[0][::2]

    # add buffer B to assay plate
    for i, (tip, d) in enumerate(zip(elutionB_tips, samples_e)):
        M1000.pick_up_tip(tip)
        M1000.aspirate(12, buffer_b.bottom(Z_OFFSET_RESERVOIR), rate=0.25)
        ctx.delay(seconds=2)
        M1000.move_to(d.bottom(8))
        M1000.move_to(d.bottom(0.5))
        M1000.default_speed /= 50
        M1000.dispense(
            11,
            d.bottom().move(types.Point(x=-1.6 if i % 2 == 0 else 1.6, z=0.5)),
            rate=0.02,
        )
        ctx.delay(seconds=2)
        M1000.default_speed *= 50
        M1000.default_speed /= 10
        M1000.move_to(d.bottom(15))
        ctx.delay(seconds=0.5)
        M1000.default_speed *= 10

        if not dry_run:
            M1000.dispense(S1000.current_volume, waste)
            M1000.drop_tip()
        else:
            M1000.dispense(S1000.current_volume, waste)
            M1000.return_tip()

    h_s.open_labware_latch()
    ctx.move_labware(assay_plate, hs_adapter, use_gripper=True)

    ctx.pause("Please add a seal to assay plate to avoid evaporation.")
    h_s.close_labware_latch()

    h_s.set_and_wait_for_shake_speed(jitterbug_5)
    ctx.delay(
        minutes=10 if not dry_run else 0.25,
        msg="Please allow 10 minute incubation at 1000 rpm.",
    )
    h_s.deactivate_shaker()

    h_s.open_labware_latch()

    ctx.pause("Please carefully remove seal to allow pipetting.")
    h_s.close_labware_latch()

    h_s.open_labware_latch()
    ctx.move_labware(assay_plate, magblock, use_gripper=True)

    ctx.delay(
        minutes=2 if not dry_run else 0.25,
        msg="Please allow 2 minutes for beads to settle.",
    )

    ctx.comment("                          ")
    ctx.comment("**************************")
    ctx.comment("      Final Elution       ")
    ctx.comment("**************************")
    ctx.comment("                          ")

    for tip, s, d in zip(elutionD_tips, samples_e, elution_dests):
        M1000.pick_up_tip(tip)
        M1000.aspirate(11, buffer_d.bottom(Z_OFFSET_RESERVOIR), rate=0.25)
        ctx.delay(seconds=2)
        M1000.dispense(10.5, s.bottom(Z_OFFSET_ELU), rate=0.05)
        ctx.delay(seconds=0.5)
        M1000.aspirate(17, s.bottom(Z_OFFSET_ELU), rate=0.05)
        ctx.delay(seconds=0.5)
        M1000.dispense(17, s.bottom(Z_OFFSET_ELU), rate=0.05)
        ctx.delay(seconds=0.5)
        M1000.aspirate(17, s.bottom(Z_OFFSET_ELU), rate=0.05)
        ctx.delay(seconds=0.5)
        M1000.move_to(d.bottom(8))
        length: float = s.length if s.length is not None else 3.6
        M1000.dispense(
            17, d.bottom().move(types.Point(x=length / 2 - 0.9, z=5)), rate=0.02
        )
        ctx.delay(seconds=1)
        M1000.move_to(d.top().move(types.Point(x=length / 2 - 0.9, z=-2.5)))
        M1000.default_speed /= 10
        M1000.move_to(d.top().move(types.Point(x=length / 2 - 0.2, z=-2.5)))
        M1000.move_to(d.top().move(types.Point(x=length / 2 - 0.2, z=2.5)))
        M1000.default_speed *= 10
        if not dry_run:
            M1000.dispense(S1000.current_volume, waste)
            M1000.drop_tip()
        else:
            M1000.dispense(S1000.current_volume, waste)
            M1000.return_tip()
        ctx.comment(
            f"\nTransferred 10 ul of Buffer D to {s}. Mixed then transferred to elution plate."
        )

    ctx.comment("Proceed with plate reading.")
