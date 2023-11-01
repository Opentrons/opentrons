import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  BaseDeck,
  EXTENDED_DECK_CONFIG_FIXTURE,
  LabwareRender,
  Module,
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
// import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'
import {
  parseInitialLoadedLabwareByAdapter,
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
  simpleAnalysisFileFixture,
} from '@opentrons/api-client'

import { i18n } from '../../../../../i18n'
import {
  useAttachedModules,
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../../../hooks'
import { getWellFillFromLabwareId } from '../utils'
import { LabwareInfoOverlay } from '../../LabwareInfoOverlay'
import {
  getLabwareRenderInfo,
  getStandardDeckViewLayerBlockList,
  getProtocolModulesInfo,
} from '../../utils'
import { getAttachedProtocolModuleMatches } from '../../../../ProtocolSetupModulesAndDeck/utils'
import { getDeckConfigFromProtocolCommands } from '../../../../../resources/deck_configuration/utils'
import { mockProtocolModuleInfo } from '../../../../ProtocolSetupInstruments/__fixtures__'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../../../redux/modules/__fixtures__'
import { SetupLiquidsMap } from '../SetupLiquidsMap'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
} from '@opentrons/shared-data'

// import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

jest.mock('@opentrons/components/src/hardware-sim', () => {
  const actualComponents = jest.requireActual(
    '@opentrons/components/src/hardware-sim'
  )
  return {
    ...actualComponents,
    Module: jest.fn(() => <div>mock Module</div>),
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
  }
})
// jest.mock('@opentrons/shared-data', () => {
//   const actualSharedData = jest.requireActual('@opentrons/shared-data')
//   return {
//     ...actualSharedData,
//     inferModuleOrientationFromXCoordinate: jest.fn(),
//   }
// })
jest.mock('@opentrons/api-client')
jest.mock('@opentrons/components/src/hardware-sim/BaseDeck')
// jest.mock('@opentrons/components/src/hardware-sim/Labware/LabwareRender')
// jest.mock('@opentrons/components/src/hardware-sim/Module')
jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../LabwareInfoOverlay')
jest.mock('../../../hooks')
jest.mock('../utils')
jest.mock('../../utils')
jest.mock('../../../../ProtocolSetupModulesAndDeck/utils')
// jest.mock('../../utils/getProtocolModulesInfo')
jest.mock('../../../../../resources/deck_configuration/utils')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockLabwareInfoOverlay = LabwareInfoOverlay as jest.MockedFunction<
  typeof LabwareInfoOverlay
>
const mockModule = Module as jest.MockedFunction<typeof Module>
const mockInferModuleOrientationFromXCoordinate = inferModuleOrientationFromXCoordinate as jest.MockedFunction<
  typeof inferModuleOrientationFromXCoordinate
>
const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>
const mockUseLabwareRenderInfoForRunById = useLabwareRenderInfoForRunById as jest.MockedFunction<
  typeof useLabwareRenderInfoForRunById
>
const mockUseModuleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById as jest.MockedFunction<
  typeof useModuleRenderInfoForProtocolById
>
const mockGetWellFillFromLabwareId = getWellFillFromLabwareId as jest.MockedFunction<
  typeof getWellFillFromLabwareId
>
const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockGetLabwareRenderInfo = getLabwareRenderInfo as jest.MockedFunction<
  typeof getLabwareRenderInfo
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockGetAttachedProtocolModuleMatches = getAttachedProtocolModuleMatches as jest.MockedFunction<
  typeof getAttachedProtocolModuleMatches
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockParseInitialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter as jest.MockedFunction<
  typeof parseInitialLoadedLabwareByAdapter
>
const mockParseLabwareInfoByLiquidId = parseLabwareInfoByLiquidId as jest.MockedFunction<
  typeof parseLabwareInfoByLiquidId
>
const mockParseLiquidsInLoadOrder = parseLiquidsInLoadOrder as jest.MockedFunction<
  typeof parseLiquidsInLoadOrder
>
const mockGetDeckConfigFromProtocolCommands = getDeckConfigFromProtocolCommands as jest.MockedFunction<
  typeof getDeckConfigFromProtocolCommands
>
const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>

const MOCK_WELL_FILL = { C1: '#ff4888', C2: '#ff4888' }

// const deckSlotsById = standardDeckDef.locations.orderedSlots.reduce(
//   (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
//   {}
// )

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const STUBBED_ORIENTATION_VALUE = 'left'
const MOCK_300_UL_TIPRACK_ID = '300_ul_tiprack_id'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_TC_COORDS = [20, 30, 0]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]
const MOCK_SECOND_MAGNETIC_MODULE_COORDS = [100, 200, 0]

