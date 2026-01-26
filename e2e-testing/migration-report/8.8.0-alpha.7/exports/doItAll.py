import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "doItAll.json",
    "created": "2019-02-07T19:02:55.932Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:56:33.353Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_10ul",
        location="1",
        label="tiprack-10ul",
        namespace="opentrons",
        version=1,
    )
    tip_rack_2 = protocol.load_labware(
        "tipone_96_tiprack_200ul",
        location="2",
        label="tiprack-200ul",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "corning_96_wellplate_360ul_flat",
        location="3",
        label="Samples",
        namespace="opentrons",
        version=5,
    )
    reservoir_1 = protocol.load_labware(
        "usascientific_12_reservoir_22ml",
        location="4",
        label="Buffer",
        namespace="opentrons",
        version=4,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p10_single", "left")
    pipette_right = protocol.load_instrument("p300_multi", "right")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Buffer",
        display_color="#b925ff",
    )
    liquid_2 = protocol.define_liquid(
        "Sample 1",
        display_color="#ffd600",
    )
    liquid_3 = protocol.define_liquid(
        "Sample 2",
        display_color="#9dffd8",
    )
    liquid_4 = protocol.define_liquid(
        "Sample 3",
        display_color="#ff9900",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=1000,
    )
    well_plate_1.load_liquid(
        wells=["A1"],
        liquid=liquid_2,
        volume=30,
    )
    well_plate_1.load_liquid(
        wells=["B1"],
        liquid=liquid_3,
        volume=30,
    )
    well_plate_1.load_liquid(
        wells=["C1"],
        liquid=liquid_4,
        volume=30,
    )

    # PROTOCOL STEPS

    # Step 1: Transfer
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.transfer_with_liquid_class(
        volume=100,
        source=[reservoir_1["A1"]],
        dest=[reservoir_1["A12"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"p300_multi": {"opentrons/tipone_96_tiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 150)],
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
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
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
    pipette_right.drop_tip()

    # Step 2: Distribute
    pipette_right.configure_nozzle_layout(
        protocol_api.ALL,
        start="A1",
    )
    pipette_right.distribute_with_liquid_class(
        volume=30,
        source=[reservoir_1["A12"]],
        dest=[well_plate_1["A1"], well_plate_1["A2"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        group_wells=False,
        tip_racks=[tip_rack_2],
        liquid_class=protocol.define_liquid_class(
            name="distribute_step_2",
            properties={"p300_multi": {"opentrons/tipone_96_tiprack_200ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 150)],
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
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
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
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 785},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": False},
                },
                "multi_dispense": {
                    "dispense_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 300)],
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
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 785},
                    },
                    "correction_by_volume": [(0, 0)],
                    "conditioning_by_volume": [(0, 0)],
                    "disposal_by_volume": [(0, 60)],
                },
            }}},
        ),
    )
    pipette_right.drop_tip()

    # Step 3: Distribute (Fallback to Transfers)
    pipette_left.transfer_with_liquid_class(
        volume=6,
        source=[reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"], reservoir_1["A1"]],
        dest=[well_plate_1["A12"], well_plate_1["B12"], well_plate_1["C12"], well_plate_1["D12"], well_plate_1["E12"], well_plate_1["F12"], well_plate_1["G12"], well_plate_1["H12"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 5)],
                    "pre_wet": True,
                    "correction_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "mix": {"enabled": True, "repetitions": 1, "volume": 1},
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
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
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
                        "blowout": {"enabled": True, "location": "trash", "flow_rate": 31},
                    },
                    "correction_by_volume": [(0, 0)],
                    "push_out_by_volume": [(0, 0)],
                    "mix": {"enabled": True, "repetitions": 1, "volume": 1},
                },
            }}},
        ),
    )
    pipette_left.drop_tip()

    # Step 4: Consolidate
    pipette_left.consolidate_with_liquid_class(
        volume=3,
        source=[well_plate_1["A1"], well_plate_1["B1"], well_plate_1["C1"]],
        dest=[well_plate_1["A4"]],
        new_tip="once",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="consolidate_step_4",
            properties={"p10_single": {"opentrons/opentrons_96_tiprack_10ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
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
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 10)],
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

    # Step 5: Mix
    # here is how the mix will happen more specifically
    # 
    pipette_left.mix(
        repetitions=2,
        volume=9,
        location=well_plate_1["A4"].bottom(z=1),
        aspirate_flow_rate=5,
        dispense_flow_rate=10,
        final_push_out=0,
    )
    pipette_left.touch_tip(well_plate_1["A4"], v_offset=-1)
    pipette_left.flow_rate.blow_out = 31
    pipette_left.blow_out(protocol.fixed_trash)
    pipette_left.drop_tip()

    # Step 6: Pause
    protocol.delay(seconds=5)

    # Step 7: Pause
    protocol.pause("You can resume now")

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2":["opentrons/opentrons_96_tiprack_10ul/1"],"pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2":["opentrons/tipone_96_tiprack_200ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Buffer","description":null,"liquidGroupId":"0","displayColor":"#b925ff","liquidClass":null},"1":{"displayName":"Sample 1","description":null,"liquidGroupId":"1","displayColor":"#ffd600","liquidClass":null},"2":{"displayName":"Sample 2","description":null,"liquidGroupId":"2","displayColor":"#9dffd8","liquidClass":null},"3":{"displayName":"Sample 3","description":null,"liquidGroupId":"3","displayColor":"#ff9900","liquidClass":null}},"ingredLocations":{"db17bed0-2b08-11e9-9054-4913062421c2:opentrons/usascientific_12_reservoir_22ml/4":{"A1":{"0":{"volume":1000}}},"ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5":{"A1":{"1":{"volume":30}},"B1":{"2":{"volume":30}},"C1":{"3":{"volume":30}}}},"savedStepForms":{"1":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":150,"aspirate_labware":"db17bed0-2b08-11e9-9054-4913062421c2:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":785,"changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":300,"dispense_labware":"db17bed0-2b08-11e9-9054-4913062421c2:opentrons/usascientific_12_reservoir_22ml/4","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/tipone_96_tiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":100,"stepName":"Transfer","stepDetails":"","stepType":"moveLiquid","id":1,"dispense_touchTip_mmfromTop":null},"2":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":150,"aspirate_labware":"db17bed0-2b08-11e9-9054-4913062421c2:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A12"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":785,"blowout_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":300,"dispense_labware":"ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1","A2"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":60,"dropTip_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"multiDispense","pipette":"pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/tipone_96_tiprack_200ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":30,"stepName":"Distribute","stepDetails":"","stepType":"moveLiquid","id":2,"dispense_touchTip_mmfromTop":null},"3":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"db17bed0-2b08-11e9-9054-4913062421c2:opentrons/usascientific_12_reservoir_22ml/4","aspirate_mix_checkbox":true,"aspirate_mix_times":"1","aspirate_mix_volume":"1","aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":true,"dispense_mix_times":"1","dispense_mix_volume":"1","dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A12","B12","C12","D12","E12","F12","G12","H12"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":2,"dropTip_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2","preWetTip":true,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":6,"stepName":"Distribute (Fallback to Transfers)","stepDetails":"","stepType":"moveLiquid","id":3,"dispense_touchTip_mmfromTop":null},"4":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1","B1","C1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"changeTip":"once","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A4"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"multiAspirate","pipette":"pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":3,"stepName":"Consolidate","stepDetails":"","stepType":"moveLiquid","id":4,"dispense_touchTip_mmfromTop":null},"5":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"blowout_checkbox":true,"blowout_flowRate":31,"blowout_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","blowout_z_offset":0,"changeTip":"never","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dropTip_location":"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin","labware":"ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":1,"mix_touchTip_checkbox":true,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2","pushOut_checkbox":false,"pushOut_volume":0,"times":2,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":9,"wells":["A4"],"stepName":"Mix","stepDetails":"here is how the mix will happen more specifically\n","stepType":"mix","id":5},"6":{"moduleId":null,"pauseAction":"untilTime","pauseMessage":"","pauseTemperature":null,"pauseTime":"00:00:05","stepName":"Pause","stepDetails":"","id":6,"stepType":"pause"},"7":{"moduleId":null,"pauseAction":"untilResume","pauseMessage":"You can resume now","pauseTemperature":null,"pauseTime":null,"stepName":"Pause","stepDetails":"","id":7,"stepType":"pause"},"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"c588f250-2b08-11e9-9054-4913062421c2:opentrons/opentrons_96_tiprack_10ul/1":"1","c7962770-2b08-11e9-9054-4913062421c2:opentrons/tipone_96_tiprack_200ul/1":"2","ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5":"3","db17bed0-2b08-11e9-9054-4913062421c2:opentrons/usascientific_12_reservoir_22ml/4":"4"},"pipetteLocationUpdate":{"pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2":"left","pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2":"right"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"wasteChuteLocationUpdate":{},"trashBinLocationUpdate":{"8fab8b69-8884-41fb-a161-63ab8f2ed3cd:trashBin":"cutout12"},"moduleStateUpdate":{}}},"orderedStepIds":[1,2,3,4,5,6,7],"pipettes":{"pipette:p10_single_v1.3:b45b5d10-2b08-11e9-9054-4913062421c2":{"pipetteName":"p10_single"},"pipette:p300_multi_v1.3:b45b5d11-2b08-11e9-9054-4913062421c2":{"pipetteName":"p300_multi"}},"modules":{},"labware":{"c588f250-2b08-11e9-9054-4913062421c2:opentrons/opentrons_96_tiprack_10ul/1":{"displayName":"tiprack-10ul","labwareDefURI":"opentrons/opentrons_96_tiprack_10ul/1"},"c7962770-2b08-11e9-9054-4913062421c2:opentrons/tipone_96_tiprack_200ul/1":{"displayName":"tiprack-200ul","labwareDefURI":"opentrons/tipone_96_tiprack_200ul/1"},"ccad1a20-2b08-11e9-9054-4913062421c2:opentrons/corning_96_wellplate_360ul_flat/5":{"displayName":"Samples","labwareDefURI":"opentrons/corning_96_wellplate_360ul_flat/5"},"db17bed0-2b08-11e9-9054-4913062421c2:opentrons/usascientific_12_reservoir_22ml/4":{"displayName":"Buffer","labwareDefURI":"opentrons/usascientific_12_reservoir_22ml/4"}}}},"metadata":{"author":"","description":"","created":1549566175932,"category":null,"subcategory":null,"tags":[],"protocolName":"doItAll.json","lastModified":1769457393353,"source":"Protocol Designer"}}"""
