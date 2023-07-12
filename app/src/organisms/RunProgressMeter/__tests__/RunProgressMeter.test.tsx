import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import {
  useAllCommandsQuery,
  useCommandQuery,
  useRunQuery,
} from '@opentrons/react-api-client'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { i18n } from '../../../i18n'
import { InterventionModal } from '../../InterventionModal'
import { ProgressBar } from '../../../atoms/ProgressBar'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useLastRunCommandKey } from '../../Devices/hooks/useLastRunCommandKey'
import { useDownloadRunLog } from '../../Devices/hooks'
import {
  mockUseAllCommandsResponseNonDeterministic,
  mockUseCommandResultNonDeterministic,
  NON_DETERMINISTIC_COMMAND_ID,
  NON_DETERMINISTIC_COMMAND_KEY,
} from '../__fixtures__'
import {
  mockMoveLabwareCommandFromSlot,
  mockPauseCommandWithStartTime,
  mockRunData,
} from '../../InterventionModal/__fixtures__'
import { RunProgressMeter } from '..'

jest.mock('@opentrons/react-api-client')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('../../Devices/hooks/useLastRunCommandKey')
jest.mock('../../Devices/hooks')
jest.mock('../../../atoms/ProgressBar')
jest.mock('../../InterventionModal')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseAllCommandsQuery = useAllCommandsQuery as jest.MockedFunction<
  typeof useAllCommandsQuery
>
const mockUseCommandQuery = useCommandQuery as jest.MockedFunction<
  typeof useCommandQuery
>
const mockUseDownloadRunLog = useDownloadRunLog as jest.MockedFunction<
  typeof useDownloadRunLog
>
const mockUseLastRunCommandKey = useLastRunCommandKey as jest.MockedFunction<
  typeof useLastRunCommandKey
>
const mockProgressBar = ProgressBar as jest.MockedFunction<typeof ProgressBar>
const mockInterventionModal = InterventionModal as jest.MockedFunction<
  typeof InterventionModal
>

const render = (props: React.ComponentProps<typeof RunProgressMeter>) => {
  return renderWithProviders(<RunProgressMeter {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const NON_DETERMINISTIC_RUN_ID = 'nonDeterministicID'
const ROBOT_NAME = 'otie'

describe('RunProgressMeter', () => {
  let props: React.ComponentProps<typeof RunProgressMeter>
  beforeEach(() => {
    mockProgressBar.mockReturnValue(<div>MOCK PROGRESS BAR</div>)
    mockInterventionModal.mockReturnValue(<div>MOCK INTERVENTION MODAL</div>)
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(NON_DETERMINISTIC_RUN_ID)
      .mockReturnValue(null)
    when(mockUseAllCommandsQuery)
      .calledWith(NON_DETERMINISTIC_RUN_ID, { cursor: null, pageLength: 1 })
      .mockReturnValue(mockUseAllCommandsResponseNonDeterministic)
    when(mockUseCommandQuery)
      .calledWith(NON_DETERMINISTIC_RUN_ID, NON_DETERMINISTIC_COMMAND_ID)
      .mockReturnValue(mockUseCommandResultNonDeterministic)
    mockUseDownloadRunLog.mockReturnValue({
      downloadRunLog: jest.fn(),
      isRunLogLoading: false,
    })
    when(mockUseLastRunCommandKey)
      .calledWith(NON_DETERMINISTIC_RUN_ID)
      .mockReturnValue(NON_DETERMINISTIC_COMMAND_KEY)
    mockUseRunQuery.mockReturnValue({ data: null } as any)

    props = {
      runId: NON_DETERMINISTIC_RUN_ID,
      robotName: ROBOT_NAME,
      makeHandleJumpToStep: jest.fn(),
      resumeRunHandler: jest.fn(),
    }
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('should show only the total count of commands in run and not show the meter when protocol is non-deterministic', () => {
    const { getByText, queryByText } = render(props)
    expect(getByText('Current Step 42/?')).toBeTruthy()
    expect(queryByText('MOCK PROGRESS BAR')).toBeFalsy()
  })
  it('should give the correct info when run status is idle', () => {
    mockUseRunStatus.mockReturnValue(RUN_STATUS_IDLE)
    const { getByText } = render(props)
    getByText('Current Step:')
    getByText('Not started yet')
    getByText('Download run log')
  })
  it('should render an intervention modal when lastRunCommand is a pause command', async () => {
    mockUseAllCommandsQuery.mockReturnValue({
      data: { data: [mockPauseCommandWithStartTime], meta: { totalLength: 1 } },
    } as any)
    mockUseRunQuery.mockReturnValue({ data: { data: { labware: [] } } } as any)
    mockUseCommandQuery.mockReturnValue({ data: null } as any)
    mockUseMostRecentCompletedAnalysis.mockReturnValue({} as any)
    const { findByText } = render(props)
    expect(await findByText('MOCK INTERVENTION MODAL')).toBeTruthy()
  })

  it('should render an intervention modal when lastRunCommand is a move labware command', async () => {
    mockUseAllCommandsQuery.mockReturnValue({
      data: {
        data: [mockMoveLabwareCommandFromSlot],
        meta: { totalLength: 1 },
      },
    } as any)
    mockUseRunQuery.mockReturnValue({ data: { data: mockRunData } } as any)
    mockUseCommandQuery.mockReturnValue({ data: null } as any)
    mockUseMostRecentCompletedAnalysis.mockReturnValue({} as any)
    const { findByText } = render(props)
    expect(await findByText('MOCK INTERVENTION MODAL')).toBeTruthy()
  })
})
