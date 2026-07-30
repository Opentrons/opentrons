import { describe, expect, it } from 'vitest'

import {
  ETHANOL_LIQUID_CLASS_NAME,
  fixture96Plate,
  fixtureP300MultiV2Specs,
  fixtureP1000SingleV2Specs,
  fixtureTiprack1000ul,
  fixtureTiprackAdapter,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_MODULE_V1,
  GLYCEROL_LIQUID_CLASS_NAME,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
  VACUUM_MODULE_TYPE,
  VACUUM_MODULE_V1,
  WASTE_CHUTE_CUTOUT,
  WATER_LIQUID_CLASS_NAME,
} from '@opentrons/shared-data'

import {
  HOPPER_STACKER_LOCATION,
  VACUUM_DOCK_ADDRESSABLE_AREA,
} from '../../constants'
import {
  formatChangeTipArg,
  getDefineLiquids,
  getLoadAdapters,
  getLoadLabware,
  getLoadLidStacks,
  getLoadLiquidClasses,
  getLoadLiquids,
  getLoadModules,
  getLoadPipettes,
  getLoadTrashBins,
  getLoadWasteChute,
  getSetStoredLabware,
  PAPI_VERSION,
  pythonMetadata,
  pythonRequirements,
} from '../pythonFileUtils'
import { formatPyStr } from '../pythonFormat'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  LabwareEntities,
  LabwareEntity,
  LabwareLiquidState,
  LiquidEntities,
  ModuleEntities,
  PipetteEntities,
  TimelineFrame,
  TrashBinEntities,
  WasteChuteEntities,
} from '../../types'

// The labware fixtures use namespace "fixture", with is treated as custom labware.
// Modify the labware fixtures to change them to the "opentrons" namespace.
const opentrons96Plate = {
  ...fixture96Plate,
  namespace: 'opentrons',
} as LabwareDefinition2
const opentronsTiprackAdapter = {
  ...fixtureTiprackAdapter,
  namespace: 'opentrons',
} as LabwareDefinition2

describe('pythonMetadata', () => {
  it('should generate metadata section', () => {
    expect(
      pythonMetadata({
        protocolName: 'Name of Protocol',
        author: 'Some Author',
        description: 'The description.',
        created: 1000000000000,
        lastModified: 1000000001000,
        category: 'PCR',
        subcategory: 'PCR Prep',
        tags: ['wombat', 'kangaroo', 'wallaby'],
        source: 'Protocol Designer',
        protocolDesigner: 'fake_PD_version',
        internalAppBuildDate: 'fake_build_date',
      })
    ).toBe(
      `
metadata = {
    "protocolName": "Name of Protocol",
    "author": "Some Author",
    "description": "The description.",
    "created": "2001-09-09T01:46:40.000Z",
    "internalAppBuildDate": "fake_build_date",
    "lastModified": "2001-09-09T01:46:41.000Z",
    "category": "PCR",
    "subcategory": "PCR Prep",
    "tags": "wombat, kangaroo, wallaby",
    "protocolDesigner": "fake_PD_version",
    "source": "Protocol Designer",
}`.trimStart()
    )
  })
})

describe('pythonRequirements', () => {
  it('should generate requirements section', () => {
    expect(pythonRequirements(OT2_ROBOT_TYPE)).toBe(
      `requirements = {"robotType": "OT-2", "apiLevel": ${formatPyStr(PAPI_VERSION)}}`
    )

    expect(pythonRequirements(FLEX_ROBOT_TYPE)).toBe(
      `requirements = {"robotType": "Flex", "apiLevel": ${formatPyStr(PAPI_VERSION)}}`
    )
  })
})

