import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { i18n } from '../../../../../i18n'
import {
  BaseDeck,
  renderWithProviders,
  partialComponentPropsMatcher,
  LabwareRender,
  EXTENDED_DECK_CONFIG_FIXTURE,
} from '@opentrons/components'

import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  parseInitialLoadedLabwareByAdapter,
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
  simpleAnalysisFileFixture,
} from '@opentrons/api-client'
import ot2StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'

import { useAttachedModules } from '../../../hooks'
import { LabwareInfoOverlay } from '../../LabwareInfoOverlay'
import { getLabwareRenderInfo } from '../../utils/getLabwareRenderInfo'
import { getStandardDeckViewLayerBlockList } from '../../utils/getStandardDeckViewLayerBlockList'
import { getAttachedProtocolModuleMatches } from '../../../../ProtocolSetupModulesAndDeck/utils'
import { getProtocolModulesInfo } from '../../utils/getProtocolModulesInfo'
import { getDeckConfigFromProtocolCommands } from '../../../../../resources/deck_configuration/utils'
import { mockProtocolModuleInfo } from '../../../../ProtocolSetupLabware/__fixtures__'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../../../redux/modules/__fixtures__'

import { SetupLiquidsMap } from '../SetupLiquidsMap'

import type {
  ModuleModel,
  ModuleType,
  RunTimeCommand,
  LabwareDefinition2,
} from '@opentrons/shared-data'

jest.mock('@opentrons/components', () => {
  const actualComponents = jest.requireActual('@opentrons/components')
  return {
    ...actualComponents,
    LabwareRender: jest.fn(() => <div>mock LabwareRender</div>),
  }
})

jest.mock('@opentrons/components/src/hardware-sim/BaseDeck')
jest.mock('@opentrons/api-client')
jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../LabwareInfoOverlay')
jest.mock('../../../hooks')
jest.mock('../utils')
jest.mock('../../utils/getLabwareRenderInfo')
jest.mock('../../../../ProtocolSetupModulesAndDeck/utils')
jest.mock('../../utils/getProtocolModulesInfo')
jest.mock('../../../../../resources/deck_configuration/utils')

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockLabwareInfoOverlay = LabwareInfoOverlay as jest.MockedFunction<
  typeof LabwareInfoOverlay
>
const mockLabwareRender = LabwareRender as jest.MockedFunction<
  typeof LabwareRender
>
const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>
const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockGetRobotTypeFromLoadedLabware = getRobotTypeFromLoadedLabware as jest.MockedFunction<
  typeof getRobotTypeFromLoadedLabware
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
const mockGetLabwareRenderInfo = getLabwareRenderInfo as jest.MockedFunction<
  typeof getLabwareRenderInfo
>
const mockGetAttachedProtocolModuleMatches = getAttachedProtocolModuleMatches as jest.MockedFunction<
  typeof getAttachedProtocolModuleMatches
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockGetDeckConfigFromProtocolCommands = getDeckConfigFromProtocolCommands as jest.MockedFunction<
  typeof getDeckConfigFromProtocolCommands
>

