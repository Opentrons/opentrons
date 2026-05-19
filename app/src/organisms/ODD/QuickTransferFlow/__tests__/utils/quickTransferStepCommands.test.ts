import { describe, expect, it } from 'vitest'

import {
  A1_NOZZLE,
  ALL,
  fixture96Plate,
  fixtureP1000SingleV2Specs,
  fixtureTiprack1000ul,
  POSITION_REFERENCE_BOTTOM,
} from '@opentrons/shared-data'
import {
  AUTOMATIC,
  CLEAN,
  SOURCE_WELL_BLOWOUT_DESTINATION,
} from '@opentrons/step-generation'

import { quickTransferStepCommands } from '../../utils/pythonDef'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  ConsolidateArgs,
  DistributeArgs,
  InvariantContext,
  TimelineFrame,
  TransferArgs,
} from '@opentrons/step-generation'

const mockInvariantContext: InvariantContext = {
  moduleEntities: {},
  liquidEntities: {},
  wasteChuteEntities: {},
  stagingAreaEntities: {},
  gripperEntities: {},
  trashBinEntities: {
    mockTrashBin: {
      id: 'mockTrashBin',
      location: 'cutoutA3',
      pythonName: 'mock_trash_bin_1',
    },
  },
  pipetteEntities: {
    mockPipette: {
      name: 'p1000_single_flex',
      id: 'mockPipette',
      tiprackLabwareDef: [fixtureTiprack1000ul] as LabwareDefinition2[],
      tiprackDefURI: ['fixture/fixture_flex_96_tiprack_1000ul/1'],
      spec: fixtureP1000SingleV2Specs,
      pythonName: 'pipette',
    },
  },
  labwareEntities: {
    mockSourceLabware: {
      id: 'mockSourceLabware',
      labwareDefURI: 'mockDefUri',
      def: fixture96Plate as LabwareDefinition2,
      pythonName: 'mock_labware_1',
    },
    mockDestLabware: {
      id: 'mockDestLabware',
      labwareDefURI: 'mockDefUri',
      def: fixture96Plate as LabwareDefinition2,
      pythonName: 'mock_labware_2',
    },
    mockTiprack: {
      id: 'mockTiprack',
      labwareDefURI: 'fixture/fixture_flex_96_tiprack_1000ul/1',
      def: fixtureTiprack1000ul as LabwareDefinition2,
      pythonName: 'mock_tiprack_1',
    },
  },
  config: {} as any,
}
const mockRobotState: TimelineFrame = {
  pipettes: {
    mockPipette: {
      mount: 'left',
    },
  },
  labware: {
    mockSourceLabware: {
      stack: ['mockSourceLabware', 'A1'],
    },
    mockDestLabware: {
      stack: ['mockDestLabware', 'C2'],
    },
    mockTiprack: {
      stack: ['mockTiprack', 'B1'],
    },
  },
  modules: {},
  tipState: {
    tipracks: {
      mockTiprack: {
        A1: CLEAN,
        B1: CLEAN,
      },
    },
    pipettes: {
      mockPipette: {
        hasTip: false,
        tiprackURI: null,
      },
    },
  },
  liquidState: {
    pipettes: {
      mockPipette: {
        0: {},
      },
    },
    labware: {
      mockSourceLabware: {
        A1: {},
      },
      mockDestLabware: {
        A1: {},
      },
    },
    trashBins: {
      mockTrashBin: {},
    },
    wasteChute: {},
  },
}