const moduleId = '1'
const moduleId2 = '2'
const moduleId3 = '3'
const moduleId4 = '4'
const moduleId5 = '5'
const mockModuleEntities: ModuleEntities = {
  [moduleId]: {
    id: moduleId,
    model: MAGNETIC_BLOCK_V1,
    type: MAGNETIC_BLOCK_TYPE,
    pythonName: 'magnetic_block_1',
  },
  [moduleId2]: {
    id: moduleId2,
    model: HEATERSHAKER_MODULE_V1,
    type: HEATERSHAKER_MODULE_TYPE,
    pythonName: 'heater_shaker_1',
  },
  [moduleId3]: {
    id: moduleId3,
    model: MAGNETIC_BLOCK_V1,
    type: MAGNETIC_BLOCK_TYPE,
    pythonName: 'magnetic_block_2',
  },
}
const labwareId1 = 'labwareId1'
const labwareId2 = 'labwareId2'
const labwareId3 = 'labwareId3'
const labwareId4 = 'labwareId4'
const labwareId5 = 'labwareId5'
const labwareId6 = 'labwareId6'
const labwareId7 = 'labwareId7'
const labwareId8 = 'labwareId8'
const deckRiserId = 'deckRiserId'
const flexStackerLabwareId = 'flexStackerLabwareId'
const mockLabwareEntities: LabwareEntities = {
  [labwareId1]: {
    id: labwareId1,
    labwareDefURI: 'opentrons/fixture_flex_96_tiprack_adapter/1',
    def: opentronsTiprackAdapter,
    pythonName: 'adapter_1',
  },
  [labwareId2]: {
    id: labwareId2,
    labwareDefURI: 'fixture/fixture_flex_96_tiprack_adapter/1',
    def: fixtureTiprackAdapter as LabwareDefinition2,
    pythonName: 'adapter_2',
  },
  [labwareId3]: {
    id: labwareId3,
    labwareDefURI: 'opentrons/fixture_96_plate/1',
    def: opentrons96Plate,
    pythonName: 'well_plate_1',
  },
  [labwareId4]: {
    id: labwareId4,
    labwareDefURI: 'opentrons/fixture_96_plate/1',
    def: opentrons96Plate as LabwareDefinition2,
    pythonName: 'well_plate_2',
  },
  [labwareId5]: {
    id: labwareId5,
    labwareDefURI: 'fixture/fixture_96_plate/1',
    def: fixture96Plate as LabwareDefinition2,
    pythonName: 'well_plate_3',
  },
  [labwareId6]: {
    id: labwareId6,
    labwareDefURI: 'opentrons/mock_lid/1',
    def: {
      ...opentrons96Plate,
      allowedRoles: ['lid'],
      parameters: { loadName: 'mock_lid' } as any,
    },
    pythonName: 'lid_1',
  },
}

const labwareRobotState: TimelineFrame['labware'] = {
  //  adapter on a module
  [labwareId1]: { stack: [labwareId1, moduleId, 'B1'] },
  //  adapter on a slot
  [labwareId2]: { stack: [labwareId2, 'B2'] },
  //  labware on an adapter on a slot
  [labwareId3]: { stack: [labwareId3, labwareId2, 'B2'] },
  //  labware on a module
  [labwareId4]: { stack: [labwareId4, moduleId3, 'A2'] },
  //  labware on a slot
  [labwareId5]: { stack: [labwareId5, 'C2'] },
  // lid on labware
  [labwareId6]: { stack: [labwareId6, labwareId4, moduleId3, 'A2'] },
}

const mockLabwareNicknames: Record<string, string> = {
  [labwareId1]: fixtureTiprackAdapter.metadata.displayName,
  [labwareId2]: fixtureTiprackAdapter.metadata.displayName,
  [labwareId3]: 'reagent plate',
  [labwareId4]: fixture96Plate.metadata.displayName,
  [labwareId5]: 'sample plate',
}
describe('getLoadModules', () => {
  it('should generate loadModules', () => {
    const modules: TimelineFrame['modules'] = {
      [moduleId]: { slot: 'B1', moduleState: {} as any },
      [moduleId2]: { slot: 'A1', moduleState: {} as any },
      [moduleId3]: { slot: 'A2', moduleState: {} as any },
    }

    expect(getLoadModules(mockModuleEntities, modules)).toBe(
      `
# Load Modules:
magnetic_block_1 = protocol.load_module("magneticBlockV1", "B1")
heater_shaker_1 = protocol.load_module("heaterShakerModuleV1", "A1")
magnetic_block_2 = protocol.load_module("magneticBlockV1", "A2")`.trimStart()
    )
  })
})

