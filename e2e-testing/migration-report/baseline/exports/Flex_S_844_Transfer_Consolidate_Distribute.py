import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Flex_S_844_Transfer_Consolidate_Distribute",
    "created": "2026-01-08T15:36:00.415Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:57:28.568Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_1000ul",
        location="C2",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_200ul",
        location="B2",
        namespace="opentrons",
        version=1,
    )
    tip_rack_3 = protocol.load_labware(
        "opentrons_flex_96_filtertiprack_50ul",
        location="A2",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "nest_96_wellplate_2ml_deep",
        location="A1",
        label="NEST 96 Deep Well Plate 2mL",
        namespace="opentrons",
        version=5,
    )
    well_plate_2 = protocol.load_labware(
        "usascientific_96_wellplate_2.4ml_deep",
        location="B3",
        namespace="opentrons",
        version=4,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("flex_1channel_1000", "left")
    pipette_right = protocol.load_instrument("flex_8channel_1000", "right")

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Liquid One Purple ",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Liquid Two Yellow",
        display_color="#ffd600",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=[
            "A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1",
            "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2",
            "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3",
            "A4", "B4", "C4", "D4", "E4", "F4", "G4", "H4",
            "A5", "B5", "C5", "D5", "E5", "F5", "G5", "H5",
            "A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6",
            "A7", "B7", "C7", "D7", "E7", "F7", "G7", "H7",
            "A8", "B8", "C8", "D8", "E8", "F8", "G8", "H8",
            "A9", "B9", "C9", "D9", "E9", "F9", "G9", "H9"
        ],
        liquid=liquid_1,
        volume=1700,
    )
    well_plate_1.load_liquid(
        wells=[
            "A10", "B10", "C10", "D10", "E10", "F10", "G10", "H10",
            "A11", "B11", "C11", "D11", "E11", "F11", "G11", "H11",
            "A12", "B12", "C12", "D12", "E12", "F12", "G12", "H12"
        ],
        liquid=liquid_2,
        volume=1400,
    )

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_left.transfer_with_liquid_class(
        volume=12,
        source=[well_plate_1["A1"], well_plate_1["A11"]],
        dest=[well_plate_2["A10"], well_plate_2["A11"]],
        new_tip="always",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": True,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 1},
                    "mix": {"enabled": True, "repetitions": 3, "volume": 14},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 300,
                        },
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
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
                        "speed": 100,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 300,
                        },
                        "blowout": {"enabled": True, "location": "source", "flow_rate": 716},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": True, "repetitions": 1, "volume": 20},
                },
            }}},
        ),
    )

    # Step 2: transfer
    pipette_left.distribute_with_liquid_class(
        volume=17,
        source=[well_plate_1["A2"]],
        dest=[well_plate_2["B10"], well_plate_2["C10"], well_plate_2["B11"], well_plate_2["B12"]],
        new_tip="never",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="distribute_step_2",
            properties={"flex_1channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": True,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 1},
                    "mix": {"enabled": True, "repetitions": 3, "volume": 14},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 10)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 300,
                        },
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
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
                        "speed": 100,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 300,
                        },
                        "blowout": {"enabled": True, "location": "source", "flow_rate": 716},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
                "multi_dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
                    "delay": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
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
                        "speed": 100,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 300,
                        },
                        "blowout": {"enabled": True, "location": "source", "flow_rate": 716},
                    },
                    "correction_by_volume": [(0, 0)],
                    "conditioning_by_volume": [(0, 0)],
                    "disposal_by_volume": [(0, 5)],
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 3: transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.consolidate_with_liquid_class(
        volume=17,
        source=[well_plate_1["A8"], well_plate_1["A9"]],
        dest=[well_plate_2["A4"]],
        new_tip="always",
        trash_location=trash_bin_1,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_3",
            properties={"flex_8channel_1000": {"opentrons/opentrons_flex_96_filtertiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "pre_wet": True,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": True, "duration": 1},
                    "mix": {"enabled": False},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
                        "start_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                    },
                    "retract": {
                        "air_gap_by_volume": [(0, 11)],
                        "delay": {"enabled": False},
                        "end_position": {
                            "offset": {"x": 0, "y": 0, "z": 2},
                            "position_reference": "well-top",
                        },
                        "speed": 100,
                        "touch_tip": {
                            "enabled": True,
                            "z_offset": -1,
                            "mm_from_edge": 0,
                            "speed": 300,
                        },
                    },
                },
                "dispense": {
                    "dispense_position": {
                        "offset": {"x": 1, "y": 1, "z": 2},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 716)],
                    "delay": {"enabled": True, "duration": 1},
                    "submerge": {
                        "delay": {"enabled": False},
                        "speed": 100,
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
                        "speed": 100,
                        "touch_tip": {"enabled": False},
                        "blowout": {"enabled": False},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 20)],
                    "mix": {"enabled": False},
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"753ac59a-5875-4470-90ab-b85921d4d67b":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"],"69ed50ae-0dbb-46b2-a181-36bdfe9595dd":["opentrons/opentrons_flex_96_filtertiprack_1000ul/1","opentrons/opentrons_flex_96_filtertiprack_200ul/1","opentrons/opentrons_flex_96_filtertiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":["ASPIRATE_MORE_THAN_WELL_CONTENTS"]},"ingredients":{"0":{"displayName":"Liquid One Purple ","description":null,"displayColor":"#b925ff","liquidGroupId":"0","liquidClass":null},"1":{"displayName":"Liquid Two Yellow","description":null,"displayColor":"#ffd600","liquidGroupId":"1","liquidClass":null}},"ingredLocations":{"5598dd1a-60e6-4d20-babb-89a77519d2c0:opentrons/nest_96_wellplate_2ml_deep/5":{"A1":{"0":{"volume":1700}},"B1":{"0":{"volume":1700}},"C1":{"0":{"volume":1700}},"D1":{"0":{"volume":1700}},"E1":{"0":{"volume":1700}},"F1":{"0":{"volume":1700}},"G1":{"0":{"volume":1700}},"H1":{"0":{"volume":1700}},"A2":{"0":{"volume":1700}},"B2":{"0":{"volume":1700}},"C2":{"0":{"volume":1700}},"D2":{"0":{"volume":1700}},"E2":{"0":{"volume":1700}},"F2":{"0":{"volume":1700}},"G2":{"0":{"volume":1700}},"H2":{"0":{"volume":1700}},"A3":{"0":{"volume":1700}},"B3":{"0":{"volume":1700}},"C3":{"0":{"volume":1700}},"D3":{"0":{"volume":1700}},"E3":{"0":{"volume":1700}},"F3":{"0":{"volume":1700}},"G3":{"0":{"volume":1700}},"H3":{"0":{"volume":1700}},"A4":{"0":{"volume":1700}},"B4":{"0":{"volume":1700}},"C4":{"0":{"volume":1700}},"D4":{"0":{"volume":1700}},"E4":{"0":{"volume":1700}},"F4":{"0":{"volume":1700}},"G4":{"0":{"volume":1700}},"H4":{"0":{"volume":1700}},"A5":{"0":{"volume":1700}},"B5":{"0":{"volume":1700}},"C5":{"0":{"volume":1700}},"D5":{"0":{"volume":1700}},"E5":{"0":{"volume":1700}},"F5":{"0":{"volume":1700}},"G5":{"0":{"volume":1700}},"H5":{"0":{"volume":1700}},"A6":{"0":{"volume":1700}},"B6":{"0":{"volume":1700}},"C6":{"0":{"volume":1700}},"D6":{"0":{"volume":1700}},"E6":{"0":{"volume":1700}},"F6":{"0":{"volume":1700}},"G6":{"0":{"volume":1700}},"H6":{"0":{"volume":1700}},"A7":{"0":{"volume":1700}},"B7":{"0":{"volume":1700}},"C7":{"0":{"volume":1700}},"D7":{"0":{"volume":1700}},"E7":{"0":{"volume":1700}},"F7":{"0":{"volume":1700}},"G7":{"0":{"volume":1700}},"H7":{"0":{"volume":1700}},"A8":{"0":{"volume":1700}},"B8":{"0":{"volume":1700}},"C8":{"0":{"volume":1700}},"D8":{"0":{"volume":1700}},"E8":{"0":{"volume":1700}},"F8":{"0":{"volume":1700}},"G8":{"0":{"volume":1700}},"H8":{"0":{"volume":1700}},"A9":{"0":{"volume":1700}},"B9":{"0":{"volume":1700}},"C9":{"0":{"volume":1700}},"D9":{"0":{"volume":1700}},"E9":{"0":{"volume":1700}},"F9":{"0":{"volume":1700}},"G9":{"0":{"volume":1700}},"H9":{"0":{"volume":1700}},"A10":{"1":{"volume":1400}},"B10":{"1":{"volume":1400}},"C10":{"1":{"volume":1400}},"D10":{"1":{"volume":1400}},"E10":{"1":{"volume":1400}},"F10":{"1":{"volume":1400}},"G10":{"1":{"volume":1400}},"H10":{"1":{"volume":1400}},"A11":{"1":{"volume":1400}},"B11":{"1":{"volume":1400}},"C11":{"1":{"volume":1400}},"D11":{"1":{"volume":1400}},"E11":{"1":{"volume":1400}},"F11":{"1":{"volume":1400}},"G11":{"1":{"volume":1400}},"H11":{"1":{"volume":1400}},"A12":{"1":{"volume":1400}},"B12":{"1":{"volume":1400}},"C12":{"1":{"volume":1400}},"D12":{"1":{"volume":1400}},"E12":{"1":{"volume":1400}},"F12":{"1":{"volume":1400}},"G12":{"1":{"volume":1400}},"H12":{"1":{"volume":1400}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"046d4bb0-8aab-4388-9019-c16924067b37:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":"C2","1b8c8f76-cf74-470c-a6d5-7cd0a4297c08:opentrons/opentrons_flex_96_filtertiprack_200ul/1":"B2","d9542d51-0aef-4610-8264-e61668bee4dd:opentrons/opentrons_flex_96_filtertiprack_50ul/1":"A2","5598dd1a-60e6-4d20-babb-89a77519d2c0:opentrons/nest_96_wellplate_2ml_deep/5":"A1","6c0facbe-ab70-469c-a4ff-782340a78978:opentrons/usascientific_96_wellplate_2.4ml_deep/4":"B3"},"pipetteLocationUpdate":{"753ac59a-5875-4470-90ab-b85921d4d67b":"left","69ed50ae-0dbb-46b2-a181-36bdfe9595dd":"right"},"moduleLocationUpdate":{},"trashBinLocationUpdate":{"b0b2579c-414f-4adc-9450-ab8a073e243d:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"moduleStateUpdate":{}},"9c265253-b3a2-471e-acd8-4acbbc7d66ec":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"1","aspirate_flowRate":716,"aspirate_labware":"5598dd1a-60e6-4d20-babb-89a77519d2c0:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"14","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":true,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A11"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":716,"blowout_location":"source_well","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"6c0facbe-ab70-469c-a4ff-782340a78978:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":true,"dispense_mix_times":"1","dispense_mix_volume":"20","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A10","A11"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"b0b2579c-414f-4adc-9450-ab8a073e243d:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"753ac59a-5875-4470-90ab-b85921d4d67b","preWetTip":true,"pushOut_checkbox":true,"pushOut_volume":20,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"12","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"9c265253-b3a2-471e-acd8-4acbbc7d66ec","dispense_touchTip_mmfromTop":null},"895cdc35-0f80-41c5-b9b0-062410abf37e":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"10","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"1","aspirate_flowRate":716,"aspirate_labware":"5598dd1a-60e6-4d20-babb-89a77519d2c0:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":true,"aspirate_mix_times":"3","aspirate_mix_volume":"14","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":true,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A2"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":716,"blowout_location":"source_well","changeTip":"never","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":true,"dispense_airGap_volume":"5","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"6c0facbe-ab70-469c-a4ff-782340a78978:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":true,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["B10","C10","B11","B12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"5","dropTip_location":"b0b2579c-414f-4adc-9450-ab8a073e243d:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"multiDispense","pipette":"753ac59a-5875-4470-90ab-b85921d4d67b","preWetTip":true,"pushOut_checkbox":true,"pushOut_volume":20,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"17","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"895cdc35-0f80-41c5-b9b0-062410abf37e","dispense_touchTip_mmfromTop":null},"f5e02c67-87f4-4187-9080-9c5d938e5027":{"aspirate_airGap_checkbox":true,"aspirate_airGap_volume":"11","aspirate_delay_checkbox":true,"aspirate_delay_seconds":"1","aspirate_flowRate":716,"aspirate_labware":"5598dd1a-60e6-4d20-babb-89a77519d2c0:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":true,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A8","A9"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":716,"blowout_location":"b0b2579c-414f-4adc-9450-ab8a073e243d:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":true,"dispense_delay_seconds":"1","dispense_flowRate":716,"dispense_labware":"6c0facbe-ab70-469c-a4ff-782340a78978:opentrons/usascientific_96_wellplate_2.4ml_deep/4","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":2,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":1,"dispense_y_position":1,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"b0b2579c-414f-4adc-9450-ab8a073e243d:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"multiAspirate","pipette":"69ed50ae-0dbb-46b2-a181-36bdfe9595dd","preWetTip":true,"pushOut_checkbox":true,"pushOut_volume":20,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"17","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"f5e02c67-87f4-4187-9080-9c5d938e5027","dispense_touchTip_mmfromTop":null},"11cabd74-0729-456f-a6cf-a501cb7cfdfd":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":716,"aspirate_labware":"5598dd1a-60e6-4d20-babb-89a77519d2c0:opentrons/nest_96_wellplate_2ml_deep/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":100,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":100,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":300,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11","A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":716,"blowout_location":"b0b2579c-414f-4adc-9450-ab8a073e243d:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":716,"dispense_labware":"b0b2579c-414f-4adc-9450-ab8a073e243d:undefined","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":100,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":100,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":300,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":[],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":null,"dropTip_location":"b0b2579c-414f-4adc-9450-ab8a073e243d:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"69ed50ae-0dbb-46b2-a181-36bdfe9595dd","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":5,"tipRack":"opentrons/opentrons_flex_96_filtertiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"11cabd74-0729-456f-a6cf-a501cb7cfdfd","dispense_touchTip_mmfromTop":null}},"orderedStepIds":["9c265253-b3a2-471e-acd8-4acbbc7d66ec","895cdc35-0f80-41c5-b9b0-062410abf37e","f5e02c67-87f4-4187-9080-9c5d938e5027","11cabd74-0729-456f-a6cf-a501cb7cfdfd"],"pipettes":{"753ac59a-5875-4470-90ab-b85921d4d67b":{"pipetteName":"p1000_single_flex"},"69ed50ae-0dbb-46b2-a181-36bdfe9595dd":{"pipetteName":"p1000_multi_flex"}},"modules":{},"labware":{"046d4bb0-8aab-4388-9019-c16924067b37:opentrons/opentrons_flex_96_filtertiprack_1000ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_1000ul/1"},"1b8c8f76-cf74-470c-a6d5-7cd0a4297c08:opentrons/opentrons_flex_96_filtertiprack_200ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 200 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_200ul/1"},"d9542d51-0aef-4610-8264-e61668bee4dd:opentrons/opentrons_flex_96_filtertiprack_50ul/1":{"displayName":"Opentrons Flex 96 Filter Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_filtertiprack_50ul/1"},"5598dd1a-60e6-4d20-babb-89a77519d2c0:opentrons/nest_96_wellplate_2ml_deep/5":{"displayName":"NEST 96 Deep Well Plate 2mL","labwareDefURI":"opentrons/nest_96_wellplate_2ml_deep/5"},"6c0facbe-ab70-469c-a4ff-782340a78978:opentrons/usascientific_96_wellplate_2.4ml_deep/4":{"displayName":"USA Scientific 96 Deep Well Plate 2.4 mL","labwareDefURI":"opentrons/usascientific_96_wellplate_2.4ml_deep/4"}}}},"metadata":{"protocolName":"Flex_S_844_Transfer_Consolidate_Distribute","author":"","description":"","created":1767886560415,"lastModified":1769457448568,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer"}}"""
