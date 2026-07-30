import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '../../constants'
import { getCutoutDisplayName } from '../../fixtures'
import { getSlotDisplayNameFromAAWithFakes } from '../deckConfiguration/getVisualSlotFrom'
import { getLabwareDefinitionsByURIForProtocol } from '../getLabwareDefinitionsByURIForProtocol'
import { getLabwareDefURI } from '../getLabwareDefURI'
import { getStackedItemsOnStartingDeck } from '../getStackedItemsOnStartingDeck'

import type {
  LoadLabwareRunTimeCommand,
  LoadLidRunTimeCommand,
  LoadLidStackRunTimeCommand,
  RunTimeCommand,
} from '../../../protocol'
import type {
  LabwareDefinition,
  LabwareDefinition2,
  LoadedLabware,
  LoadedModule,
  ModuleModel,
} from '../../types'

const mockDefinition: LabwareDefinition = {
  version: 1,
  schemaVersion: 2,
  namespace: 'custom',
  metadata: {
    displayName: 'Mock Definition',
    displayCategory: 'wellPlate',
    displayVolumeUnits: 'mL',
  },
  dimensions: { xDimension: 0, yDimension: 0, zDimension: 0 },
  cornerOffsetFromSlot: { x: 0, y: 0, z: 0 },
  parameters: {
    loadName: 'mock_definition',
    format: 'mock',
    isTiprack: false,
    tipLength: 1,
    isMagneticModuleCompatible: false,
  },
  brand: { brand: 'Opentrons' },
  ordering: [],
  wells: {},
  groups: [],
}

vi.mock('../getLabwareDefinitionsByURIForProtocol')
vi.mock('../getLabwareDefURI')
vi.mock('../../fixtures')
vi.mock('../parseAddressableArea')
vi.mock('../deckConfiguration/getVisualSlotFrom')

const MOCK_LABWARE_DEF = mockDefinition
const MOCK_ADAPTER_DEF: LabwareDefinition2 = {
  ...MOCK_LABWARE_DEF,
  metadata: {
    ...MOCK_LABWARE_DEF.metadata,
    displayName: 'Mock Adapter',
  },
  parameters: {
    ...MOCK_LABWARE_DEF.parameters,
    loadName: 'mock_adapter',
  },
} as any
const MOCK_LID_DEF: LabwareDefinition2 = {
  ...MOCK_LABWARE_DEF,
  metadata: {
    ...MOCK_LABWARE_DEF.metadata,
    displayName: 'Mock Lid',
  },
  parameters: {
    ...MOCK_LABWARE_DEF.parameters,
    loadName: 'mock_lid',
  },
} as any
const LABWARE_ID = 'labware-1'
const ADAPTER_ID = 'adapter-1'
const LID_ID = 'lid-1'
const MODULE_ID = 'module-1'
const SLOT_NAME = 'A1'
const ADDRESSABLE_AREA = 'C2'
const CUTOUT_ID = 'cutoutA1'

const MOCK_LOAD_LABWARE_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: SLOT_NAME },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
    locationSequence: [{ kind: 'onCutoutFixture', cutoutId: CUTOUT_ID as any }],
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_WITH_CUSTOM_NAME_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: SLOT_NAME },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
    displayName: 'Custom Labware Name',
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
    locationSequence: [{ kind: 'onCutoutFixture', cutoutId: CUTOUT_ID as any }],
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_ADDRESSABLE_AREA_COMMAND = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: SLOT_NAME },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
    locationSequence: [
      { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
    ],
  },
} as any

const MOCK_LOAD_LID_COMMAND: LoadLidRunTimeCommand = {
  id: 'cmd-2',
  commandType: 'loadLid',
  params: {
    location: { labwareId: LABWARE_ID },
    loadName: 'mock_lid',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LID_ID,
    definition: MOCK_LID_DEF,
  },
} as LoadLidRunTimeCommand