describe('getLoadAdapters', () => {
  it('should generate loadAdapters for 2 adapters', () => {
    expect(
      getLoadAdapters(
        mockModuleEntities,
        mockLabwareEntities,
        labwareRobotState
      )
    ).toBe(
      `
# Load Adapters:
adapter_1 = magnetic_block_1.load_adapter(
    "fixture_flex_96_tiprack_adapter",
    namespace="opentrons",
    version=1,
)
adapter_2 = protocol.load_adapter_from_definition(
    CUSTOM_LABWARE["fixture/fixture_flex_96_tiprack_adapter/1"],
    location="B2",
)`.trimStart()
    )
  })

  it('should generate loadAdapters for vacuum adapters on vacuum main area', () => {
    const mockVacuumEntity = {
      [moduleId5]: {
        id: moduleId5,
        model: VACUUM_MODULE_V1,
        type: VACUUM_MODULE_TYPE,
        pythonName: 'vacuum_module_1',
      },
    }

    expect(
      getLoadAdapters(
        mockVacuumEntity,
        { [labwareId1]: mockLabwareEntities[labwareId1] },
        {
          [labwareId1]: {
            stack: [labwareId1, moduleId5],
          },
        }
      )
    ).toBe(
      `# Load Adapters:
adapter_1 = vacuum_module_1.load_adapter(
    "fixture_flex_96_tiprack_adapter",
    namespace="opentrons",
    version=1,
)`
    )
  })
  it('should generate loadAdapters for vacuum adapters on dock', () => {
    const mockVacuumEntity = {
      [moduleId5]: {
        id: moduleId5,
        model: VACUUM_MODULE_V1,
        type: VACUUM_MODULE_TYPE,
        pythonName: 'vacuum_module_1',
      },
    }

    expect(
      getLoadAdapters(
        mockVacuumEntity,
        { [labwareId1]: mockLabwareEntities[labwareId1] },
        {
          [labwareId1]: {
            stack: [labwareId1, VACUUM_DOCK_ADDRESSABLE_AREA, moduleId5],
          },
        }
      )
    ).toBe(
      `# Load Adapters:
adapter_1 = protocol.load_adapter(
    "fixture_flex_96_tiprack_adapter",
    location=vacuum_module_1.manifold_dock,
    namespace="opentrons",
    version=1,
)`
    )
  })
})