const RUN_ID = '1'
const MOCK_300_UL_TIPRACK_ID = '300_ul_tiprack_id'
const MOCK_MAGNETIC_MODULE_COORDS = [10, 20, 0]
const MOCK_SECOND_MAGNETIC_MODULE_COORDS = [100, 200, 0]
const MOCK_300_UL_TIPRACK_COORDS = [30, 40, 0]

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
      protocolAnalysis: simpleAnalysisFileFixture as any,
    }
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
    when(mockUseAttachedModules).calledWith().mockReturnValue([])
    when(mockGetAttachedProtocolModuleMatches).mockReturnValue([])
    when(mockGetLabwareRenderInfo)
      .calledWith(simpleAnalysisFileFixture as any, ot2StandardDeckDef as any)
      .mockReturnValue({})
    when(mockGetDeckConfigFromProtocolCommands)
      .calledWith(simpleAnalysisFileFixture.commands as RunTimeCommand[])
      .mockReturnValue(EXTENDED_DECK_CONFIG_FIXTURE)
    when(mockGetRobotTypeFromLoadedLabware)
      .calledWith(simpleAnalysisFileFixture.labware as any)
      .mockReturnValue(FLEX_ROBOT_TYPE)
    when(mockParseLiquidsInLoadOrder)
      .calledWith(
        simpleAnalysisFileFixture.liquids as any,
        simpleAnalysisFileFixture.commands as any
      )
      .mockReturnValue([])
    when(mockParseInitialLoadedLabwareByAdapter)
      .calledWith(simpleAnalysisFileFixture.commands as any)
      .mockReturnValue({})
    when(mockLabwareInfoOverlay)
      .mockReturnValue(<div></div>) // this (default) empty div will be returned when LabwareInfoOverlay isn't called with expected props
      .calledWith(
        partialComponentPropsMatcher({ definition: fixture_tiprack_300_ul })
      )
      .mockReturnValue(
        <div>
          mock labware info overlay of{' '}
          {fixture_tiprack_300_ul.metadata.displayName}
        </div>
      )
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  it('should render a deck WITHOUT labware and WITHOUT modules', () => {
    props = {
      ...props,
      protocolAnalysis: null,
    }
    render(props)
    expect(mockLabwareRender).not.toHaveBeenCalled()
    expect(mockLabwareInfoOverlay).not.toHaveBeenCalled()
  })

  it('should render base deck - robot type is OT-2', () => {
    when(mockGetRobotTypeFromLoadedLabware)
      .calledWith(simpleAnalysisFileFixture.labware as any)
      .mockReturnValue(OT2_ROBOT_TYPE)
    when(mockGetDeckDefFromRobotType)
      .calledWith(OT2_ROBOT_TYPE)
      .mockReturnValue(ot2StandardDeckDef as any)
    when(mockParseLabwareInfoByLiquidId)
      .calledWith(simpleAnalysisFileFixture.commands as any)
      .mockReturnValue({})
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    when(mockGetLabwareRenderInfo).mockReturnValue({})
    when(mockGetProtocolModulesInfo)
      .calledWith(simpleAnalysisFileFixture as any, ot2StandardDeckDef as any)
      .mockReturnValue(mockProtocolModuleInfo)
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
          slotName: '1',
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
          slotName: '2',
          protocolLoadOrder: 0,
          attachedModuleMatch: null,
        },
      ])

    when(mockBaseDeck)
      .calledWith(
        partialComponentPropsMatcher({
          robotType: OT2_ROBOT_TYPE,
          deckLayerBlocklist: getStandardDeckViewLayerBlockList(OT2_ROBOT_TYPE),
        })
      )
      .mockReturnValue(<div>mock BaseDeck</div>)
    const [{ getByText }] = render(props)
    getByText('mock BaseDeck')
  })

  it('should render base deck - robot type is Flex', () => {
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

    when(mockParseLabwareInfoByLiquidId)
      .calledWith(simpleAnalysisFileFixture.commands as any)
      .mockReturnValue({})
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )

    when(mockGetProtocolModulesInfo)
      .calledWith(simpleAnalysisFileFixture as any, ot3StandardDeckDef as any)
      .mockReturnValue(mockProtocolModuleInfo)
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
          deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
          deckLayerBlocklist: getStandardDeckViewLayerBlockList(
            FLEX_ROBOT_TYPE
          ),
          robotType: FLEX_ROBOT_TYPE,
          // ToDo (kk:11/03/2023) Update the following part later
          labwareLocations: expect.anything(),
          moduleLocations: expect.anything(),
        })
      )
      .mockReturnValue(<div>mock BaseDeck</div>)
    const [{ getByText }] = render(props)
    getByText('mock BaseDeck')
  })

  // ToDo (kk:11/03/2023)
  // The current component implementation is tough to test everything.
  // I will do refactoring later and add tests to cover more cases.
  // Probably I will replace BaseDeck's children with a new component and write test for that.
  it.todo('should render labware overlay and labware render with liquids')
})
