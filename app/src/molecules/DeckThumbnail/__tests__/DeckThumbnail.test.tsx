import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import ot2StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  BaseDeck,
  EXTENDED_DECK_CONFIG_FIXTURE,
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import {
  parseInitialLoadedLabwareByAdapter,
  parseLabwareInfoByLiquidId,
  simpleAnalysisFileFixture,
} from '@opentrons/api-client'

import { i18n } from '../../../i18n'
import { useAttachedModules } from '../../../organisms/Devices/hooks'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { getDeckConfigFromProtocolCommands } from '../../../resources/deck_configuration/utils'
import { getAttachedProtocolModuleMatches } from '../../../organisms/ProtocolSetupModulesAndDeck/utils'
import { getProtocolModulesInfo } from '../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { getLabwareRenderInfo } from '../../../organisms/Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { mockProtocolModuleInfo } from '../../../organisms/ProtocolSetupLabware/__fixtures__'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../redux/modules/__fixtures__'
import { DeckThumbnail } from '../'

import type {
  LabwareDefinition2,
  LoadedLabware,
  ModuleModel,
  ModuleType,
  RunTimeCommand,
} from '@opentrons/shared-data'

jest.mock('@opentrons/components/src/hardware-sim/BaseDeck')
jest.mock('@opentrons/api-client')
jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../../redux/config')
jest.mock('../../../resources/deck_configuration/utils')
jest.mock('../../../organisms/ProtocolSetupModulesAndDeck/utils')
jest.mock('../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo')
jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../organisms/Devices/ProtocolRun/utils/getLabwareRenderInfo')

const mockGetRobotTypeFromLoadedLabware = getRobotTypeFromLoadedLabware as jest.MockedFunction<
  typeof getRobotTypeFromLoadedLabware
>

const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockParseInitialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter as jest.MockedFunction<
  typeof parseInitialLoadedLabwareByAdapter
>
const mockParseLabwareInfoByLiquidId = parseLabwareInfoByLiquidId as jest.MockedFunction<
  typeof parseLabwareInfoByLiquidId
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockGetDeckConfigFromProtocolCommands = getDeckConfigFromProtocolCommands as jest.MockedFunction<
  typeof getDeckConfigFromProtocolCommands
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
const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>

const protocolAnalysis = simpleAnalysisFileFixture as any
const commands: RunTimeCommand[] = simpleAnalysisFileFixture.commands as any
const labware: LoadedLabware[] = simpleAnalysisFileFixture.labware as any
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
  dimensions: {
    xDimension: 100,
    yDimension: 100,
    footprintXDimension: 50,
    footprintYDimension: 50,
    labwareInterfaceXDimension: 80,
    labwareInterfaceYDimension: 120,
  },
  twoDimensionalRendering: { children: [] },
}

const render = (props: React.ComponentProps<typeof DeckThumbnail>) => {
  return renderWithProviders(<DeckThumbnail {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('DeckThumbnail', () => {
  beforeEach(() => {
    when(mockGetRobotTypeFromLoadedLabware)
      .calledWith(labware)
      .mockReturnValue(OT2_ROBOT_TYPE)
    when(mockGetDeckDefFromRobotType)
      .calledWith(OT2_ROBOT_TYPE)
      .mockReturnValue(ot2StandardDeckDef as any)
    when(mockParseInitialLoadedLabwareByAdapter)
      .calledWith(commands)
      .mockReturnValue({})
    when(mockParseLabwareInfoByLiquidId)
      .calledWith(commands)
      .mockReturnValue({})
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    when(mockGetDeckConfigFromProtocolCommands)
      .calledWith(commands)
      .mockReturnValue(EXTENDED_DECK_CONFIG_FIXTURE)
    when(mockGetLabwareRenderInfo).mockReturnValue({})
    when(mockGetProtocolModulesInfo)
      .calledWith(protocolAnalysis, ot2StandardDeckDef as any)
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
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.clearAllMocks()
  })

  it('renders an OT-2 deck view when the protocol is an OT-2 protocol', () => {
    const { getByText } = render({
      protocolAnalysis: protocolAnalysis,
    })
    getByText('mock BaseDeck')
  })

  it('renders an OT-3 deck view when the protocol is an OT-3 protocol', () => {
    // ToDo (kk:11/06/2023) update this test later
    // const mockLabwareLocations = [
    //   {
    //     labwareLocation: { slotName: 'C1' },
    //     definition: fixture_tiprack_300_ul as LabwareDefinition2,
    //     topLabwareId: '300_ul_tiprack_id',
    //     topLabwareDisplayName: 'fresh tips',
    //   },
    // ]
    // const mockModuleLocations = [
    //   {
    //     moduleModel: 'magneticModuleV2',
    //     moduleLocation: { slotName: 'C1' },
    //     innerProps: {},
    //     nestedLabwareDef: null,
    //   },
    //   {
    //     moduleModel: 'magneticModuleV2',
    //     moduleLocation: { slotName: 'B1' },
    //     innerProps: {},
    //     nestedLabwareDef: null,
    //   },
    // ]
    when(mockGetRobotTypeFromLoadedLabware)
      .calledWith(labware)
      .mockReturnValue(FLEX_ROBOT_TYPE)
    when(mockGetDeckDefFromRobotType)
      .calledWith(FLEX_ROBOT_TYPE)
      .mockReturnValue(ot3StandardDeckDef as any)
    when(mockParseInitialLoadedLabwareByAdapter)
      .calledWith(commands)
      .mockReturnValue({})
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    when(mockGetDeckConfigFromProtocolCommands)
      .calledWith(commands)
      .mockReturnValue(EXTENDED_DECK_CONFIG_FIXTURE)
    when(mockGetLabwareRenderInfo).mockReturnValue({
      [MOCK_300_UL_TIPRACK_ID]: {
        labwareDef: fixture_tiprack_300_ul as LabwareDefinition2,
        displayName: 'fresh tips',
        x: MOCK_300_UL_TIPRACK_COORDS[0],
        y: MOCK_300_UL_TIPRACK_COORDS[1],
        z: MOCK_300_UL_TIPRACK_COORDS[2],
        slotName: 'C1',
      },
    })
    when(mockGetProtocolModulesInfo)
      .calledWith(protocolAnalysis, ot3StandardDeckDef as any)
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
          robotType: FLEX_ROBOT_TYPE,
          deckLayerBlocklist: getStandardDeckViewLayerBlockList(
            FLEX_ROBOT_TYPE
          ),
          deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
          labwareLocations: expect.anything(),
          moduleLocations: expect.anything(),
        })
      )
      .mockReturnValue(<div>mock BaseDeck</div>)

    const { getByText } = render({
      protocolAnalysis: protocolAnalysis,
    })
    getByText('mock BaseDeck')
  })
})
