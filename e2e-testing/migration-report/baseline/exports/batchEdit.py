import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Multi select banner test protocol",
    "created": "2020-12-01T20:17:31.893Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T19:56:42.801Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Modules:
    magnetic_module_1 = protocol.load_module("magneticModuleV2", "1")
    temperature_module_1 = protocol.load_module("temperatureModuleV2", "3")
    thermocycler_module_1 = protocol.load_module("thermocyclerModuleV1", "7")

    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_1000ul",
        location="2",
        label="Opentrons 96 Tip Rack 1000 µL",
        namespace="opentrons",
        version=1,
    )
    reservoir_1 = protocol.load_labware(
        "nest_1_reservoir_195ml",
        location="4",
        namespace="opentrons",
        version=4,
    )
    well_plate_1 = protocol.load_labware(
        "corning_24_wellplate_3.4ml_flat",
        location="5",
        namespace="opentrons",
        version=5,
    )
    well_plate_2 = magnetic_module_1.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        namespace="opentrons",
        version=5,
    )
    aluminum_block_1 = temperature_module_1.load_labware(
        "opentrons_96_aluminumblock_generic_pcr_strip_200ul",
        namespace="opentrons",
        version=4,
    )
    well_plate_3 = thermocycler_module_1.load_labware(
        "nest_96_wellplate_100ul_pcr_full_skirt",
        label="NEST 96 Well Plate 100 µL PCR Full Skirt (1)",
        namespace="opentrons",
        version=5,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p1000_single_gen2", "left")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "Water",
        display_color="#b925ff",
    )

    # Load Liquids:
    reservoir_1.load_liquid(
        wells=["A1"],
        liquid=liquid_1,
        volume=1000,
    )

    # PROTOCOL STEPS

    # Step 1: transfer
    pipette_left.transfer_with_liquid_class(
        volume=100,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_tiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 274.7)],
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
                        "offset": {"x": 0, "y": 0, "z": 0.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 274.7)],
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
        volume=100,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_2",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_tiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 274.7)],
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
                        "offset": {"x": 0, "y": 0, "z": 0.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 274.7)],
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
        volume=100,
        source=[reservoir_1["A1"]],
        dest=[well_plate_1["A1"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_3",
            properties={"p1000_single_gen2": {"opentrons/opentrons_96_tiprack_1000ul/1": {
                "aspirate": {
                    "aspirate_position": {
                        "offset": {"x": 0, "y": 0, "z": 1},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 274.7)],
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
                        "offset": {"x": 0, "y": 0, "z": 0.5},
                        "position_reference": "well-bottom",
                    },
                    "flow_rate_by_volume": [(0, 274.7)],
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

    # Step 4: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=1,
        volume=100,
        location=well_plate_1["A1"].bottom(z=0.5),
        aspirate_flow_rate=274.7,
        dispense_flow_rate=274.7,
        final_push_out=0,
    )
    pipette_left.drop_tip()

    # Step 5: mix
    pipette_left.pick_up_tip(location=tip_rack_1)
    pipette_left.mix(
        repetitions=1,
        volume=100,
        location=well_plate_1["A1"].bottom(z=0.5),
        aspirate_flow_rate=274.7,
        dispense_flow_rate=274.7,
        final_push_out=0,
    )
    pipette_left.drop_tip()

    # Step 6: pause
    protocol.pause()

    # Step 7: magnet
    magnetic_module_1.engage(height_from_base=6)

    # Step 8: temperature
    temperature_module_1.deactivate()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"3dff4f90-3412-11eb-ad93-ed232a2337cf":["opentrons/opentrons_96_tiprack_1000ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"Water","description":null,"liquidGroupId":"0","displayColor":"#b925ff","liquidClass":null}},"ingredLocations":{"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4":{"A1":{"0":{"volume":1000}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1":"2","5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4":"4","60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5":"5","aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType","ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/4":"3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType","b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":"3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType"},"pipetteLocationUpdate":{"3dff4f90-3412-11eb-ad93-ed232a2337cf":"left"},"moduleLocationUpdate":{"3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType":"1","3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType":"3","3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType":"7"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"wasteChuteLocationUpdate":{},"trashBinLocationUpdate":{"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin":"cutout12"},"moduleStateUpdate":{}},"7d8f2180-3412-11eb-ad93-ed232a2337cf":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"100","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"aspirate_labware":"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":"1","aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"100","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dispense_labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":"0.5","dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"100","dropTip_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"7d8f2180-3412-11eb-ad93-ed232a2337cf","dispense_touchTip_mmfromTop":null},"80414930-3412-11eb-ad93-ed232a2337cf":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"100","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"aspirate_labware":"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":"1","aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"100","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dispense_labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":"0.5","dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"100","dropTip_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"80414930-3412-11eb-ad93-ed232a2337cf","dispense_touchTip_mmfromTop":null},"81bc9e90-3412-11eb-ad93-ed232a2337cf":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"100","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"aspirate_labware":"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":"1","aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"100","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dispense_labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":"0.5","dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A1"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"100","dropTip_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","id":"81bc9e90-3412-11eb-ad93-ed232a2337cf","dispense_touchTip_mmfromTop":null},"8ab9a510-3412-11eb-ad93-ed232a2337cf":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dropTip_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":"0.5","mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","pushOut_checkbox":false,"pushOut_volume":0,"times":"1","tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"8ab9a510-3412-11eb-ad93-ed232a2337cf"},"8d7df530-3412-11eb-ad93-ed232a2337cf":{"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":274.7,"blowout_checkbox":false,"blowout_flowRate":274.7,"blowout_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","blowout_z_offset":0,"changeTip":"always","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":274.7,"dropTip_location":"4d634a4d-cbb2-4dd0-a97f-83ba651f1782:trashBin","labware":"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5","liquidClassesSupported":false,"liquidClass":"none","mix_mmFromBottom":"0.5","mix_touchTip_checkbox":false,"mix_touchTip_mmFromTop":null,"mix_wellOrder_first":"t2b","mix_wellOrder_second":"l2r","mix_position_reference":"well-bottom","mix_x_position":0,"mix_y_position":0,"nozzles":"SINGLE","pipette":"3dff4f90-3412-11eb-ad93-ed232a2337cf","pushOut_checkbox":false,"pushOut_volume":0,"times":"1","tipRack":"opentrons/opentrons_96_tiprack_1000ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"100","wells":["A1"],"stepType":"mix","stepName":"mix","stepDetails":"","id":"8d7df530-3412-11eb-ad93-ed232a2337cf"},"9447a0f0-3412-11eb-ad93-ed232a2337cf":{"moduleId":"3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType","pauseAction":"untilResume","pauseMessage":"","pauseTemperature":null,"pauseTime":null,"id":"9447a0f0-3412-11eb-ad93-ed232a2337cf","stepType":"pause","stepName":"pause","stepDetails":""},"3714dff0-3413-11eb-ad93-ed232a2337cf":{"engageHeight":"6","magnetAction":"engage","moduleId":"3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType","id":"3714dff0-3413-11eb-ad93-ed232a2337cf","stepType":"magnet","stepName":"magnet","stepDetails":""},"3bf188c0-3413-11eb-ad93-ed232a2337cf":{"moduleId":"3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType","setTemperature":"false","targetTemperature":null,"id":"3bf188c0-3413-11eb-ad93-ed232a2337cf","stepType":"temperature","stepName":"temperature","stepDetails":""},"40252050-3413-11eb-ad93-ed232a2337cf":{"blockIsActive":false,"blockIsActiveHold":false,"blockTargetTemp":null,"blockTargetTempHold":null,"lidIsActive":false,"lidIsActiveHold":false,"lidOpen":null,"lidOpenHold":null,"lidTargetTemp":null,"lidTargetTempHold":null,"moduleId":"3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType","orderedProfileItems":[],"profileItemsById":{},"profileTargetLidTemp":null,"profileVolume":null,"thermocyclerFormType":null,"id":"40252050-3413-11eb-ad93-ed232a2337cf","stepType":"thermocycler","stepName":"thermocycler","stepDetails":""}},"orderedStepIds":["7d8f2180-3412-11eb-ad93-ed232a2337cf","80414930-3412-11eb-ad93-ed232a2337cf","81bc9e90-3412-11eb-ad93-ed232a2337cf","8ab9a510-3412-11eb-ad93-ed232a2337cf","8d7df530-3412-11eb-ad93-ed232a2337cf","9447a0f0-3412-11eb-ad93-ed232a2337cf","3714dff0-3413-11eb-ad93-ed232a2337cf","3bf188c0-3413-11eb-ad93-ed232a2337cf","40252050-3413-11eb-ad93-ed232a2337cf"],"pipettes":{"3dff4f90-3412-11eb-ad93-ed232a2337cf":{"pipetteName":"p1000_single_gen2"}},"modules":{"3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType":{"model":"magneticModuleV2"},"3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType":{"model":"temperatureModuleV2"},"3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType":{"model":"thermocyclerModuleV1"}},"labware":{"3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1":{"displayName":"Opentrons 96 Tip Rack 1000 µL","labwareDefURI":"opentrons/opentrons_96_tiprack_1000ul/1"},"5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/4":{"displayName":"NEST 1 Well Reservoir 195 mL","labwareDefURI":"opentrons/nest_1_reservoir_195ml/4"},"60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/5":{"displayName":"Corning 24 Well Plate 3.4 mL Flat","labwareDefURI":"opentrons/corning_24_wellplate_3.4ml_flat/5"},"aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"},"ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/4":{"displayName":"Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL","labwareDefURI":"opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/4"},"b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5":{"displayName":"NEST 96 Well Plate 100 µL PCR Full Skirt (1)","labwareDefURI":"opentrons/nest_96_wellplate_100ul_pcr_full_skirt/5"}}}},"metadata":{"protocolName":"Multi select banner test protocol","author":"","description":"","created":1606853851893,"category":null,"subcategory":null,"tags":[],"source":"Protocol Designer","lastModified":1769457402801}}"""
