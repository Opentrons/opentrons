import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import ot3StandardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot3_standard.json'

import { i18n } from '../../../i18n'
import { mockRobotSideAnalysis } from '../../../organisms/CommandText/__fixtures__'
import { useAttachedModules } from '../../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { getProtocolModulesInfo } from '../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import {
  getAttachedProtocolModuleMatches,
  getUnmatchedModulesForProtocol,
} from '../utils'
import { SetupInstructionsModal } from '../SetupInstructionsModal'
import { ProtocolSetupModules } from '..'

jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../../organisms/Devices/hooks')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo')
jest.mock('../utils')
jest.mock('../SetupInstructionsModal')

const mockGetDeckDefFromRobotType = getDeckDefFromRobotType as jest.MockedFunction<
  typeof getDeckDefFromRobotType
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>
const mockGetAttachedProtocolModuleMatches = getAttachedProtocolModuleMatches as jest.MockedFunction<
  typeof getAttachedProtocolModuleMatches
>
const mockGetUnmatchedModulesForProtocol = getUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof getUnmatchedModulesForProtocol
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockSetupInstructionsModal = SetupInstructionsModal as jest.MockedFunction<
  typeof SetupInstructionsModal
>

const RUN_ID = "otie's run"
const mockSetSetupScreen = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolSetupModules
        runId={RUN_ID}
        setSetupScreen={mockSetSetupScreen}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolSetupModules', () => {
  beforeEach(() => {
    when(mockUseAttachedModules).calledWith().mockReturnValue([])
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRobotSideAnalysis)
    when(mockGetProtocolModulesInfo)
      .calledWith(mockRobotSideAnalysis, ot3StandardDeckDef as any)
      .mockReturnValue([])
    when(mockGetAttachedProtocolModuleMatches)
      .calledWith([], [])
      .mockReturnValue([])
    when(mockGetUnmatchedModulesForProtocol)
      .calledWith([], [])
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    when(mockGetDeckDefFromRobotType)
      .calledWith('OT-3 Standard')
      .mockReturnValue(ot3StandardDeckDef as any)
    mockSetupInstructionsModal.mockReturnValue(
      <div>mock SetupInstructionsModal</div>
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render text and buttons', () => {
    const [{ getByRole, getByText }] = render()
    getByText('Module Name')
    getByText('Location')
    getByText('Status')
    getByText('Setup Instructions')
    getByRole('button', { name: 'Map View' })
  })

  it('should launch deck map on button click', () => {
    const [{ getByRole }] = render()

    getByRole('button', { name: 'Map View' }).click()
  })

  it('should launch setup instructions modal on button click', () => {
    const [{ getByText }] = render()

    getByText('Setup Instructions').click()
    getByText('mock SetupInstructionsModal')
  })
})