describe('getLoadLidStacks', () => {
  const labwareEntitiesWithLid = {
    ...mockLabwareEntities,
    [labwareId6]: {
      ...mockLabwareEntities[labwareId6],
      def: {
        ...mockLabwareEntities[labwareId6].def,
        allowedRoles: ['lid'],
      },
    } as LabwareEntity,
    [labwareId7]: {
      ...mockLabwareEntities[labwareId7],
      id: labwareId7,
      labwareDefURI: 'opentrons/mock_lid/1',
      def: {
        ...opentrons96Plate,
        allowedRoles: ['lid'],
        parameters: { loadName: 'mock_lid' } as any,
      },
    } as LabwareEntity,
    [labwareId8]: {
      id: labwareId8,
      labwareDefURI: 'opentrons/mock_lid/1',
      def: {
        ...opentrons96Plate,
        allowedRoles: ['lid'],
        parameters: { loadName: 'mock_lid' } as any,
      },
    } as LabwareEntity,
    [deckRiserId]: {
      id: deckRiserId,
      labwareDefURI: 'opentrons/opentrons_flex_deck_riser/1',
      def: {
        ...opentrons96Plate,
        allowedRoles: ['adapter'],
        parameters: { loadName: 'opentrons_flex_deck_riser' } as any,
      },
      pythonName: 'mock_adapter_1',
    } as LabwareEntity,
  }
  const labwareRobotStateWithLids = {
    ...labwareRobotState,
    [deckRiserId]: {
      ...labwareRobotState[labwareId6],
      stack: [deckRiserId, 'B2'],
    },
    [labwareId6]: {
      ...labwareRobotState[labwareId6],
      stack: [labwareId6, 'D1'],
    },
    [labwareId7]: {
      ...labwareRobotState[labwareId7],
      stack: [labwareId7, labwareId6, 'D1'],
    },
    [labwareId8]: {
      ...labwareRobotState[labwareId8],
      stack: [labwareId8, deckRiserId, 'B2'],
    },
  }

  it('should generate load_lid_stack for 2 lids in a stack on the deck and 1 lid for a stack on an adapter', () => {
    expect(
      getLoadLidStacks(labwareEntitiesWithLid, labwareRobotStateWithLids)
    ).toBe(
      `# Load Lid Stacks:
lid_stack_D1 = protocol.load_lid_stack(
    load_name="mock_lid",
    location="D1",
    quantity=2,
)
lid_stack_mock_adapter_1 = protocol.load_lid_stack(
    load_name="mock_lid",
    location=mock_adapter_1,
    quantity=1,
)`
    )
  })
})
describe('getLoadLabware', () => {
  it('should generate load_labware for 3 labware with a lid on the first one', () => {
    expect(
      getLoadLabware(
        {},
        mockModuleEntities,
        mockLabwareEntities,
        labwareRobotState,
        mockLabwareNicknames
      )
    ).toBe(
      `
# Load Labware:
well_plate_1 = adapter_2.load_labware(
    "fixture_96_plate",
    label="reagent plate",
    namespace="opentrons",
    version=1,
)
well_plate_2 = magnetic_block_2.load_labware(
    "fixture_96_plate",
    namespace="opentrons",
    version=1,
    lid="mock_lid",
    lid_namespace="opentrons",
    lid_version=1,
)
well_plate_3 = protocol.load_labware_from_definition(
    CUSTOM_LABWARE["fixture/fixture_96_plate/1"],
    location="C2",
    label="sample plate",
)`.trimStart()
    )
  })

  it('should generate load_labware for 1 labware on the stacker shuttle', () => {
    expect(
      getLoadLabware(
        {
          [moduleId]: {
            moduleState: { type: FLEX_STACKER_MODULE_TYPE } as any,
            slot: 'B2',
          },
        },
        {
          [moduleId]: {
            id: moduleId,
            model: FLEX_STACKER_MODULE_V1,
            type: FLEX_STACKER_MODULE_TYPE,
            pythonName: 'flex_stacker_1',
          },
        },
        {
          [labwareId1]: {
            id: labwareId1,
            labwareDefURI: 'opentrons/fixture_96_plate/1',
            def: opentrons96Plate,
            pythonName: 'well_plate_1',
          },
        },
        { [labwareId1]: { stack: [labwareId1, 'B2'] } },
        mockLabwareNicknames
      )
    ).toBe(
      `
# Load Labware:
well_plate_1 = flex_stacker_1.load_labware(
    "fixture_96_plate",
    label="Fixture Flex 96 Tip Rack Adapter",
    namespace="opentrons",
    version=1,
)`.trimStart()
    )
  })

  describe('getLoadLabware off-deck', () => {
    it('should generate loadLabware for off-deck', () => {
      expect(
        getLoadLabware(
          {},
          {},
          {
            plateId: {
              id: 'plateId',
              labwareDefURI: 'opentrons/fixture_96_plate/1',
              def: opentrons96Plate,
              pythonName: 'well_plate_5',
            },
          },
          { plateId: { stack: ['plateId', 'offDeck'] } },
          {}
        )
      ).toBe(
        `
# Load Labware:
well_plate_5 = protocol.load_labware(
    "fixture_96_plate",
    location=protocol_api.OFF_DECK,
    namespace="opentrons",
    version=1,
)`.trimStart()
      )
    })
  })
  it('should not generate loadLabware lids in a stack', () => {
    const labwareRobotStateWithLids = {
      ...labwareRobotState,
      [labwareId6]: {
        ...labwareRobotState[labwareId6],
        stack: [labwareId6, 'D1'], // lid in stack directly on slot, not on labware
      },
    }
    expect(
      getLoadLabware(
        {},
        mockModuleEntities,
        mockLabwareEntities,
        labwareRobotStateWithLids,
        mockLabwareNicknames
      )
    ).toBe(
      `
# Load Labware:
well_plate_1 = adapter_2.load_labware(
    "fixture_96_plate",
    label="reagent plate",
    namespace="opentrons",
    version=1,
)
well_plate_2 = magnetic_block_2.load_labware(
    "fixture_96_plate",
    namespace="opentrons",
    version=1,
)
well_plate_3 = protocol.load_labware_from_definition(
    CUSTOM_LABWARE["fixture/fixture_96_plate/1"],
    location="C2",
    label="sample plate",
)`.trimStart()
    )
  })

  it('should generate loadLabware for a flex stacker for labware on the hopper', () => {
    const mockModuleEntitiesWithFlexStackerModule = {
      ...mockModuleEntities,
      [moduleId4]: {
        ...mockModuleEntities[moduleId4],
        id: moduleId4,
        model: FLEX_STACKER_MODULE_V1,
        type: FLEX_STACKER_MODULE_TYPE,
        pythonName: 'flex_stacker_1',
      },
    }
    const mockLabwareEntitiesWithFlexStackerLabware = {
      [flexStackerLabwareId]: {
        id: flexStackerLabwareId,
        labwareDefURI: 'opentrons/fixture_96_plate/1',
        def: opentrons96Plate as LabwareDefinition2,
        pythonName: 'well_plate_4',
      },
    }

    const mockLabwareRobotStateWithFlexStackerLabware = {
      [flexStackerLabwareId]: {
        stack: [flexStackerLabwareId, HOPPER_STACKER_LOCATION, moduleId4, 'A4'],
      },
    }

    const mockModuleState: TimelineFrame['modules'] = {
      [moduleId4]: {
        slot: 'A4',
        moduleState: {} as any,
      },
    }

    const setStoredLabware = getSetStoredLabware(
      mockModuleEntitiesWithFlexStackerModule,
      mockLabwareEntitiesWithFlexStackerLabware,
      mockLabwareRobotStateWithFlexStackerLabware,
      mockModuleState,
      { timeline: [] }
    )

    expect(setStoredLabware).toBe(
      `# Set Stored Labware:
flex_stacker_1.set_stored_labware_items(
    labware=[well_plate_4],
)`.trimStart()
    )
  })

  it('should generate loadLabware for a flex stacker for labware on the shuttle', () => {
    const mockModuleEntitiesWithFlexStackerModule = {
      ...mockModuleEntities,
      [moduleId4]: {
        ...mockModuleEntities[moduleId4],
        id: moduleId4,
        model: FLEX_STACKER_MODULE_V1,
        type: FLEX_STACKER_MODULE_TYPE,
        pythonName: 'flex_stacker_1',
      },
    }
    const mockLabwareEntitiesWithFlexStackerLabware = {
      [flexStackerLabwareId]: {
        id: flexStackerLabwareId,
        labwareDefURI: 'opentrons/fixture_96_plate/1',
        def: opentrons96Plate as LabwareDefinition2,
        pythonName: 'well_plate_4',
      },
    }

    const mockLabwareRobotStateWithFlexStackerLabware = {
      [flexStackerLabwareId]: {
        stack: [flexStackerLabwareId, 'A4'],
      },
    }

    const mockModuleState: TimelineFrame['modules'] = {
      [moduleId4]: {
        slot: 'A4',
        moduleState: {} as any,
      },
    }

    const setStoredLabware = getSetStoredLabware(
      mockModuleEntitiesWithFlexStackerModule,
      mockLabwareEntitiesWithFlexStackerLabware,
      mockLabwareRobotStateWithFlexStackerLabware,
      mockModuleState,
      { timeline: [] }
    )

    expect(setStoredLabware).toBe(
      `# Set Stored Labware:
flex_stacker_1.set_stored_labware(
    load_name="fixture_96_plate",
    namespace="opentrons",
    version=1,
    count=0
)`.trimStart()
    )
  })
})

