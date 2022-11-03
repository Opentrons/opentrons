import { RunTimeCommand } from '@opentrons/shared-data'
import {
  parsePipetteEntity,
  parseInitialPipetteNamesByMount,
  parseAllRequiredModuleModels,
  parseAllRequiredModuleModelsById,
  parseInitialLoadedLabwareEntity,
  parseInitialLoadedLabwareBySlot,
  parseInitialLoadedLabwareByModuleId,
  parseInitialLoadedLabwareDefinitionsById,
  parseInitialLoadedModulesBySlot,
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '../utils'

import { simpleAnalysisFileFixture } from '../__fixtures__'

const mockRunTimeCommands: RunTimeCommand[] = simpleAnalysisFileFixture.commands as any
const mockLoadLiquidRunTimeCommands = [
  {
    id: '97ba49a5-04f6-4f91-986a-04a0eb632882',
    createdAt: '2022-09-07T19:47:42.781065+00:00',
    commandType: 'loadPipette',
    key: '0feeecaf-3895-46d7-ab71-564601265e35',
    status: 'succeeded',
    params: {
      pipetteName: 'p20_single_gen2',
      mount: 'left',
      pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
    },
    result: {
      pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
    },
    startedAt: '2022-09-07T19:47:42.782665+00:00',
    completedAt: '2022-09-07T19:47:42.785061+00:00',
  },
  {
    id: '846e0b7b-1e54-4f42-9ab1-964ebda45da5',
    createdAt: '2022-09-07T19:47:42.781281+00:00',
    commandType: 'loadLiquid',
    key: '1870d1a2-8dcd-46f2-9e27-16578365913b',
    status: 'succeeded',
    params: {
      liquidId: '1',
      labwareId: 'mockLabwareId1',
      volumeByWell: {
        A2: 20,
        B2: 20,
        C2: 20,
        D2: 20,
        E2: 20,
        F2: 20,
        G2: 20,
        H2: 20,
      },
    },
    result: {},
    startedAt: '2022-09-07T19:47:42.785987+00:00',
    completedAt: '2022-09-07T19:47:42.786087+00:00',
  },
  {
    id: '1e03ae10-7e9b-465c-bc72-21ab5706bfb0',
    createdAt: '2022-09-07T19:47:42.781323+00:00',
    commandType: 'loadLiquid',
    key: '48df9766-04ff-4927-9f2d-4efdcf0b3df8',
    status: 'succeeded',
    params: {
      liquidId: '1',
      labwareId: 'mockLabwareId2',
      volumeByWell: {
        A1: 33,
        B1: 33,
        C1: 33,
      },
    },
    result: {},
    startedAt: '2022-09-07T19:47:42.786212+00:00',
    completedAt: '2022-09-07T19:47:42.786285+00:00',
  },
  {
    id: 'e8596bb3-b650-4d62-9bb5-dfc6e9e63249',
    createdAt: '2022-09-07T19:47:42.781363+00:00',
    commandType: 'loadLiquid',
    key: '69d19b03-fdcc-4964-a2f8-3cbb30f4ddf3',
    status: 'succeeded',
    params: {
      liquidId: '0',
      labwareId: 'mockLabwareId1',
      volumeByWell: {
        A1: 33,
        B1: 33,
        C1: 33,
        D1: 33,
        E1: 33,
        F1: 33,
        G1: 33,
        H1: 33,
      },
    },
    result: {},
    startedAt: '2022-09-07T19:47:42.786347+00:00',
    completedAt: '2022-09-07T19:47:42.786412+00:00',
  },
]
const mockLiquids = [
  {
    id: '0',
    displayName: 'Water',
    description: 'mock liquid 1',
    displayColor: '#50d5ff',
  },
  {
    id: '1',
    displayName: 'Saline',
    description: 'mock liquid 2',
    displayColor: '#b925ff',
  },
]

describe('parseInitialPipetteNamesByMount', () => {
  it('returns pipette names for each mount if loaded and null if nothing loaded', () => {
    const expected = {
      left: 'p300_single_gen2',
      right: null,
    }
    expect(parseInitialPipetteNamesByMount(mockRunTimeCommands)).toEqual(
      expected
    )
  })
  it('returns pipette names for right mount if loaded', () => {
    const onlyRightMount: RunTimeCommand[] = mockRunTimeCommands.map(c =>
      c.commandType === 'loadPipette'
        ? { ...c, params: { ...c.params, mount: 'right' } }
        : c
    )
    const expected = {
      left: null,
      right: 'p300_single_gen2',
    }
    expect(parseInitialPipetteNamesByMount(onlyRightMount)).toEqual(expected)
  })
})
describe('parsePipetteEntity', () => {
  it('returns pipette names by id if loaded', () => {
    const expected = [{ id: 'pipette-0', pipetteName: 'p300_single_gen2' }]
    expect(parsePipetteEntity(mockRunTimeCommands)).toEqual(expected)
  })
})
describe('parseAllRequiredModuleModels', () => {
  it('returns all models for all loaded modules', () => {
    const expected = ['magneticModuleV2', 'temperatureModuleV2']
    expect(parseAllRequiredModuleModels(mockRunTimeCommands)).toEqual(expected)
  })
})
describe('parseAllRequiredModuleModelsById', () => {
  it('returns models by id for all loaded modules', () => {
    const expected = {
      'module-0': { model: 'magneticModuleV2' },
      'module-1': { model: 'temperatureModuleV2' },
    }
    expect(parseAllRequiredModuleModelsById(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseInitialLoadedLabwareBySlot', () => {
  it('returns only labware loaded in slots', () => {
    const expected = {
      2: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          typeof c.params.location === 'object' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '2'
      ),
      12: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          typeof c.params.location === 'object' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '12'
      ),
    }
    expect(parseInitialLoadedLabwareBySlot(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseInitialLoadedLabwareByModuleId', () => {
  it('returns only labware loaded in modules', () => {
    const expected = {
      'module-0': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          typeof c.params.location === 'object' &&
          'moduleId' in c.params?.location &&
          c.params?.location?.moduleId === 'module-0'
      ),
      'module-1': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' &&
          typeof c.params.location === 'object' &&
          'moduleId' in c.params?.location &&
          c.params?.location?.moduleId === 'module-1'
      ),
    }
    expect(parseInitialLoadedLabwareByModuleId(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseInitialLoadedLabwareById', () => {
  it('returns labware loaded by id', () => {
    const expected = [
      {
        id: 'labware-1',
        loadName: 'opentrons_96_tiprack_300ul',
        definitionUri: 'opentrons/opentrons_96_tiprack_300ul/1',
        displayName: 'Opentrons 96 Tip Rack 300 µL',
      },
      {
        id: 'labware-2',
        loadName: 'nest_96_wellplate_100ul_pcr_full_skirt',
        definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
        displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      },
      {
        id: 'labware-3',
        loadName: 'opentrons_24_aluminumblock_generic_2ml_screwcap',
        definitionUri:
          'opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/1',
        displayName:
          'Opentrons 24 Well Aluminum Block with Generic 2 mL Screwcap',
      },
    ]
    expect(parseInitialLoadedLabwareEntity(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseInitialLoadedLabwareDefinitionsById', () => {
  it('returns labware definitions loaded by id', () => {
    const expected = {
      'opentrons/opentrons_96_tiprack_300ul/1': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' && c.result.labwareId === 'labware-1'
      )?.result.definition,
      'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' && c.result.labwareId === 'labware-2'
      )?.result.definition,
      'opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/1': mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadLabware' && c.result.labwareId === 'labware-3'
      )?.result.definition,
    }
    expect(
      parseInitialLoadedLabwareDefinitionsById(mockRunTimeCommands)
    ).toEqual(expected)
  })
})
describe('parseInitialLoadedModulesBySlot', () => {
  it('returns modules loaded in slots', () => {
    const expected = {
      1: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadModule' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '1'
      ),
      3: mockRunTimeCommands.find(
        c =>
          c.commandType === 'loadModule' &&
          'slotName' in c.params?.location &&
          c.params?.location?.slotName === '3'
      ),
    }
    expect(parseInitialLoadedModulesBySlot(mockRunTimeCommands)).toEqual(
      expected
    )
  })
})
describe('parseLiquidsInLoadOrder', () => {
  it('returns liquids in loaded order', () => {
    const expected = [
      {
        id: '1',
        displayName: 'Saline',
        description: 'mock liquid 2',
        displayColor: '#b925ff',
      },
      {
        id: '0',
        displayName: 'Water',
        description: 'mock liquid 1',
        displayColor: '#50d5ff',
      },
    ]
    expect(
      parseLiquidsInLoadOrder(
        mockLiquids,
        mockLoadLiquidRunTimeCommands as RunTimeCommand[]
      )
    ).toEqual(expected)
  })
})
describe('parseLabwareInfoByLiquidId', () => {
  it('returns labware info by liquid id', () => {
    const expected = {
      '0': [
        {
          labwareId: 'mockLabwareId1',
          volumeByWell: {
            A1: 33,
            B1: 33,
            C1: 33,
            D1: 33,
            E1: 33,
            F1: 33,
            G1: 33,
            H1: 33,
          },
        },
      ],
      '1': [
        {
          labwareId: 'mockLabwareId1',
          volumeByWell: {
            A2: 20,
            B2: 20,
            C2: 20,
            D2: 20,
            E2: 20,
            F2: 20,
            G2: 20,
            H2: 20,
          },
        },
        {
          labwareId: 'mockLabwareId2',
          volumeByWell: {
            A1: 33,
            B1: 33,
            C1: 33,
          },
        },
      ],
    }
    expect(
      parseLabwareInfoByLiquidId(
        mockLoadLiquidRunTimeCommands as RunTimeCommand[]
      )
    ).toEqual(expected)
  })
})
