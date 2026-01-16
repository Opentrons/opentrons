import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "OT2_S_PD_851_TD_Transfer_with_mix",
    "author": "QA",
    "description": "Good description",
    "created": "2025-07-24T15:12:31.232Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-09T20:39:34.344Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "4")

    # Load Labware:
    aluminum_block_1 = temperature_module_1.load_labware(
        "opentrons_24_aluminumblock_generic_2ml_screwcap",
        namespace="opentrons",
        version=3,
    )
    tube_rack_1 = protocol.load_labware(
        "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap",
        location="2",
        namespace="opentrons",
        version=3,
    )
    tube_rack_2 = protocol.load_labware(
        "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap",
        location="5",
        namespace="opentrons",
        version=3,
    )
    tube_rack_3 = protocol.load_labware(
        "opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap",
        location="8",
        namespace="opentrons",
        version=3,
    )
    reservoir_1 = protocol.load_labware(
        "nest_12_reservoir_15ml",
        location="6",
        namespace="opentrons",
        version=3,
    )
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_filtertiprack_1000ul",
        location="9",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_96_filtertiprack_20ul",
        location="7",
        namespace="opentrons",
        version=1,
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_96_filtertiprack_20ul",
        location="1",
        label="Opentrons OT-2 96 Filter Tip Rack 20 µL (1)",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette_right = protocol.load_instrument("p1000_single_gen2", "right")
    pipette_left = protocol.load_instrument("p20_single_gen2", "left")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "BAW",
        description="BAW Extraction Solvent 60% BuOH/ 20% ACN/ 20% H2O chilled solvent",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "10 uL of the lipid ISTD",
        description="lipid internal standard mix, dissolved in chloroform",
        display_color="#ffd600",
    )
    liquid_3 = protocol.define_liquid(
        "10 uL metabolite ISTD",
        description="metabolite ISTD dissolved in 2:2:1 ACN/MeOH/H2O",
        display_color="#9dffd8",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=[
            "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
            "A9", "A10", "A11", "A12"
        ],
        liquid=liquid_1,
        volume=10000,
    )
    aluminum_block_1.load_liquid(
        wells=[
            "A1", "B1", "A2", "B2", "A3", "B3", "A4", "B4",
            "A5", "B5", "A6", "B6"
        ],
        liquid=liquid_2,
        volume=1800,
    )
    aluminum_block_1.load_liquid(
        wells=[
            "C1", "D1", "C2", "D2", "C3", "D3", "C4", "D4",
            "C5", "D5", "C6", "D6"
        ],
        liquid=liquid_3,
        volume=1800,
    )

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"], aluminum_block_1["A1"]],
        dest=[tube_rack_1["A1"], tube_rack_1["B1"], tube_rack_1["C1"], tube_rack_1["D1"], tube_rack_1["A2"], tube_rack_1["B2"], tube_rack_1["C2"], tube_rack_1["D2"], tube_rack_1["A3"], tube_rack_1["B3"], tube_rack_1["C3"], tube_rack_1["D3"], tube_rack_1["A4"], tube_rack_1["B4"], tube_rack_1["C4"], tube_rack_1["D4"], tube_rack_1["A5"], tube_rack_1["B5"], tube_rack_1["C5"], tube_rack_1["D5"], tube_rack_1["A6"], tube_rack_1["B6"], tube_rack_1["C6"], tube_rack_1["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_3, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"p20_single_gen2": {"opentrons/opentrons_96_filtertiprack_20ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 2: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"], aluminum_block_1["A2"]],
        dest=[tube_rack_2["A1"], tube_rack_2["B1"], tube_rack_2["C1"], tube_rack_2["D1"], tube_rack_2["A2"], tube_rack_2["B2"], tube_rack_2["C2"], tube_rack_2["D2"], tube_rack_2["A3"], tube_rack_2["B3"], tube_rack_2["C3"], tube_rack_2["D3"], tube_rack_2["A4"], tube_rack_2["B4"], tube_rack_2["C4"], tube_rack_2["D4"], tube_rack_2["A5"], tube_rack_2["B5"], tube_rack_2["C5"], tube_rack_2["D5"], tube_rack_2["A6"], tube_rack_2["B6"], tube_rack_2["C6"], tube_rack_2["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_3, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_2",
            properties={"p20_single_gen2": {"opentrons/opentrons_96_filtertiprack_20ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 3: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"], aluminum_block_1["A3"]],
        dest=[tube_rack_3["A1"], tube_rack_3["A2"], tube_rack_3["A3"], tube_rack_3["A4"], tube_rack_3["A5"], tube_rack_3["A6"], tube_rack_3["B1"], tube_rack_3["B2"], tube_rack_3["B3"], tube_rack_3["B4"], tube_rack_3["B5"], tube_rack_3["B6"], tube_rack_3["C1"], tube_rack_3["C2"], tube_rack_3["C3"], tube_rack_3["C4"], tube_rack_3["C5"], tube_rack_3["C6"], tube_rack_3["D1"], tube_rack_3["D2"], tube_rack_3["D3"], tube_rack_3["D4"], tube_rack_3["D5"], tube_rack_3["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_3, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"p20_single_gen2": {"opentrons/opentrons_96_filtertiprack_20ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 4: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"], aluminum_block_1["C1"]],
        dest=[tube_rack_1["A1"], tube_rack_1["A2"], tube_rack_1["A3"], tube_rack_1["A4"], tube_rack_1["A5"], tube_rack_1["A6"], tube_rack_1["B1"], tube_rack_1["B2"], tube_rack_1["B3"], tube_rack_1["B4"], tube_rack_1["B5"], tube_rack_1["B6"], tube_rack_1["C1"], tube_rack_1["C2"], tube_rack_1["C3"], tube_rack_1["C4"], tube_rack_1["C5"], tube_rack_1["C6"], tube_rack_1["D1"], tube_rack_1["D2"], tube_rack_1["D3"], tube_rack_1["D4"], tube_rack_1["D5"], tube_rack_1["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_3, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_4",
            properties={"p20_single_gen2": {"opentrons/opentrons_96_filtertiprack_20ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 5: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"], aluminum_block_1["C2"]],
        dest=[tube_rack_2["A1"], tube_rack_2["A2"], tube_rack_2["A3"], tube_rack_2["A4"], tube_rack_2["A5"], tube_rack_2["A6"], tube_rack_2["B1"], tube_rack_2["B2"], tube_rack_2["B3"], tube_rack_2["B4"], tube_rack_2["B5"], tube_rack_2["B6"], tube_rack_2["C1"], tube_rack_2["C2"], tube_rack_2["C3"], tube_rack_2["C4"], tube_rack_2["C5"], tube_rack_2["C6"], tube_rack_2["D1"], tube_rack_2["D2"], tube_rack_2["D3"], tube_rack_2["D4"], tube_rack_2["D5"], tube_rack_2["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_3, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_5",
            properties={"p20_single_gen2": {"opentrons/opentrons_96_filtertiprack_20ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 6: transfer
    pipette_left.transfer_with_liquid_class(
        volume=10,
        source=[aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"], aluminum_block_1["C3"]],
        dest=[tube_rack_3["A1"], tube_rack_3["A2"], tube_rack_3["A3"], tube_rack_3["A4"], tube_rack_3["A5"], tube_rack_3["A6"], tube_rack_3["B1"], tube_rack_3["B2"], tube_rack_3["B3"], tube_rack_3["B4"], tube_rack_3["B5"], tube_rack_3["B6"], tube_rack_3["C1"], tube_rack_3["C2"], tube_rack_3["C3"], tube_rack_3["C4"], tube_rack_3["C5"], tube_rack_3["C6"], tube_rack_3["D1"], tube_rack_3["D2"], tube_rack_3["D3"], tube_rack_3["D4"], tube_rack_3["D5"], tube_rack_3["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_3, tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_6",
            properties={"p20_single_gen2": {"opentrons/opentrons_96_filtertiprack_20ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 5)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 7: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"]],
        dest=[tube_rack_1["A1"], tube_rack_1["A2"], tube_rack_1["A3"], tube_rack_1["A4"], tube_rack_1["A5"], tube_rack_1["A6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_7",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 8: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"], reservoir_1["A2"]],
        dest=[tube_rack_1["B1"], tube_rack_1["B2"], tube_rack_1["B3"], tube_rack_1["B4"], tube_rack_1["B5"], tube_rack_1["B6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_8",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 9: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"], reservoir_1["A3"]],
        dest=[tube_rack_1["C1"], tube_rack_1["C2"], tube_rack_1["C3"], tube_rack_1["C4"], tube_rack_1["C5"], tube_rack_1["C6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_9",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 10: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"], reservoir_1["A4"]],
        dest=[tube_rack_1["D1"], tube_rack_1["D2"], tube_rack_1["D3"], tube_rack_1["D4"], tube_rack_1["D5"], tube_rack_1["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_10",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 11: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"], reservoir_1["A5"]],
        dest=[tube_rack_2["A1"], tube_rack_2["A2"], tube_rack_2["A3"], tube_rack_2["A4"], tube_rack_2["A5"], tube_rack_2["A6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_11",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 12: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"], reservoir_1["A6"]],
        dest=[tube_rack_2["B1"], tube_rack_2["B2"], tube_rack_2["B3"], tube_rack_2["B4"], tube_rack_2["B5"], tube_rack_2["B6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_12",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 13: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"], reservoir_1["A7"]],
        dest=[tube_rack_2["C1"], tube_rack_2["C2"], tube_rack_2["C3"], tube_rack_2["C4"], tube_rack_2["C5"], tube_rack_2["C6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_13",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 14: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"], reservoir_1["A8"]],
        dest=[tube_rack_2["D1"], tube_rack_2["D2"], tube_rack_2["D3"], tube_rack_2["D4"], tube_rack_2["D5"], tube_rack_2["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_14",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 15: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"], reservoir_1["A9"]],
        dest=[tube_rack_3["A1"], tube_rack_3["A2"], tube_rack_3["A3"], tube_rack_3["A4"], tube_rack_3["A5"], tube_rack_3["A6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_15",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 16: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"], reservoir_1["A10"]],
        dest=[tube_rack_3["B1"], tube_rack_3["B2"], tube_rack_3["B3"], tube_rack_3["B4"], tube_rack_3["B5"], tube_rack_3["B6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_16",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 17: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"], reservoir_1["A11"]],
        dest=[tube_rack_3["C1"], tube_rack_3["C2"], tube_rack_3["C3"], tube_rack_3["C4"], tube_rack_3["C5"], tube_rack_3["C6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_17",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 18: transfer
    pipette_right.transfer_with_liquid_class(
        volume=1000,
        source=[reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"], reservoir_1["A12"]],
        dest=[tube_rack_3["D1"], tube_rack_3["D2"], tube_rack_3["D3"], tube_rack_3["D4"], tube_rack_3["D5"], tube_rack_3["D6"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_18",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 4},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "pre_wet": False,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 10},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 500)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 125,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 0)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 125,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 4, "volume": 500},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c":["opentrons/opentrons_96_filtertiprack_1000ul/1"],"5f820aa7-79d5-41f8-8912-6c3606a3fed6":["opentrons/opentrons_96_filtertiprack_20ul/1"]},"dismissedWarnings":{"form":["TIP_POSITIONED_LOW_IN_TUBE"],"timeline":["ASPIRATE_MORE_THAN_WELL_CONTENTS"]},"ingredients":{"0":{"displayName":"BAW","description":"BAW Extraction Solvent 60% BuOH/ 20% ACN/ 20% H2O chilled solvent","displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"10 uL of the lipid ISTD","description":"lipid internal standard mix, dissolved in chloroform","displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null},"2":{"displayName":"10 uL metabolite ISTD","description":"metabolite ISTD dissolved in 2:2:1 ACN/MeOH/H2O","displayColor":"#9dffd8","liquidGroupId":"2","liquidClass":null}},"ingredLocations":{"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3":{"A1":{"0":{"volume":10000}},"A2":{"0":{"volume":10000}},"A3":{"0":{"volume":10000}},"A4":{"0":{"volume":10000}},"A5":{"0":{"volume":10000}},"A6":{"0":{"volume":10000}},"A7":{"0":{"volume":10000}},"A8":{"0":{"volume":10000}},"A9":{"0":{"volume":10000}},"A10":{"0":{"volume":10000}},"A11":{"0":{"volume":10000}},"A12":{"0":{"volume":10000}}},"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":{"A1":{"1":{"volume":1800}},"B1":{"1":{"volume":1800}},"A2":{"1":{"volume":1800}},"B2":{"1":{"volume":1800}},"A3":{"1":{"volume":1800}},"B3":{"1":{"volume":1800}},"A4":{"1":{"volume":1800}},"B4":{"1":{"volume":1800}},"A5":{"1":{"volume":1800}},"B5":{"1":{"volume":1800}},"A6":{"1":{"volume":1800}},"B6":{"1":{"volume":1800}},"C1":{"2":{"volume":1800}},"D1":{"2":{"volume":1800}},"C2":{"2":{"volume":1800}},"D2":{"2":{"volume":1800}},"C3":{"2":{"volume":1800}},"D3":{"2":{"volume":1800}},"C4":{"2":{"volume":1800}},"D4":{"2":{"volume":1800}},"C5":{"2":{"volume":1800}},"D5":{"2":{"volume":1800}},"C6":{"2":{"volume":1800}},"D6":{"2":{"volume":1800}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":"92465a1d-286c-4e96-a2c7-5c74a3a77681:temperatureModuleType","927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3":"2","4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3":"5","be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3":"8","148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3":"6","96a2df1f-36d5-41f3-807c-0cdbacd166cb:opentrons/opentrons_96_filtertiprack_1000ul/1":"9","610da0a1-c986-4aa2-b492-9ee47c276e26:opentrons/opentrons_96_filtertiprack_20ul/1":"7","02da24f3-dcea-4105-b36c-7ac77391ac35:opentrons/opentrons_96_filtertiprack_20ul/1":"1"},"moduleLocationUpdate":{"92465a1d-286c-4e96-a2c7-5c74a3a77681:temperatureModuleType":"4"},"pipetteLocationUpdate":{"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c":"right","5f820aa7-79d5-41f8-8912-6c3606a3fed6":"left"},"trashBinLocationUpdate":{"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin":"cutout12"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__"},"5b1ef508-a49f-4868-9e65-21349bca69d9":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":3.78,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","B1","C1","D1","A2","B2","C2","D2","A3","B3","C3","D3","A4","B4","C4","D4","A5","B5","C5","D5","A6","B6","C6","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"5f820aa7-79d5-41f8-8912-6c3606a3fed6","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_20ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"5b1ef508-a49f-4868-9e65-21349bca69d9","dispense_touchTip_mmfromTop":null},"8d6f349c-2550-4f4f-a59d-07853a9d3e72":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["C2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":3.78,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"l2r","dispense_wellOrder_second":"t2b","dispense_wells":["A1","B1","C1","D1","A2","B2","C2","D2","A3","B3","C3","D3","A4","B4","C4","D4","A5","B5","C5","D5","A6","B6","C6","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"5f820aa7-79d5-41f8-8912-6c3606a3fed6","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_20ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"8d6f349c-2550-4f4f-a59d-07853a9d3e72","dispense_touchTip_mmfromTop":null},"7a8e8175-052c-407e-a5cc-dce403c76563":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["C3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":3.78,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"l2r","dispense_wellOrder_second":"t2b","dispense_wells":["A1","B1","C1","D1","A2","B2","C2","D2","A3","B3","C3","D3","A4","B4","C4","D4","A5","B5","C5","D5","A6","B6","C6","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"5f820aa7-79d5-41f8-8912-6c3606a3fed6","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_20ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"7a8e8175-052c-407e-a5cc-dce403c76563","dispense_touchTip_mmfromTop":null},"5ce5c782-4f94-4a8f-9aec-55496cb776a3":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":3.78,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","B1","C1","D1","A2","B2","C2","D2","A3","B3","C3","D3","A4","B4","C4","D4","A5","B5","C5","D5","A6","B6","C6","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"5f820aa7-79d5-41f8-8912-6c3606a3fed6","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_20ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"5ce5c782-4f94-4a8f-9aec-55496cb776a3","dispense_touchTip_mmfromTop":null},"77f1f036-4499-4e16-bd4a-47e5e5d7ac69":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":3.78,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"l2r","dispense_wellOrder_second":"t2b","dispense_wells":["A1","B1","C1","D1","A2","B2","C2","D2","A3","B3","C3","D3","A4","B4","C4","D4","A5","B5","C5","D5","A6","B6","C6","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"5f820aa7-79d5-41f8-8912-6c3606a3fed6","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_20ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"77f1f036-4499-4e16-bd4a-47e5e5d7ac69","dispense_touchTip_mmfromTop":null},"f6c23aa7-34d0-4f2a-b073-71f4a7bc2ab7":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["C1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":3.78,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":5,"dispense_labware":"927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"l2r","dispense_wellOrder_second":"t2b","dispense_wells":["A1","B1","C1","D1","A2","B2","C2","D2","A3","B3","C3","D3","A4","B4","C4","D4","A5","B5","C5","D5","A6","B6","C6","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"5f820aa7-79d5-41f8-8912-6c3606a3fed6","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_20ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"f6c23aa7-34d0-4f2a-b073-71f4a7bc2ab7","dispense_touchTip_mmfromTop":null},"48fcee9c-1576-47e2-8698-8a4327d6e405":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"48fcee9c-1576-47e2-8698-8a4327d6e405","dispense_touchTip_mmfromTop":null},"9c7cd9d2-9652-4a82-8d92-7d426a6502aa":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B1","B2","B3","B4","B5","B6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"9c7cd9d2-9652-4a82-8d92-7d426a6502aa","dispense_touchTip_mmfromTop":null},"21b84669-f89e-4cb0-8aa5-43b3c173a007":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A3"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C1","C2","C3","C4","C5","C6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"21b84669-f89e-4cb0-8aa5-43b3c173a007","dispense_touchTip_mmfromTop":null},"ad030346-c910-4af5-8c60-205ba7d2e01c":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A4"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["D1","D2","D3","D4","D5","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"ad030346-c910-4af5-8c60-205ba7d2e01c","dispense_touchTip_mmfromTop":null},"eb2fc4a5-be17-462f-a145-652cfcc31423":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A5"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"eb2fc4a5-be17-462f-a145-652cfcc31423","dispense_touchTip_mmfromTop":null},"27da0155-2276-4fb4-9599-a3c142c7f55a":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A10"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B1","B2","B3","B4","B5","B6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"27da0155-2276-4fb4-9599-a3c142c7f55a","dispense_touchTip_mmfromTop":null},"07fe2861-e433-4a67-a4b2-16e6bf2aa40c":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C1","C2","C3","C4","C5","C6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"07fe2861-e433-4a67-a4b2-16e6bf2aa40c","dispense_touchTip_mmfromTop":null},"fd959f08-61b7-479d-95f8-716f7ed9a461":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["D1","D2","D3","D4","D5","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"fd959f08-61b7-479d-95f8-716f7ed9a461","dispense_touchTip_mmfromTop":null},"22d2df31-fd3a-4cd1-a7b9-744537b2ee1c":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A6"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B1","B2","B3","B4","B5","B6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"22d2df31-fd3a-4cd1-a7b9-744537b2ee1c","dispense_touchTip_mmfromTop":null},"f5356ab2-af51-4e64-8b23-39c3bbd4c014":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["C1","C2","C3","C4","C5","C6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"f5356ab2-af51-4e64-8b23-39c3bbd4c014","dispense_touchTip_mmfromTop":null},"a72ba01a-42ff-490e-a701-5b53531e7e52":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A8"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["D1","D2","D3","D4","D5","D6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"a72ba01a-42ff-490e-a701-5b53531e7e52","dispense_touchTip_mmfromTop":null},"aa2265aa-57c5-4576-8ee3-95f4122e50eb":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":500,"aspirate_labware":"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":4,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"l2r","aspirate_wellOrder_second":"t2b","aspirate_wells_grouped":false,"aspirate_wells":["A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":500,"dispense_labware":"be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3","dispense_mix_checkbox":true,"dispense_mix_times":"4","dispense_mix_volume":"500","dispense_mmFromBottom":10,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2","A3","A4","A5","A6"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"a48affa5-7244-4c29-9658-ffa124e3be71:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"1000","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"aa2265aa-57c5-4576-8ee3-95f4122e50eb","dispense_touchTip_mmfromTop":null}},"orderedStepIds":["5b1ef508-a49f-4868-9e65-21349bca69d9","5ce5c782-4f94-4a8f-9aec-55496cb776a3","77f1f036-4499-4e16-bd4a-47e5e5d7ac69","f6c23aa7-34d0-4f2a-b073-71f4a7bc2ab7","8d6f349c-2550-4f4f-a59d-07853a9d3e72","7a8e8175-052c-407e-a5cc-dce403c76563","48fcee9c-1576-47e2-8698-8a4327d6e405","9c7cd9d2-9652-4a82-8d92-7d426a6502aa","21b84669-f89e-4cb0-8aa5-43b3c173a007","ad030346-c910-4af5-8c60-205ba7d2e01c","eb2fc4a5-be17-462f-a145-652cfcc31423","22d2df31-fd3a-4cd1-a7b9-744537b2ee1c","f5356ab2-af51-4e64-8b23-39c3bbd4c014","a72ba01a-42ff-490e-a701-5b53531e7e52","aa2265aa-57c5-4576-8ee3-95f4122e50eb","27da0155-2276-4fb4-9599-a3c142c7f55a","07fe2861-e433-4a67-a4b2-16e6bf2aa40c","fd959f08-61b7-479d-95f8-716f7ed9a461"],"pipettes":{"4fd01e4a-a91d-483f-9d5f-d3f92fa7131c":{"pipetteName":"p1000_single_gen2"},"5f820aa7-79d5-41f8-8912-6c3606a3fed6":{"pipetteName":"p20_single_gen2"}},"modules":{"92465a1d-286c-4e96-a2c7-5c74a3a77681:temperatureModuleType":{"model":"temperatureModuleV2"}},"labware":{"07e16dd8-45d3-49b0-8f04-9ef3ce6e0e38:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3":{"displayName":"Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap","labwareDefURI":"opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/3"},"927879e4-bf98-4e6d-815a-909c2a6aae32:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3":{"displayName":"Opentrons 24 Tube Rack with Eppendorf 2 mL Safe-Lock Snapcap","labwareDefURI":"opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3"},"4295497a-132a-4b67-85d4-5494989c0f49:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3":{"displayName":"Opentrons 24 Tube Rack with Eppendorf 2 mL Safe-Lock Snapcap","labwareDefURI":"opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3"},"be3b8bc6-300d-42c8-9b4e-63444425a1ec:opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3":{"displayName":"Opentrons 24 Tube Rack with Eppendorf 2 mL Safe-Lock Snapcap","labwareDefURI":"opentrons/opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap/3"},"148e2f7a-fb29-4d9e-b7ca-8205af432178:opentrons/nest_12_reservoir_15ml/3":{"displayName":"NEST 12 Well Reservoir 15 mL","labwareDefURI":"opentrons/nest_12_reservoir_15ml/3"},"96a2df1f-36d5-41f3-807c-0cdbacd166cb:opentrons/opentrons_96_filtertiprack_1000ul/1":{"displayName":"Opentrons OT-2 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_96_filtertiprack_1000ul/1"},"610da0a1-c986-4aa2-b492-9ee47c276e26:opentrons/opentrons_96_filtertiprack_20ul/1":{"displayName":"Opentrons OT-2 96 Filter Tip Rack 20 µL","labwareDefURI":"opentrons/opentrons_96_filtertiprack_20ul/1"},"02da24f3-dcea-4105-b36c-7ac77391ac35:opentrons/opentrons_96_filtertiprack_20ul/1":{"displayName":"Opentrons OT-2 96 Filter Tip Rack 20 µL (1)","labwareDefURI":"opentrons/opentrons_96_filtertiprack_20ul/1"}}}},"metadata":{"protocolName":"OT2_S_PD_851_TD_Transfer_with_mix","author":"QA","description":"Good description","created":1753369951232,"lastModified":1767991174344,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