const mockMagneticModule = {
  moduleId: 'someMagneticModule',
  model: 'magneticModuleV2' as ModuleModel,
  type: 'magneticModuleType' as ModuleType,
  labwareOffset: { x: 5, y: 5, z: 5 },
  cornerOffsetFromSlot: { x: 1, y: 1, z: 1 },
  calibrationPoint: { x: 0, y: 0 },
  displayName: 'Magnetic Module',
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
  quirks: [],
}

const mockLabwareLocations = [
  {
    labwareLocation: { slotName: 'C1' },
    definition: fixture_tiprack_300_ul as LabwareDefinition2,
    topLabwareId: '300_ul_tiprack_id',
    topLabwareDisplayName: 'fresh tips',
  },
]
const mockModuleLocations = [
  {
    moduleModel: 'magneticModuleV2',
    moduleLocation: { slotName: 'C1' },
    innerProps: {},
    nestedLabwareDef: null,
  },
  {
    moduleModel: 'magneticModuleV2',
    moduleLocation: { slotName: 'B1' },
    innerProps: {},
    nestedLabwareDef: null,
  },
]

const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleType,
}

const render = (props: React.ComponentProps<typeof SetupLiquidsMap>) => {
  return renderWithProviders(<SetupLiquidsMap {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SetupLiquidsMap', () => {
  let props: React.ComponentProps<typeof SetupLiquidsMap>
  beforeEach(() => {
    props = {
      runId: RUN_ID,
      robotName: ROBOT_NAME,
      protocolAnalysis: null,
    }
    when(mockInferModuleOrientationFromXCoordinate)
      .calledWith(expect.anything())
      .mockReturnValue(STUBBED_ORIENTATION_VALUE)
    when(mockLabwareRender)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareRender isn't called with expected labware definition
      .calledWith(
        partialComponentPropsMatcher({
          definition: fixture_tiprack_300_ul,
          wellFill: undefined,
        })
      )
      .mockReturnValue(
        <div>
          mock labware render of {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )
      .calledWith(
        partialComponentPropsMatcher({
          wellFill: { C1: '#ff4888', C2: '#ff4888' },
        })
      )
      .mockReturnValue(<div>mock labware render with well fill</div>)

    when(mockLabwareInfoOverlay)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareInfoOverlay isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({
          definition: fixture_tiprack_300_ul,
          labwareHasLiquid: false,
        })
      )
      .mockReturnValue(
        <div>
          mock labware info overlay of{' '}
          {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )
      .calledWith(partialComponentPropsMatcher({ labwareHasLiquid: true }))
      .mockReturnValue(<div>mock labware overlay with liquid</div>)

    // For BaseDeck
    when(mockParseInitialLoadedLabwareByAdapter)
      .calledWith(simpleAnalysisFileFixture.commands as any)
      .mockReturnValue({})
    when(mockParseLabwareInfoByLiquidId)
      .calledWith(simpleAnalysisFileFixture.commands as any)
      .mockReturnValue({})
    when(mockParseLiquidsInLoadOrder).calledWith(
      simpleAnalysisFileFixture.liquids as any,
      simpleAnalysisFileFixture.commands as any
    )
    when(mockGetDeckConfigFromProtocolCommands)
      .calledWith(simpleAnalysisFileFixture.commands as any)
      .mockReturnValue(EXTENDED_DECK_CONFIG_FIXTURE)
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: {
          pipettes: {},
          labware: {},
          modules: {
            heatershaker_id: {
              model: 'heaterShakerModuleV1',
            },
          },
          liquids: [
            {
              id: '1',
              displayName: 'mock liquid',
              description: '',
              displayColor: '#FFFFFF',
            },
          ],
          labwareDefinitions: {},
          commands: [],
          robotType: FLEX_ROBOT_TYPE,
        },
      } as any)
  })
  when(mockGetDeckDefFromRobotType)
    .calledWith(FLEX_ROBOT_TYPE)
    .mockReturnValue(ot3StandardDeckDef as any)
  when(mockGetLabwareRenderInfo)
    .calledWith(simpleAnalysisFileFixture as any, ot3StandardDeckDef as any)
    .mockReturnValue({
      [MOCK_300_UL_TIPRACK_ID]: {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: 'C1',
      },
    })

  // when(mockGetProtocolModulesInfo)
  //   .calledWith(simpleAnalysisFileFixture as any, ot3StandardDeckDef as any)
  //   .mockReturnValue(mockProtocolModuleInfo)
  mockGetProtocolModulesInfo.mockReturnValue(mockProtocolModuleInfo)
  when(mockGetAttachedProtocolModuleMatches)
    .calledWith(
      mockFetchModulesSuccessActionPayloadModules,
      mockProtocolModuleInfo
    )
    .mockReturnValue([
      {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareDisplayName: null,
        nestedLabwareId: null,
        slotName: 'C1',
        protocolLoadOrder: 1,
        attachedModuleMatch: null,
      },
      {
        moduleId: mockMagneticModule.moduleId,
        x: MOCK_SECOND_MAGNETIC_MODULE_COORDS[0],
        y: MOCK_SECOND_MAGNETIC_MODULE_COORDS[1],
        z: MOCK_SECOND_MAGNETIC_MODULE_COORDS[2],
        moduleDef: mockMagneticModule as any,
        nestedLabwareDef: null,
        nestedLabwareDisplayName: null,
        nestedLabwareId: null,
        slotName: 'B1',
        protocolLoadOrder: 0,
        attachedModuleMatch: null,
      },
    ])

  when(mockBaseDeck)
    .calledWith(
      partialComponentPropsMatcher({
        robotType: FLEX_ROBOT_TYPE,
        deckLayerBlocklist: getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE),
        deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
        labwareLocations: mockLabwareLocations,
        moduleLocations: mockModuleLocations,
      })
    )
    .mockReturnValue(<div>mock BaseDeck</div>)

  afterEach(() => {
    resetAllWhenMocks()
    jest.clearAllMocks()
  })

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({})
    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({})

    render(props)
    expect(mockModule).not.toHaveBeenCalled()
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })
  it('should render a deck WITH labware and WITHOUT modules', () => {
    props = {
      ...props,
      protocolAnalysis: simpleAnalysisFileFixture as any,
    }
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
          slotName: '1',
        },
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({})

    const [{ getByText }] = render(props)
    // expect(mockModule).not.toHaveBeenCalled()
    // expect(mockLabwareRender).toHaveBeenCalled()
    // expect(mockLabwareInfoOverlay).toHaveBeenCalled()
    // getByText('mock labware render of 300ul Tiprack FIXTURE')
    // getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
    getByText('mock BaseDeck')
  })

  it('should render a deck WITH labware and WITH modules', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        [MOCK_300_UL_TIPRACK_ID]: {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
          slotName: '1',
        },
      })

    when(mockUseModuleRenderInfoForProtocolById)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({
        [mockMagneticModule.moduleId]: {
          moduleId: mockMagneticModule.moduleId,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
          z: MOCK_MAGNETIC_MODULE_COORDS[2],
          moduleDef: mockMagneticModule as any,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
        },
        [mockTCModule.moduleId]: {
          moduleId: mockTCModule.moduleId,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          z: MOCK_TC_COORDS[2],
          moduleDef: mockTCModule,
          nestedLabwareDef: null,
          nestedLabwareId: null,
          protocolLoadOrder: 1,
          attachedModuleMatch: null,
        },
      } as any)

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockMagneticModule,
          x: MOCK_MAGNETIC_MODULE_COORDS[0],
          y: MOCK_MAGNETIC_MODULE_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockMagneticModule.type} </div>)

    when(mockModule)
      .calledWith(
        partialComponentPropsMatcher({
          def: mockTCModule,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
        })
      )
      .mockReturnValue(<div>mock module viz {mockTCModule.type} </div>)

    const [{ getByText }] = render(props)
    getByText('mock module viz magneticModuleType')
    getByText('mock module viz thermocyclerModuleType')
    getByText('mock labware render of 300ul Tiprack FIXTURE')
    getByText('mock labware info overlay of 300ul Tiprack FIXTURE')
  })
  it('should render labware overlay and labware render with liquids', () => {
    when(mockUseLabwareRenderInfoForRunById)
      .calledWith(RUN_ID)
      .mockReturnValue({
        '300_ul_tiprack_id': {
          labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
          displayName: 'fresh tips',
          x: MOCK_300_UL_TIPRACK_COORDS[0],
          y: MOCK_300_UL_TIPRACK_COORDS[1],
          z: MOCK_300_UL_TIPRACK_COORDS[2],
          slotName: '1',
        },
      })
    mockGetWellFillFromLabwareId.mockReturnValue(MOCK_WELL_FILL)
    const [{ getByText }] = render(props)
    getByText('mock labware overlay with liquid')
    getByText('mock labware render with well fill')
  })
})