describe('getLoadPipettes', () => {
  it('should generate loadPipette for 2 pipettes using the same tipracks and off-deck labware last', () => {
    const mockTiprackDefURI = 'fixture/fixture_flex_96_tiprack_1000ul/1'
    const pipette1 = 'pipette1'
    const pipette2 = 'pipette2'
    const mockPipetteEntities: PipetteEntities = {
      [pipette1]: {
        id: pipette1,
        pythonName: 'pipette_left',
        name: 'p300_multi_gen2',
        tiprackDefURI: [mockTiprackDefURI],
        spec: fixtureP300MultiV2Specs,
        tiprackLabwareDef: [fixtureTiprack1000ul as LabwareDefinition2],
      },
      [pipette2]: {
        id: pipette2,
        pythonName: 'pipette_left',
        name: 'p1000_single_flex',
        tiprackDefURI: [mockTiprackDefURI],
        spec: fixtureP1000SingleV2Specs,
        tiprackLabwareDef: [fixtureTiprack1000ul as LabwareDefinition2],
      },
    }
    const pipetteRobotState: TimelineFrame['pipettes'] = {
      [pipette1]: { mount: 'left' },
      [pipette2]: { mount: 'right' },
    }

    expect(getLoadPipettes(mockPipetteEntities, pipetteRobotState)).toBe(
      `
# Load Pipettes:
pipette_left = protocol.load_instrument("p300_multi_gen2", "left")
pipette_left = protocol.load_instrument("flex_1channel_1000", "right")`.trimStart()
    )
  })

  it('should generate loadPipette for 1 pipette with no tiprack', () => {
    const pipette1 = 'pipette1'
    const mockPipetteEntities: PipetteEntities = {
      [pipette1]: {
        id: pipette1,
        pythonName: 'pipette_left',
        name: 'p300_multi_gen2',
        tiprackDefURI: [],
        spec: fixtureP300MultiV2Specs,
        tiprackLabwareDef: [],
      },
    }
    const pipetteRobotState: TimelineFrame['pipettes'] = {
      [pipette1]: { mount: 'left' },
    }

    expect(getLoadPipettes(mockPipetteEntities, pipetteRobotState)).toBe(
      `
# Load Pipettes:
pipette_left = protocol.load_instrument("p300_multi_gen2", "left")`.trimStart()
    )
  })

  it('should generate loadPipette for 96-channel pipette with no tiprack', () => {
    const pipette1 = 'pipette1'
    const mockPipetteEntities: PipetteEntities = {
      [pipette1]: {
        id: pipette1,
        pythonName: 'pipette',
        name: 'p1000_96',
        tiprackDefURI: [],
        spec: { ...fixtureP1000SingleV2Specs, channels: 96 },
        tiprackLabwareDef: [],
      },
    }

    const pipetteRobotState: TimelineFrame['pipettes'] = {
      [pipette1]: { mount: 'left' },
    }

    expect(getLoadPipettes(mockPipetteEntities, pipetteRobotState)).toBe(
      `
# Load Pipettes:
pipette = protocol.load_instrument("flex_96channel_1000")`.trimStart()
    )
  })
})