describe('quickTransferStepCommands', () => {
  it('should generate a transfer step in py', () => {
    const mockStepArgs: TransferArgs = {
      stepNumber: 1,
      primaryNozzle: A1_NOZZLE,
      commandCreatorFnName: 'transfer',
      sourceWells: ['A1'],
      destWells: ['B1'],
      blowoutFlowRateUlSec: 50,
      touchTipAfterAspirateMmFromEdge: null,
      liquidClass: null,
      aspiratePositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateZOffset: 0,
      aspirateSubmergeSpeed: null,
      aspirateSubmergeXOffset: 0,
      aspirateSubmergeYOffset: 0,
      aspirateSubmergeZOffset: 0,
      aspirateSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateRetractSpeed: null,
      aspirateSubmergeDelay: null,
      aspirateRetractXOffset: 0,
      aspirateRetractYOffset: 0,
      aspirateRetractZOffset: 0,
      aspirateRetractPositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateRetractDelay: null,
      dispenseSubmergeSpeed: null,
      dispenseSubmergeXOffset: 0,
      dispenseSubmergeYOffset: 0,
      dispenseSubmergeZOffset: 0,
      dispenseSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
      dispenseRetractSpeed: null,
      dispenseRetractXOffset: 0,
      dispenseRetractYOffset: 0,
      dispenseRetractZOffset: 0,
      dispenseRetractPositionReference: POSITION_REFERENCE_BOTTOM,
      blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
      blowoutOffsetFromTopMm: null,
      blowoutXPosition: null,
      blowoutYPosition: null,
      blowoutPositionReference: null,
      mixBeforeAspirate: null,
      mixInDestination: null,
      tipRack: 'fixture/fixture_flex_96_tiprack_1000ul/1',
      pipette: 'mockPipette',
      nozzles: ALL,
      sourceLabware: 'mockSourceLabware',
      destLabware: 'mockDestLabware',
      volume: 10,
      dropTipLocation: 'mockTrashBin',
      preWetTip: false,
      touchTipAfterAspirate: false,
      touchTipAfterAspirateOffsetMmFromTop: 0,
      touchTipAfterAspirateSpeed: null,
      changeTip: 'always',
      aspirateDelay: null,
      aspirateAirGapVolume: null,
      aspirateFlowRateUlSec: 56,
      aspirateOffsetFromBottomMm: -1,
      aspirateXOffset: 0,
      aspirateYOffset: 0,
      dispenseAirGapVolume: null,
      dispenseDelay: null,
      touchTipAfterDispense: false,
      touchTipAfterDispenseOffsetMmFromTop: 0,
      touchTipAfterDispenseMmFromEdge: 0,
      touchTipAfterDispenseSpeed: null,
      dispenseFlowRateUlSec: 80,
      dispenseOffsetFromBottomMm: -1,
      dispenseXOffset: 0,
      dispenseYOffset: 0,
      dispenseZOffset: 0,
      dispensePositionReference: POSITION_REFERENCE_BOTTOM,
      dispenseSubmergeDelay: null,
      dispenseRetractDelay: null,
      name: 'transfer',
      description: 'transferring from 1 well to another',
      pushOut: null,
      tipTracking: AUTOMATIC,
      tipsSelected: [],
      tiprackSelected: null,
    }
    expect(
      quickTransferStepCommands({
        stepArgs: mockStepArgs,
        invariantContext: mockInvariantContext,
        initialRobotState: mockRobotState,
      })
    ).toBe(
      `
# TRANSFER STEP

pipette.transfer_with_liquid_class(
    volume=10,
    source=[mock_labware_1["A1"]],
    dest=[mock_labware_2["B1"]],
    new_tip="always",
    trash_location=mock_trash_bin_1,
    keep_last_tip=True,
    tip_racks=[mock_tiprack_1],
    liquid_class=protocol.define_liquid_class(
        name="transfer_step_1",
        properties={"flex_1channel_1000": {"fixture/fixture_flex_96_tiprack_1000ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 0},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 56)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "start_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 0},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 80)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "start_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                    "touch_tip": {"enabled": False},
                    "blowout": {
                        "enabled": True,
                        "location": "source",
                        "flow_rate": 50,
                        "blowout_position": {
                            "offset": {"x": 0, "y": 0, "z": 1},
                            "position_reference": "well-top",
                        },
                    },
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
        }}},
    ),
)
pipette.drop_tip()`.trimStart()
    )
  })
  it('should generate a consolidate step in py', () => {
    const mockStepArgs: ConsolidateArgs = {
      stepNumber: 1,
      primaryNozzle: A1_NOZZLE,
      commandCreatorFnName: 'consolidate',
      sourceWells: ['A1', 'B1'],
      destWell: 'B1',
      blowoutFlowRateUlSec: 50,
      liquidClass: null,
      aspiratePositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateZOffset: 0,
      aspirateSubmergeSpeed: null,
      aspirateSubmergeXOffset: 0,
      aspirateSubmergeYOffset: 0,
      aspirateSubmergeZOffset: 0,
      aspirateSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateSubmergeDelay: null,
      aspirateRetractSpeed: null,
      aspirateRetractXOffset: 0,
      aspirateRetractYOffset: 0,
      aspirateRetractZOffset: 0,
      aspirateRetractPositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateRetractDelay: null,
      dispenseSubmergeSpeed: null,
      dispenseSubmergeXOffset: 0,
      dispenseSubmergeYOffset: 0,
      dispenseSubmergeZOffset: 0,
      dispenseSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
      dispenseRetractSpeed: null,
      dispenseRetractXOffset: 0,
      dispenseRetractYOffset: 0,
      dispenseRetractZOffset: 0,
      dispenseRetractPositionReference: POSITION_REFERENCE_BOTTOM,
      touchTipAfterAspirateMmFromEdge: null,
      blowoutLocation: 'mockTrashBin',
      blowoutOffsetFromTopMm: null,
      blowoutXPosition: null,
      blowoutYPosition: null,
      blowoutPositionReference: null,
      mixFirstAspirate: null,
      mixInDestination: null,
      tipRack: 'fixture/fixture_flex_96_tiprack_1000ul/1',
      pipette: 'mockPipette',
      nozzles: ALL,
      sourceLabware: 'mockSourceLabware',
      destLabware: 'mockDestLabware',
      volume: 10,
      dropTipLocation: 'mockTrashBin',
      preWetTip: false,
      touchTipAfterAspirate: false,
      touchTipAfterAspirateOffsetMmFromTop: 0,
      touchTipAfterAspirateSpeed: null,
      changeTip: 'always',
      aspirateDelay: null,
      aspirateAirGapVolume: null,
      aspirateFlowRateUlSec: 56,
      aspirateOffsetFromBottomMm: -1,
      aspirateXOffset: 0,
      aspirateYOffset: 0,
      dispenseAirGapVolume: null,
      dispenseDelay: null,
      touchTipAfterDispense: false,
      touchTipAfterDispenseOffsetMmFromTop: 0,
      touchTipAfterDispenseMmFromEdge: 0,
      touchTipAfterDispenseSpeed: null,
      dispenseFlowRateUlSec: 80,
      dispenseOffsetFromBottomMm: -1,
      dispenseXOffset: 0,
      dispenseYOffset: 0,
      dispenseZOffset: 0,
      dispensePositionReference: POSITION_REFERENCE_BOTTOM,
      dispenseSubmergeDelay: null,
      dispenseRetractDelay: null,
      name: 'transfer',
      description: 'transferring from 1 well to another',
      pushOut: null,
      tipTracking: AUTOMATIC,
      tipsSelected: [],
      tiprackSelected: null,
    }
    expect(
      quickTransferStepCommands({
        stepArgs: mockStepArgs,
        invariantContext: mockInvariantContext,
        initialRobotState: mockRobotState,
      })
    ).toBe(
      `
# CONSOLIDATE STEP

pipette.consolidate_with_liquid_class(
    volume=10,
    source=[mock_labware_1["A1"], mock_labware_1["B1"]],
    dest=[mock_labware_2["B1"]],
    new_tip="always",
    trash_location=mock_trash_bin_1,
    keep_last_tip=True,
    tip_racks=[mock_tiprack_1],
    liquid_class=protocol.define_liquid_class(
        name="consolidate_step_1",
        properties={"flex_1channel_1000": {"fixture/fixture_flex_96_tiprack_1000ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 0},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 56)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "start_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 0},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 80)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "start_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                    "touch_tip": {"enabled": False},
                    "blowout": {"enabled": True, "location": "trash", "flow_rate": 50},
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
        }}},
    ),
)
pipette.drop_tip()`.trimStart()
    )
  })
  it('should generate a distribute step in py', () => {
    const mockStepArgs: DistributeArgs = {
      stepNumber: 1,
      primaryNozzle: A1_NOZZLE,
      commandCreatorFnName: 'distribute',
      sourceWell: 'A1',
      destWells: ['A1', 'B1'],
      blowoutFlowRateUlSec: 50,
      conditioningVolume: null,
      touchTipAfterAspirateMmFromEdge: null,
      liquidClass: null,
      aspiratePositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateZOffset: 0,
      aspirateSubmergeSpeed: null,
      aspirateSubmergeXOffset: 0,
      aspirateSubmergeYOffset: 0,
      aspirateSubmergeZOffset: 0,
      aspirateSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateSubmergeDelay: null,
      aspirateRetractSpeed: null,
      aspirateRetractXOffset: 0,
      aspirateRetractYOffset: 0,
      aspirateRetractZOffset: 0,
      aspirateRetractPositionReference: POSITION_REFERENCE_BOTTOM,
      aspirateRetractDelay: null,
      dispenseSubmergeSpeed: null,
      dispenseSubmergeXOffset: 0,
      dispenseSubmergeYOffset: 0,
      dispenseSubmergeZOffset: 0,
      dispenseSubmergePositionReference: POSITION_REFERENCE_BOTTOM,
      dispenseRetractSpeed: null,
      dispenseRetractXOffset: 0,
      dispenseRetractYOffset: 0,
      dispenseRetractZOffset: 0,
      dispenseRetractPositionReference: POSITION_REFERENCE_BOTTOM,
      blowoutLocation: SOURCE_WELL_BLOWOUT_DESTINATION,
      blowoutOffsetFromTopMm: null,
      blowoutXPosition: null,
      blowoutYPosition: null,
      blowoutPositionReference: null,
      mixBeforeAspirate: null,
      tipRack: 'fixture/fixture_flex_96_tiprack_1000ul/1',
      pipette: 'mockPipette',
      nozzles: ALL,
      sourceLabware: 'mockSourceLabware',
      destLabware: 'mockDestLabware',
      volume: 10,
      dropTipLocation: 'mockTrashBin',
      preWetTip: false,
      touchTipAfterAspirate: false,
      touchTipAfterAspirateOffsetMmFromTop: 0,
      touchTipAfterAspirateSpeed: null,
      changeTip: 'always',
      aspirateDelay: null,
      aspirateAirGapVolume: null,
      aspirateFlowRateUlSec: 56,
      aspirateOffsetFromBottomMm: -1,
      aspirateXOffset: 0,
      aspirateYOffset: 0,
      dispenseAirGapVolume: null,
      dispenseDelay: null,
      touchTipAfterDispense: false,
      touchTipAfterDispenseOffsetMmFromTop: 0,
      touchTipAfterDispenseMmFromEdge: 0,
      touchTipAfterDispenseSpeed: null,
      dispenseFlowRateUlSec: 80,
      dispenseOffsetFromBottomMm: -1,
      dispenseXOffset: 0,
      dispenseYOffset: 0,
      dispenseZOffset: 0,
      dispensePositionReference: POSITION_REFERENCE_BOTTOM,
      dispenseSubmergeDelay: null,
      dispenseRetractDelay: null,
      name: 'transfer',
      description: 'transferring from 1 well to another',
      disposalVolume: null,
      pushOut: null,
      tipTracking: AUTOMATIC,
      tipsSelected: [],
      tiprackSelected: null,
    }
    expect(
      quickTransferStepCommands({
        stepArgs: mockStepArgs,
        invariantContext: mockInvariantContext,
        initialRobotState: mockRobotState,
      })
    ).toBe(
      `
# DISTRIBUTE STEP

pipette.distribute_with_liquid_class(
    volume=10,
    source=[mock_labware_1["A1"]],
    dest=[mock_labware_2["A1"], mock_labware_2["B1"]],
    new_tip="always",
    trash_location=mock_trash_bin_1,
    keep_last_tip=True,
    tip_racks=[mock_tiprack_1],
    liquid_class=protocol.define_liquid_class(
        name="distribute_step_1",
        properties={"flex_1channel_1000": {"fixture/fixture_flex_96_tiprack_1000ul/1": {
            "aspirate": {
                "aspirate_position": {
                    "offset": {"x": 0, "y": 0, "z": 0},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 56)],
                "pre_wet": False,
                "correction_by_volume": [(0, 0)],
                "delay": {"enabled": False},
                "mix": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "start_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                    "touch_tip": {"enabled": False},
                },
            },
            "dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 0},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 80)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "start_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                    "touch_tip": {"enabled": False},
                    "blowout": {
                        "enabled": True,
                        "location": "source",
                        "flow_rate": 50,
                        "blowout_position": {
                            "offset": {"x": 0, "y": 0, "z": 1},
                            "position_reference": "well-top",
                        },
                    },
                },
                "correction_by_volume": [(0, 0)],
                "push_out_by_volume": [(0, 0)],
                "mix": {"enabled": False},
            },
            "multi_dispense": {
                "dispense_position": {
                    "offset": {"x": 0, "y": 0, "z": 0},
                    "position_reference": "well-bottom",
                },
                "flow_rate_by_volume": [(0, 80)],
                "delay": {"enabled": False},
                "submerge": {
                    "delay": {"enabled": False},
                    "start_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                },
                "retract": {
                    "air_gap_by_volume": [(0, 0)],
                    "delay": {"enabled": False},
                    "end_position": {
                        "offset": {"x": 0, "y": 0, "z": 0},
                        "position_reference": "well-bottom",
                    },
                    "touch_tip": {"enabled": False},
                    "blowout": {
                        "enabled": True,
                        "location": "source",
                        "flow_rate": 50,
                        "blowout_position": {
                            "offset": {"x": 0, "y": 0, "z": 1},
                            "position_reference": "well-top",
                        },
                    },
                },
                "correction_by_volume": [(0, 0)],
                "conditioning_by_volume": [(0, 0)],
                "disposal_by_volume": [(0, 0)],
            },
        }}},
    ),
)
pipette.drop_tip()`.trimStart()
    )
  })
})