const MOCK_LOAD_LABWARE_ON_ADAPTER_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: SLOT_NAME },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
    locationSequence: [
      { kind: 'onLabware', labwareId: ADAPTER_ID },
      { kind: 'onCutoutFixture', cutoutId: CUTOUT_ID as any },
    ],
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_ON_MODULE_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: SLOT_NAME },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
    locationSequence: [
      { kind: 'onModule', moduleId: MODULE_ID },
      { kind: 'onCutoutFixture', cutoutId: CUTOUT_ID as any },
    ],
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_ON_TC_V1_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: '7' },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
    locationSequence: [
      { kind: 'onModule', moduleId: MODULE_ID },
      { kind: 'onCutoutFixture', cutoutId: CUTOUT_ID as any },
    ],
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_ON_TC_V2_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: 'A1+B1' },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
    locationSequence: [
      { kind: 'onModule', moduleId: MODULE_ID },
      { kind: 'onCutoutFixture', cutoutId: CUTOUT_ID as any },
    ],
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_OFF_DECK_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: 'offDeck',
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LID_STACK_ON_DECK_COMMAND: LoadLidStackRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLidStack',
  params: {
    location: { slotName: SLOT_NAME },
    loadName: 'mock_lid',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareIds: ['lid-1', 'lid-2', 'lid-3'],
    definition: MOCK_LID_DEF,
    stackLocationSequence: [
      { kind: 'onCutoutFixture', cutoutId: CUTOUT_ID as any },
    ],
  },
} as LoadLidStackRunTimeCommand

const MOCK_LOAD_LID_STACK_OFF_DECK_COMMAND: LoadLidStackRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLidStack',
  params: {
    location: 'offDeck',
    loadName: 'mock_lid',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareIds: ['lid-1', 'lid-2'],
    definition: MOCK_LID_DEF,
  },
} as LoadLidStackRunTimeCommand

const MOCK_LOAD_LABWARE_SYSTEM_LOCATION_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: 'systemLocation',
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: LABWARE_ID,
    definition: MOCK_LABWARE_DEF,
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_A1_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-1',
  commandType: 'loadLabware',
  params: {
    location: { slotName: 'A1' },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: 'first-labware',
    definition: MOCK_LABWARE_DEF,
    locationSequence: [
      { kind: 'onCutoutFixture', cutoutId: 'cutoutA1' as any },
    ],
  },
} as LoadLabwareRunTimeCommand

const MOCK_LOAD_LABWARE_B1_COMMAND: LoadLabwareRunTimeCommand = {
  id: 'cmd-2',
  commandType: 'loadLabware',
  params: {
    location: { slotName: 'B1' },
    loadName: 'mock_labware',
    namespace: 'mock',
    version: 1,
  },
  result: {
    labwareId: 'second-labware',
    definition: MOCK_LABWARE_DEF,
    locationSequence: [
      { kind: 'onCutoutFixture', cutoutId: 'cutoutB1' as any },
    ],
  },
} as LoadLabwareRunTimeCommand

