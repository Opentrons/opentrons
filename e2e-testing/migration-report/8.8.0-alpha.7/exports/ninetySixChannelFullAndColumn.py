from opentrons import protocol_api

metadata = {
    "protocolName": "96ChannelFullAndColumn",
    "created": "2023-12-05T19:47:01.086Z",
    "internalAppBuildDate": "Fri, 23 Jan 2026 20:05:49 GMT",
    "lastModified": "2026-01-26T18:51:43.549Z",
    "protocolDesigner": "8.8.0-alpha.7",
    "source": "Protocol Designer",
}

requirements = {"robotType": "Flex", "apiLevel": "2.27"}


def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Adapters:
    adapter_1 = protocol.load_adapter(
        "opentrons_flex_96_tiprack_adapter",
        location="C2",
        namespace="opentrons",
        version=1,
    )

    # Load Labware:
    tip_rack_1 = adapter_1.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        namespace="opentrons",
        version=1,
    )
    well_plate_1 = protocol.load_labware(
        "biorad_96_wellplate_200ul_pcr",
        location="B1",
        namespace="opentrons",
        version=5,
    )
    tip_rack_2 = protocol.load_labware(
        "opentrons_flex_96_tiprack_50ul",
        location="D1",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    pipette = protocol.load_instrument("flex_96channel_1000")

    # Load Trash Bins:
    trash_bin_1 = protocol.load_trash_bin("A3")

    # PROTOCOL STEPS


DESIGNER_APPLICATION = """{"robot":{"model":"OT-3 Standard"},"designerApplication":{"name":"opentrons/protocol-designer","version":"8.8.0","data":{"pipetteTiprackAssignments":{"de7da440-95ec-43e8-8723-851321fbd6f9":["opentrons/opentrons_flex_96_tiprack_50ul/1"]},"dismissedWarnings":{"form":[],"timeline":[]},"ingredients":{},"ingredLocations":{"9bd16b50-4ae9-4cfd-8583-3378087e6a6c:opentrons/opentrons_flex_96_tiprack_50ul/1":{}},"savedStepForms":{"__INITIAL_DECK_SETUP_STEP__":{"labwareLocationUpdate":{"ec850fd3-cf7c-44c5-b358-fba3a30315c9:opentrons/opentrons_flex_96_tiprack_adapter/1":"C2","75aa666f-98d8-4af9-908e-963ced428580:opentrons/opentrons_flex_96_tiprack_50ul/1":"ec850fd3-cf7c-44c5-b358-fba3a30315c9:opentrons/opentrons_flex_96_tiprack_adapter/1","fe1942b1-1b75-4d3a-9c12-d23004958a12:opentrons/biorad_96_wellplate_200ul_pcr/5":"B1","9bd16b50-4ae9-4cfd-8583-3378087e6a6c:opentrons/opentrons_flex_96_tiprack_50ul/1":"D1"},"moduleLocationUpdate":{},"pipetteLocationUpdate":{"de7da440-95ec-43e8-8723-851321fbd6f9":"left"},"trashBinLocationUpdate":{"1e553651-9e4d-44b1-a31b-92459642bfd7:trashBin":"cutoutA3"},"wasteChuteLocationUpdate":{},"stagingAreaLocationUpdate":{},"gripperLocationUpdate":{},"stepType":"manualIntervention","id":"__INITIAL_DECK_SETUP_STEP__","moduleStateUpdate":{}},"83a095fa-b649-4105-99d4-177f1a3f363a":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":null,"aspirate_labware":"fe1942b1-1b75-4d3a-9c12-d23004958a12:opentrons/biorad_96_wellplate_200ul_pcr/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":null,"aspirate_retract_mmFromBottom":null,"aspirate_retract_speed":null,"aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-bottom","aspirate_submerge_delay_seconds":null,"aspirate_submerge_speed":null,"aspirate_submerge_mmFromBottom":null,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-bottom","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":null,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A1"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":null,"blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"5","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":null,"dispense_labware":"1e553651-9e4d-44b1-a31b-92459642bfd7:undefined","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":null,"dispense_retract_mmFromBottom":null,"dispense_retract_speed":null,"dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-bottom","dispense_submerge_delay_seconds":null,"dispense_submerge_speed":null,"dispense_submerge_mmFromBottom":null,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-bottom","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":null,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":[],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"5","dropTip_location":"1e553651-9e4d-44b1-a31b-92459642bfd7:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"ALL","path":"single","pipette":"de7da440-95ec-43e8-8723-851321fbd6f9","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":7,"tipRack":"opentrons/opentrons_flex_96_tiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","dispense_touchTip_mmfromTop":null,"id":"83a095fa-b649-4105-99d4-177f1a3f363a"},"f5ea3139-1585-4848-9d5f-832eb88c99ca":{"aspirate_airGap_checkbox":false,"aspirate_airGap_volume":"5","aspirate_delay_checkbox":false,"aspirate_delay_seconds":"1","aspirate_flowRate":null,"aspirate_labware":"fe1942b1-1b75-4d3a-9c12-d23004958a12:opentrons/biorad_96_wellplate_200ul_pcr/5","aspirate_mix_checkbox":false,"aspirate_mix_times":null,"aspirate_mix_volume":null,"aspirate_mmFromBottom":1,"aspirate_position_reference":"well-bottom","aspirate_retract_delay_seconds":null,"aspirate_retract_mmFromBottom":null,"aspirate_retract_speed":null,"aspirate_retract_x_position":0,"aspirate_retract_y_position":0,"aspirate_retract_position_reference":"well-bottom","aspirate_submerge_delay_seconds":null,"aspirate_submerge_speed":null,"aspirate_submerge_mmFromBottom":null,"aspirate_submerge_x_position":null,"aspirate_submerge_y_position":null,"aspirate_submerge_position_reference":"well-bottom","aspirate_touchTip_checkbox":false,"aspirate_touchTip_mmFromTop":null,"aspirate_touchTip_speed":null,"aspirate_touchTip_mmFromEdge":0,"aspirate_wellOrder_first":"t2b","aspirate_wellOrder_second":"l2r","aspirate_wells_grouped":false,"aspirate_wells":["A7"],"aspirate_x_position":0,"aspirate_y_position":0,"blowout_checkbox":false,"blowout_flowRate":null,"blowout_location":null,"changeTip":"always","conditioning_checkbox":false,"conditioning_volume":null,"dispense_airGap_checkbox":false,"dispense_airGap_volume":"5","dispense_delay_checkbox":false,"dispense_delay_seconds":"1","dispense_flowRate":null,"dispense_labware":"1e553651-9e4d-44b1-a31b-92459642bfd7:undefined","dispense_mix_checkbox":false,"dispense_mix_times":null,"dispense_mix_volume":null,"dispense_mmFromBottom":1,"dispense_position_reference":"well-bottom","dispense_retract_delay_seconds":null,"dispense_retract_mmFromBottom":null,"dispense_retract_speed":null,"dispense_retract_x_position":0,"dispense_retract_y_position":0,"dispense_retract_position_reference":"well-bottom","dispense_submerge_delay_seconds":null,"dispense_submerge_speed":null,"dispense_submerge_mmFromBottom":null,"dispense_submerge_x_position":null,"dispense_submerge_y_position":null,"dispense_submerge_position_reference":"well-bottom","dispense_touchTip_checkbox":false,"dispense_touchTip_mmFromTop":null,"dispense_touchTip_speed":null,"dispense_touchTip_mmFromEdge":0,"dispense_wellOrder_first":"t2b","dispense_wellOrder_second":"l2r","dispense_wells":[],"dispense_x_position":0,"dispense_y_position":0,"disposalVolume_checkbox":true,"disposalVolume_volume":"5","dropTip_location":"1e553651-9e4d-44b1-a31b-92459642bfd7:trashBin","liquidClassesSupported":false,"liquidClass":"none","nozzles":"COLUMN","path":"single","pipette":"de7da440-95ec-43e8-8723-851321fbd6f9","preWetTip":false,"pushOut_checkbox":true,"pushOut_volume":7,"tipRack":"opentrons/opentrons_flex_96_tiprack_50ul/1","tip_tracking":"automatic","tiprack_selected":null,"tips_selected":[],"volume":"10","stepType":"moveLiquid","stepName":"transfer","stepDetails":"","dispense_touchTip_mmfromTop":null,"id":"f5ea3139-1585-4848-9d5f-832eb88c99ca"}},"orderedStepIds":["83a095fa-b649-4105-99d4-177f1a3f363a","f5ea3139-1585-4848-9d5f-832eb88c99ca"],"pipettes":{"de7da440-95ec-43e8-8723-851321fbd6f9":{"pipetteName":"p1000_96"}},"modules":{},"labware":{"ec850fd3-cf7c-44c5-b358-fba3a30315c9:opentrons/opentrons_flex_96_tiprack_adapter/1":{"displayName":"Opentrons Flex 96 Tip Rack Adapter","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_adapter/1"},"75aa666f-98d8-4af9-908e-963ced428580:opentrons/opentrons_flex_96_tiprack_50ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_50ul/1"},"fe1942b1-1b75-4d3a-9c12-d23004958a12:opentrons/biorad_96_wellplate_200ul_pcr/5":{"displayName":"Bio-Rad 96 Well Plate 200 µL PCR","labwareDefURI":"opentrons/biorad_96_wellplate_200ul_pcr/5"},"9bd16b50-4ae9-4cfd-8583-3378087e6a6c:opentrons/opentrons_flex_96_tiprack_50ul/1":{"displayName":"Opentrons Flex 96 Tip Rack 50 µL","labwareDefURI":"opentrons/opentrons_flex_96_tiprack_50ul/1"}}}},"metadata":{"protocolName":"96ChannelFullAndColumn","author":"","description":"","created":1701805621086,"lastModified":1769453503549,"source":"Protocol Designer","category":null,"subcategory":null,"tags":[]}}"""
