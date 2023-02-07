import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import {
  useAttachedModules,
  useRunCreatedAtTimestamp,
  useUnmatchedModulesForProtocol,
} from '../../../organisms/Devices/hooks'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ConfirmCancelModal } from '../../../organisms/RunDetails/ConfirmCancelModal'
import {
  useRunControls,
  useRunStatus,
} from '../../../organisms/RunTimeControl/hooks'
import { getLocalRobot } from '../../../redux/discovery'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { ProtocolSetup } from '../ProtocolSetup'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { State } from '../../../redux/types'

jest.mock('../../../organisms/Devices/hooks')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)
jest.mock('../../../organisms/RunDetails/ConfirmCancelModal')
jest.mock('../../../organisms/RunTimeControl/hooks')
jest.mock('../../../redux/discovery')

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseRunCreatedAtTimestamp = useRunCreatedAtTimestamp as jest.MockedFunction<
  typeof useRunCreatedAtTimestamp
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockConfirmCancelModal = ConfirmCancelModal as jest.MockedFunction<
  typeof ConfirmCancelModal
>
const mockUseRunControls = useRunControls as jest.MockedFunction<
  typeof useRunControls
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <Route path="/protocols/:runId/setup/">
        <ProtocolSetup />
      </Route>
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const RUN_ID = 'my-run-id'
const CREATED_AT = 'top of the hour'

const mockPlay = jest.fn()

describe('ProtocolSetup', () => {
  beforeEach(() => {
    when(mockUseAttachedModules).calledWith().mockReturnValue([])
    when(mockGetLocalRobot)
      .calledWith({} as State)
      .mockReturnValue(mockConnectedRobot)
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(mockConnectedRobot.name, RUN_ID)
      .mockReturnValue({
        missingModuleIds: [],
        remainingAttachedModules: [],
      })
    mockConfirmCancelModal.mockReturnValue(<div>Mock ConfirmCancelModal</div>)
    when(mockUseRunControls)
      .calledWith(RUN_ID)
      .mockReturnValue({
        play: mockPlay,
        pause: () => {},
        stop: () => {},
        reset: () => {},
        isPlayRunActionLoading: false,
        isPauseRunActionLoading: false,
        isStopRunActionLoading: false,
        isResetRunLoading: false,
      })
    when(mockUseRunStatus).calledWith(RUN_ID).mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(({
        modules: [],
        labware: [],
      } as unknown) as CompletedProtocolAnalysis)
    when(mockUseRunCreatedAtTimestamp)
      .calledWith(RUN_ID)
      .mockReturnValue(CREATED_AT)
  })

  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('should render text, image, and buttons', () => {
    const [{ getByText }] = render(`/protocols/${RUN_ID}/setup/`)
    getByText('Prepare to Run')
    getByText(`Run: ${CREATED_AT}`)
    getByText(`Status: ${RUN_STATUS_IDLE}`)
    getByText('Instruments')
    getByText('Labware')
    getByText('Labware Position Check')
    getByText('Liquids')
  })

  it('should play protocol when click play button', () => {
    const [{ getByRole }] = render(`/protocols/${RUN_ID}/setup/`)
    expect(mockPlay).toBeCalledTimes(0)
    getByRole('button', { name: 'play' }).click()
    expect(mockPlay).toBeCalledTimes(1)
  })

  it('should launch cancel modal when click close button', () => {
    const [{ getByRole, getByText, queryByText }] = render(
      `/protocols/${RUN_ID}/setup/`
    )
    expect(queryByText('Mock ConfirmCancelModal')).toBeNull()
    getByRole('button', { name: 'close' }).click()
    getByText('Mock ConfirmCancelModal')
  })
})