const liquid1 = 'liquid1'
const liquid2 = 'liquid2'
const mockLiquidEntities: LiquidEntities = {
  [liquid1]: {
    liquidGroupId: liquid1,
    pythonName: 'liquid_1',
    displayName: 'water',
    description: 'mock description',
    displayColor: 'mock display color',
    liquidClass: WATER_LIQUID_CLASS_NAME,
  },
  [liquid2]: {
    liquidGroupId: liquid2,
    pythonName: 'liquid_2',
    description: '',
    displayName: 'sulfur',
    displayColor: 'mock display color 2',
    liquidClass: ETHANOL_LIQUID_CLASS_NAME,
  },
}

describe('getDefineLiquids', () => {
  it('should generate 2 liquids, 1 with description, 1 without', () => {
    expect(getDefineLiquids(mockLiquidEntities)).toBe(
      `
# Define Liquids:
liquid_1 = protocol.define_liquid(
    "water",
    description="mock description",
    display_color="mock display color",
)
liquid_2 = protocol.define_liquid(
    "sulfur",
    display_color="mock display color 2",
)`.trimStart()
    )
  })
})

describe('getLoadLiquids', () => {
  it('should generate 2 liquids in 2 labware in multiple wells', () => {
    const mockLiquidsBylabwareId: LabwareLiquidState = {
      [labwareId3]: {
        A1: { [liquid1]: { volume: 10 } },
        A2: { [liquid1]: { volume: 10 } },
        A3: { [liquid2]: { volume: 50 } },
      },
      [labwareId4]: {
        D1: { [liquid2]: { volume: 180 } },
        D2: { [liquid2]: { volume: 180 } },
        D3: { [liquid2]: { volume: 180 } },
        D4: { [liquid2]: { volume: 180 } },
        D5: { [liquid2]: { volume: 180 } },
        D6: { [liquid2]: { volume: 180 } },
        D7: { [liquid2]: { volume: 180 } },
        D8: { [liquid2]: { volume: 180 } },
        E3: { [liquid2]: { volume: 180 } },
      },
    }
    expect(
      getLoadLiquids(
        mockLiquidsBylabwareId,
        mockLiquidEntities,
        mockLabwareEntities
      )
    ).toBe(
      `
# Load Liquids:
well_plate_1.load_liquid(
    wells=["A1", "A2"],
    liquid=liquid_1,
    volume=10,
)
well_plate_1.load_liquid(
    wells=["A3"],
    liquid=liquid_2,
    volume=50,
)
well_plate_2.load_liquid(
    wells=[
        "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8",
        "E3"
    ],
    liquid=liquid_2,
    volume=180,
)`.trimStart()
    )
  })
})

