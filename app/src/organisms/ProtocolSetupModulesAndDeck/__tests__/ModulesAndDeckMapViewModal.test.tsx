import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  renderWithProviders,
  BaseDeck,
  RobotWorkSpace,
  EXTENDED_DECK_CONFIG_FIXTURE,
} from '@opentrons/components'
// import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
// import { parseInitialLoadedLabwareByAdapter } from '@opentrons/api-client'

import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import { getDeckConfigFromProtocolCommands } from '../../../resources/deck_configuration/utils'
// import { getStandardDeckViewLayerBlockList } from '../../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'
import { ModulesAndDeckMapViewModal } from '../ModulesAndDeckMapViewModal'

jest.mock('@opentrons/components/src/hardware-sim/BaseDeck')
jest.mock('@opentrons/components/src/hardware-sim/Deck/RobotWorkSpace')
jest.mock('@opentrons/api-client')
jest.mock('../../../redux/config')
jest.mock('../../Devices/hooks')
jest.mock('../../../resources/deck_configuration/utils')
jest.mock('../../Devices/ModuleInfo')
jest.mock('../../Devices/ProtocolRun/utils/getLabwareRenderInfo')

const mockRunId = 'mockRunId'
const mockSetShowDeckMapModal = jest.fn()
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
} as any

// const mockModuleLocations = [
//   {
//     moduleModel: 'heaterShakerModuleV1' as ModuleModel,
//     moduleLocation: { slotName: 'B1' },
//     nestedLabwareDef: mockProtocolModuleInfo[0]
//       .nestedLabwareDef as LabwareDefinition2,
//     onLabwareClick: expect.any(Function),
//     moduleChildren: null,
//     innerProps: {},
//   },
// ]

const mockAttachedProtocolModuleMatches = [
  {
    moduleId: 'mockModuleId',
    x: 328,
    y: 107,
    z: 0,
    moduleDef: {
      $otSharedSchema: 'module/schemas/3',
      moduleType: 'magneticBlockType',
      model: 'magneticBlockV1',
      labwareOffset: {
        x: 0,
        y: 0,
        z: 38,
      },
      dimensions: {
        bareOverallHeight: 45,
        overLabwareHeight: 0,
        xDimension: 136,
        yDimension: 94,
        footprintXDimension: 127.75,
        footprintYDimension: 85.75,
        labwareInterfaceXDimension: 128,
        labwareInterfaceYDimension: 86,
      },
      cornerOffsetFromSlot: {
        x: -4.125,
        y: -4.125,
        z: 0,
      },
      calibrationPoint: {
        x: 0,
        y: 0,
        z: 0,
      },
      config: {},
      gripperOffsets: {},
      displayName: 'Magnetic Block GEN1',
      quirks: [],
      slotTransforms: {
        ot2_standard: {},
        ot2_short_trash: {},
        ot3_standard: {},
      },
      compatibleWith: [],
      twoDimensionalRendering: {},
    },
    nestedLabwareDef: null,
    nestedLabwareDisplayName: null,
    nestedLabwareId: null,
    protocolLoadOrder: 0,
    slotName: 'C3',
    attachedModuleMatch: null,
  },
] as any

const render = (
  props: React.ComponentProps<typeof ModulesAndDeckMapViewModal>
) => {
  return renderWithProviders(<ModulesAndDeckMapViewModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>
const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockGetDeckConfigFromProtocolCommands = getDeckConfigFromProtocolCommands as jest.MockedFunction<
  typeof getDeckConfigFromProtocolCommands
>

describe('ModulesAndDeckMapViewModal', () => {
  let props: React.ComponentProps<typeof ModulesAndDeckMapViewModal>

  beforeEach(() => {
    props = {
      setShowDeckMapModal: mockSetShowDeckMapModal,
      attachedProtocolModuleMatches: mockAttachedProtocolModuleMatches,
      deckDef: {} as any,
      runId: mockRunId,
      mostRecentAnalysis: PROTOCOL_ANALYSIS,
    }
    when(mockUseFeatureFlag)
      .calledWith('enableDeckConfiguration')
      .mockReturnValue(true)
    when(mockGetDeckConfigFromProtocolCommands).mockReturnValue(
      EXTENDED_DECK_CONFIG_FIXTURE
    )

    // when(mockBaseDeck)
    //   .calledWith({
    //     deckLayerBlocklist: getStandardDeckViewLayerBlockList(FLEX_ROBOT_TYPE),
    //     deckConfig: EXTENDED_DECK_CONFIG_FIXTURE,
    //     robotType: FLEX_ROBOT_TYPE,
    //     labwareLocations: [],
    //     moduleLocations: mockModuleLocations,
    //   })
    //   .mockReturnValue(<div>mock BaseDeck</div>)
    mockBaseDeck.mockReturnValue(<div>mock BaseDeck</div>)
    mockRobotWorkSpace.mockReturnValue(<div>mock RobotWorkSpace</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render map view when ff is on', () => {
    const { getByText } = render(props)
    getByText('Map View')
    getByText('mock BaseDeck')
  })

  it('should render map view when ff is off', () => {
    when(mockUseFeatureFlag)
      .calledWith('enableDeckConfiguration')
      .mockReturnValue(false)
    const { getByText } = render(props)
    getByText('Map View')
    getByText('mock RobotWorkSpace')
  })
})