describe('getStackedItemsOnStartingDeck', () => {
  beforeEach(() => {
    vi.mocked(getLabwareDefURI).mockImplementation(def => {
      if (def === MOCK_LABWARE_DEF) {
        return 'mock:labware/1'
      }
      if (def === MOCK_ADAPTER_DEF) {
        return 'mock:adapter/1'
      }
      if (def === MOCK_LID_DEF) {
        return 'mock:lid/1'
      } else {
        return 'unknown'
      }
    })

    vi.mocked(getLabwareDefinitionsByURIForProtocol).mockReturnValue({
      'mock:labware/1': MOCK_LABWARE_DEF,
      'mock:adapter/1': MOCK_ADAPTER_DEF,
      'mock:lid/1': MOCK_LID_DEF,
    })

    vi.mocked(getCutoutDisplayName).mockReturnValue('A1')
    vi.mocked(getSlotDisplayNameFromAAWithFakes).mockReturnValue('A1')
  })

  it('returns empty object when no load commands are present', () => {
    const commands: RunTimeCommand[] = []
    const loadedLabware: LoadedLabware[] = []
    const loadedModules: LoadedModule[] = []

    const result = getStackedItemsOnStartingDeck(
      commands,
      loadedLabware,
      loadedModules
    )

    expect(result).toEqual({})
  })

  it('handles basic labware on deck slot', () => {
    const commands: RunTimeCommand[] = [MOCK_LOAD_LABWARE_COMMAND]
    const loadedLabware: LoadedLabware[] = []
    const loadedModules: LoadedModule[] = []

    const result = getStackedItemsOnStartingDeck(
      commands,
      loadedLabware,
      loadedModules
    )

    expect(result).toEqual({
      A1: [
        [
          {
            labwareId: LABWARE_ID,
            definitionUri: 'mock:labware/1',
            displayName: 'Mock Definition',
          },
        ],
      ],
    })
  })

  it('handles labware with custom display name', () => {
    const commands: RunTimeCommand[] = [
      MOCK_LOAD_LABWARE_WITH_CUSTOM_NAME_COMMAND,
    ]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result[SLOT_NAME][0][0]).toEqual(
      expect.objectContaining({
        displayName: 'Custom Labware Name',
      })
    )
  })

  it('handles labware on addressable area', () => {
    const commands = [MOCK_LOAD_LABWARE_ADDRESSABLE_AREA_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result).toEqual({
      A1: [
        [
          {
            labwareId: LABWARE_ID,
            definitionUri: 'mock:labware/1',
            displayName: 'Mock Definition',
          },
        ],
      ],
    })
  })

  it('handles labware with lid on deck', () => {
    const commands: RunTimeCommand[] = [
      MOCK_LOAD_LABWARE_COMMAND,
      MOCK_LOAD_LID_COMMAND,
    ]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result[SLOT_NAME][0][0]).toEqual(
      expect.objectContaining({
        lidId: LID_ID,
        lidDisplayName: 'Mock Lid',
      })
    )
  })

  it('handles labware stacked on adapter', () => {
    const loadedLabware: LoadedLabware[] = [
      {
        id: ADAPTER_ID,
        definitionUri: 'mock:adapter/1',
        displayName: 'Mock Adapter',
        location: { slotName: SLOT_NAME },
      } as any,
    ]

    const commands: RunTimeCommand[] = [MOCK_LOAD_LABWARE_ON_ADAPTER_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, loadedLabware, [])

    expect(result[SLOT_NAME]).toEqual([
      [
        {
          labwareId: LABWARE_ID,
          definitionUri: 'mock:labware/1',
          displayName: 'Mock Definition',
        },
        {
          labwareId: ADAPTER_ID,
          definitionUri: 'mock:adapter/1',
          displayName: 'Mock Adapter',
        },
      ],
    ])
  })

  it('handles labware stacked on module', () => {
    const loadedModules: LoadedModule[] = [
      {
        id: MODULE_ID,
        model: 'heaterShakerModuleV1' as ModuleModel,
        serialNumber: 'mock-serial',
        location: { slotName: SLOT_NAME },
      },
    ]

    const commands: RunTimeCommand[] = [MOCK_LOAD_LABWARE_ON_MODULE_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, [], loadedModules)

    expect(result[SLOT_NAME]).toEqual([
      [
        {
          labwareId: LABWARE_ID,
          definitionUri: 'mock:labware/1',
          displayName: 'Mock Definition',
        },
        {
          moduleId: MODULE_ID,
          moduleModel: 'heaterShakerModuleV1',
          moduleSlotName: SLOT_NAME,
        },
      ],
    ])
  })

  it('handles thermocycler module location mapping for OT2', () => {
    const loadedModules: LoadedModule[] = [
      {
        id: MODULE_ID,
        model: THERMOCYCLER_MODULE_V1,
        serialNumber: 'mock-serial',
        location: { slotName: '7' },
      },
    ]

    const commands: RunTimeCommand[] = [MOCK_LOAD_LABWARE_ON_TC_V1_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, [], loadedModules)

    expect(result[TC_MODULE_LOCATION_OT2]).toBeDefined()
    expect(result[TC_MODULE_LOCATION_OT2][0][1]).toEqual({
      moduleId: MODULE_ID,
      moduleModel: THERMOCYCLER_MODULE_V1,
      moduleSlotName: '7',
    })
  })

  it('handles thermocycler module location mapping for Flex', () => {
    const loadedModules: LoadedModule[] = [
      {
        id: MODULE_ID,
        model: THERMOCYCLER_MODULE_V2,
        serialNumber: 'mock-serial',
        location: { slotName: 'A1+B1' },
      },
    ]

    const commands: RunTimeCommand[] = [MOCK_LOAD_LABWARE_ON_TC_V2_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, [], loadedModules)

    expect(result[TC_MODULE_LOCATION_OT3]).toBeDefined()
  })

  it('handles off-deck labware', () => {
    const commands: RunTimeCommand[] = [MOCK_LOAD_LABWARE_OFF_DECK_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result.offDeck).toEqual([
      [
        {
          labwareId: LABWARE_ID,
          definitionUri: 'mock:labware/1',
          displayName: 'Mock Definition',
        },
      ],
    ])
  })

  it('handles off-deck labware with lid', () => {
    const commands: RunTimeCommand[] = [
      MOCK_LOAD_LABWARE_OFF_DECK_COMMAND,
      MOCK_LOAD_LID_COMMAND,
    ]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result.offDeck[0][0]).toEqual(
      expect.objectContaining({
        lidId: LID_ID,
        lidDisplayName: 'Mock Lid',
      })
    )
  })

  it('handles lid stack on deck', () => {
    const commands: RunTimeCommand[] = [MOCK_LOAD_LID_STACK_ON_DECK_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result[SLOT_NAME]).toEqual([
      [
        {
          labwareId: 'lid-3',
          definitionUri: 'mock:lid/1',
          displayName: 'Mock Lid',
        },
        {
          labwareId: 'lid-2',
          definitionUri: 'mock:lid/1',
          displayName: 'Mock Lid',
        },
        {
          labwareId: 'lid-1',
          definitionUri: 'mock:lid/1',
          displayName: 'Mock Lid',
        },
      ],
    ])
  })

  it('handles lid stack off deck', () => {
    const commands: RunTimeCommand[] = [MOCK_LOAD_LID_STACK_OFF_DECK_COMMAND]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result.offDeck).toEqual([
      [
        {
          labwareId: 'lid-1',
          definitionUri: 'mock:lid/1',
          displayName: 'Mock Lid',
        },
        {
          labwareId: 'lid-2',
          definitionUri: 'mock:lid/1',
          displayName: 'Mock Lid',
        },
      ],
    ])
  })

  it('skips system location labware', () => {
    const commands: RunTimeCommand[] = [
      MOCK_LOAD_LABWARE_SYSTEM_LOCATION_COMMAND,
    ]

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(result).toEqual({})
  })

  it('processes commands in reverse order', () => {
    const commands: RunTimeCommand[] = [
      MOCK_LOAD_LABWARE_A1_COMMAND,
      MOCK_LOAD_LABWARE_B1_COMMAND,
    ]

    vi.mocked(getCutoutDisplayName).mockImplementation(cutoutId => {
      if (cutoutId === 'cutoutA1') {
        return 'A1'
      }
      if (cutoutId === 'cutoutB1') {
        return 'B1'
      }
      return 'unknown'
    })

    const result = getStackedItemsOnStartingDeck(commands, [], [])

    expect(Object.keys(result)).toContain('A1')
    expect(Object.keys(result)).toContain('B1')
  })
})