const trash1 = 'trash1'
const trash2 = 'trash2'
const wasteChute = 'wasteChute'
const mockTrashBinEntities: TrashBinEntities = {
  [trash1]: {
    pythonName: 'trash_bin_1',
    location: 'A3',
    id: trash1,
  },
  [trash2]: {
    pythonName: 'trash_bin_2',
    location: 'C3',
    id: trash2,
  },
}
const mockWasteChuteEntities: WasteChuteEntities = {
  [wasteChute]: {
    pythonName: 'waste_chute',
    id: wasteChute,
    location: WASTE_CHUTE_CUTOUT,
  },
}

describe('getTrashBins', () => {
  it('should generate 2 trash bins', () => {
    expect(getLoadTrashBins(mockTrashBinEntities)).toBe(
      `
# Load Trash Bins:
trash_bin_1 = protocol.load_trash_bin("A3")
trash_bin_2 = protocol.load_trash_bin("C3")`.trimStart()
    )
  })
})

describe('getLoadWasteChute', () => {
  it('should generate a waste chute', () => {
    expect(getLoadWasteChute(mockWasteChuteEntities)).toBe(
      `
# Load Waste Chute:
waste_chute = protocol.load_waste_chute()`.trimStart()
    )
  })
})

describe('getLoadLiquidClasses', () => {
  it('should load a liquid class for each liquid class types', () => {
    expect(
      getLoadLiquidClasses([
        WATER_LIQUID_CLASS_NAME,
        ETHANOL_LIQUID_CLASS_NAME,
        GLYCEROL_LIQUID_CLASS_NAME,
      ])
    ).toBe(
      `
# Load Liquid Classes:
water_base_class = protocol.get_liquid_class("water")
ethanol_80_base_class = protocol.get_liquid_class("ethanol_80")
glycerol_50_base_class = protocol.get_liquid_class("glycerol_50")`.trimStart()
    )
  })
})

describe('formatChangeTipArg', () => {
  it('should transform perSource into per source', () => {
    expect(formatChangeTipArg('perSource')).toBe('per source')
  })
  it('should transform perDest into per destination', () => {
    expect(formatChangeTipArg('perDest')).toBe('per destination')
  })
  it('should not alter never', () => {
    expect(formatChangeTipArg('never')).toBe('never')
  })
})
