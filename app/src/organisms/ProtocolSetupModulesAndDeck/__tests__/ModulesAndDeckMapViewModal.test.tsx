import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  renderWithProviders,
  BaseDeck,
  RobotWorkSpace,
  EXTENDED_DECK_CONFIG_FIXTURE,
} from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useFeatureFlag } from '../../../redux/config'
import { useStoredProtocolAnalysis } from '../../Devices/hooks'
import { getDeckConfigFromProtocolCommands } from '../../../resources/deck_configuration/utils'
import _uncastedSimpleV7Protocol from '@opentrons/shared-data/protocol/fixtures/7/simpleV7.json'
import { ModulesAndDeckMapViewModal } from '../ModulesAndDeckMapViewModal'

import type {
  DeckDefinition,
  ProtocolAnalysisOutput,
  ModuleModel,
  ModuleType,
  RunTimeCommand,
} from '@opentrons/shared-data'

jest.mock('@opentrons/components')
jest.mock('../../../redux/config')
jest.mock('../../Devices/hooks')
jest.mock('../../../resources/deck_configuration/utils')

const render = (
  props: React.ComponentProps<typeof ModulesAndDeckMapViewModal>
) => {
  return renderWithProviders(<ModulesAndDeckMapViewModal {...props} />, {
    i18nInstance: i18n,
  })
}

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockRobotWorkSpace = RobotWorkSpace as jest.MockedFunction<
  typeof RobotWorkSpace
>
const mockBaseDeck = BaseDeck as jest.MockedFunction<typeof BaseDeck>
const mockUseStoredProtocolAnalysis = useStoredProtocolAnalysis as jest.MockedFunction<
  typeof useStoredProtocolAnalysis
>
const mockGetDeckConfigFromProtocolCommands = getDeckConfigFromProtocolCommands as jest.MockedFunction<
  typeof getDeckConfigFromProtocolCommands
>

const mockRunId = 'mockRunId'
const mockSetShowDeckMapModal = jest.fn()
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
} as any
const simpleV7Protocol = (_uncastedSimpleV7Protocol as unknown) as ProtocolAnalysisOutput

describe('ModulesAndDeckMapViewModal', () => {
  let props: React.ComponentProps<typeof ModulesAndDeckMapViewModal>

  beforeEach(() => {
    props = {
      setShowDeckMapModal: mockSetShowDeckMapModal,
      attachedProtocolModuleMatches: [] as any,
      deckDef: {} as any,
      runId: mockRunId,
      mostRecentAnalysis: PROTOCOL_ANALYSIS,
    }
    when(mockUseFeatureFlag)
      .calledWith('enableDeckConfiguration')
      .mockReturnValue(true)
    // mockRobotWorkSpace.mockReturnValue(<div>mock RobotWorkSpace</div>)
    mockBaseDeck.mockReturnValue(<div>mock BaseDeck</div>)
    mockUseStoredProtocolAnalysis.mockReturnValue(
      (simpleV7Protocol as unknown) as ProtocolAnalysisOutput
    )
    when(mockGetDeckConfigFromProtocolCommands)
      .calledWith([] as RunTimeCommand[])
      .mockReturnValue(EXTENDED_DECK_CONFIG_FIXTURE)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  // it('should render map view when ff is off', () => {
  //   const [{ getByText }] = render(props)
  //   getByText('Map view').click()
  //   getByText('mock RobotWorkSpace')
  // })

  it('should render map view when ff is on', () => {
    const [{ getByText }] = render(props)
    getByText('Map view').click()
    getByText('mock mock BaseDeck')
  })
})
