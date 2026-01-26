import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "untitled",
    "created": "2019-01-30T16:37:12.717Z",
    "internalAppBuildDate": "Tue, 16 Dec 2025 16:02:03 GMT",
    "lastModified": "2026-01-26T19:57:53.117Z",
    "protocolDesigner": "8.7.1",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.27"}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    tip_rack_1 = protocol.load_labware(
        "opentrons_96_tiprack_10ul",
        location="1",
        label="Tiprack 10 Ul (1)",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "corning_96_wellplate_360ul_flat",
        location="7",
        label="Buffer Plate",
        namespace="opentrons",
        version=5,
    )

    # Load Pipettes:
    pipette_left = protocol.load_instrument("p10_single", "left")

    # Define Liquids:
    liquid_1 = protocol.define_liquid(
        "buffer",
        display_color="#b925ff",
    )

    # Load Liquids:
    well_plate_1.load_liquid(
        wells=[
            "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2",
            "E1", "E2", "F1", "F2", "G1", "G2", "H1", "H2"
        ],
        liquid=liquid_1,
        volume=200,
    )

    # PROTOCOL STEPS

    # Step 1: Transfer
    pipette_left.transfer_with_liquid_class(
        volume=6,
        source=[well_plate_1["A1"]],
        dest=[well_plate_1["A8"]],
        new_tip="always",
        trash_location=protocol.fixed_trash,
        keep_last_tip=True,
        tip_racks=[tip_rack_1],
        liquid_class=protocol.define_liquid_class(
            name="transfer_step_1",
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
    pipette_left.drop_tip()

DESIGNER_APPLICATION = """{"robot":{"model":"OT-2 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.7.0","data":{"pipetteTiprackAssignments":{"4b9021f0-24ad-11e9-b5a2-230c139b5f05":["opentrons/opentrons_96_tiprack_10ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{"0":{"displayName":"buffer","description":null,"liquidGroupId":"0","displayColor":"#b925ff","liquidClass":null}},"ingredLocations":{"565f0240-24ad-11e9-b5a2-230c139b5f05:opentrons/corning_96_wellplate_360ul_flat/5":{"A1":{"0":{"volume":200}},"A2":{"0":{"volume":200}},"B1":{"0":{"volume":200}},"B2":{"0":{"volume":200}},"C1":{"0":{"volume":200}},"C2":{"0":{"volume":200}},"D1":{"0":{"volume":200}},"D2":{"0":{"volume":200}},"E1":{"0":{"volume":200}},"E2":{"0":{"volume":200}},"F1":{"0":{"volume":200}},"F2":{"0":{"volume":200}},"G1":{"0":{"volume":200}},"G2":{"0":{"volume":200}},"H1":{"0":{"volume":200}},"H2":{"0":{"volume":200}}}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","labwareLocationUpdate":{"4b90e540-24ad-11e9-b5a2-230c139b5f05:opentrons/opentrons_96_tiprack_10ul/1":"1","565f0240-24ad-11e9-b5a2-230c139b5f05:opentrons/corning_96_wellplate_360ul_flat/5":"7"},"pipetteLocationUpdate":{"4b9021f0-24ad-11e9-b5a2-230c139b5f05":"left"},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"wasteChuteLocationUpdate":{},"trashBinLocationUpdate":{"996b4c0d-4d70-45dc-9d3f-36bd23db44d6:trashBin":"cutout12"}},"61397b50-24ad-11e9-b5a2-230c139b5f05":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":null,"aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":5,"aspirate_labware":"565f0240-24ad-11e9-b5a2-230c139b5f05:opentrons/corning_96_wellplate_360ul_flat/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":0,"aspirate_retract_mmFromBottom":2,"aspirate_retract_speed":125,"aspirate_retract_x_position":null,"aspirate_retract_y_position":null,"aspirate_retract_position_reference":"well-top","aspirate_submerge_delay_seconds":0,"aspirate_submerge_speed":125,"aspirate_submerge_mmFromBottom":2,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-top","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":400,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":31,"blowout_location":"996b4c0d-4d70-45dc-9d3f-36bd23db44d6:trashBin","changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":null,"dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":10,"dispense_labware":"565f0240-24ad-11e9-b5a2-230c139b5f05:opentrons/corning_96_wellplate_360ul_flat/5","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":0,"dispense_retract_mmFromBottom":2,"dispense_retract_speed":125,"dispense_retract_x_position":null,"dispense_retract_y_position":null,"dispense_retract_position_reference":"well-top","dispense_submerge_delay_seconds":0,"dispense_submerge_speed":125,"dispense_submerge_mmFromBottom":2,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-top","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":400,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":["A8"],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":false,"disposalVolume_volume":null,"dropTip_location":"996b4c0d-4d70-45dc-9d3f-36bd23db44d6:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"SINGLE","path":"single","pipette":"4b9021f0-24ad-11e9-b5a2-230c139b5f05","preWetTip":false,"pushOut_checkbox":false,"pushOut_volume":0,"tipRack":"opentrons/opentrons_96_tiprack_10ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"6","stepType":"moveLiquid","stepName":"Transfer","stepDetails":"","id":"61397b50-24ad-11e9-b5a2-230c139b5f05","dispense_touchTip_mmfromTop":null}},"orderedStepIds":["61397b50-24ad-11e9-b5a2-230c139b5f05"],"pipettes":{"4b9021f0-24ad-11e9-b5a2-230c139b5f05":{"pipetteName":"p10_single"}},"modules":{},"labware":{"4b90e540-24ad-11e9-b5a2-230c139b5f05:opentrons/opentrons_96_tiprack_10ul/1":{"displayName":"Tiprack 10 Ul (1)","labwareDefURI":"opentrons/opentrons_96_tiprack_10ul/1"},"565f0240-24ad-11e9-b5a2-230c139b5f05:opentrons/corning_96_wellplate_360ul_flat/5":{"displayName":"Buffer Plate","labwareDefURI":"opentrons/corning_96_wellplate_360ul_flat/5"}}}},"metadata":{"author":"","description":"","created":1548866232717,"category":null,"subcategory":null,"tags":[],"protocolName":"untitled","lastModified":1769457473117,"source":"Protocol Designer"}}"""
