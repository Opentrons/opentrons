import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import {
  useAllCommandsQuery,
  useCommandQuery,
} from '@opentrons/react-api-client'
import {
  RUN_STATUS_IDLE,
  RUN_STATUS_RUNNING,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'

import { i18n } from '../../../i18n'
import { InterventionModal } from '../../InterventionModal'
import { ProgressBar } from '../../../atoms/ProgressBar'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { useMostRecentCompletedAnalysis } from '../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useNotifyLastRunCommandKey } from '../../../resources/runs/useNotifyLastRunCommandKey'
import { useDownloadRunLog } from '../../Devices/hooks'
import {
  mockUseAllCommandsResponseNonDeterministic,
  mockUseCommandResultNonDeterministic,
  NON_DETERMINISTIC_COMMAND_KEY,
} from '../__fixtures__'
import {
  mockMoveLabwareCommandFromSlot,
  mockPauseCommandWithStartTime,
  mockRunData,
} from '../../InterventionModal/__fixtures__'
import { RunProgressMeter } from '..'
import { useNotifyRunQuery } from '../../../resources/runs/useNotifyRunQuery'

jest.mock('@opentrons/react-api-client')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('../../../resources/runs/useNotifyLastRunCommandKey')
jest.mock('../../Devices/hooks')
jest.mock('../../../atoms/ProgressBar')
jest.mock('../../InterventionModal')
jest.mock('../../../resources/runs/useNotifyRunQuery')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockUseNotifyRunQuery = useNotifyRunQuery as jest.MockedFunction<
  typeof useNotifyRunQuery
>
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
const mockUseNotifyLastRunCommandKey = useNotifyLastRunCommandKey as jest.MockedFunction<
  typeof useNotifyLastRunCommandKey
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
      .calledWith(NON_DETERMINISTIC_RUN_ID, NON_DETERMINISTIC_COMMAND_KEY)
      .mockReturnValue(mockUseCommandResultNonDeterministic)
    mockUseDownloadRunLog.mockReturnValue({
      downloadRunLog: jest.fn(),
      isRunLogLoading: false,
    })
    when(mockUseNotifyLastRunCommandKey)
      .calledWith(NON_DETERMINISTIC_RUN_ID, { refetchInterval: 1000 })
      .mockReturnValue(NON_DETERMINISTIC_COMMAND_KEY)
    mockUseNotifyRunQuery.mockReturnValue({ data: null } as any)

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
    mockUseCommandQuery.mockReturnValue({ data: null } as any)
    const { getByText, queryByText } = render(props)
    expect(getByText('Current Step 42/?')).toBeTruthy()
    expect(queryByText('MOCK PROGRESS BAR')).toBeFalsy()
  })
  it('should give the correct info when run status is idle', () => {
    mockUseCommandQuery.mockReturnValue({ data: null } as any)
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
    mockUseNotifyRunQuery.mockReturnValue({
      data: { data: { labware: [] } },
    } as any)
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
    mockUseNotifyRunQuery.mockReturnValue({
      data: { data: mockRunData },
    } as any)
    mockUseCommandQuery.mockReturnValue({ data: null } as any)
    mockUseMostRecentCompletedAnalysis.mockReturnValue({} as any)
    const { findByText } = render(props)
    expect(await findByText('MOCK INTERVENTION MODAL')).toBeTruthy()
  })

  it('should render the correct run status when run status is completed', () => {
    mockUseCommandQuery.mockReturnValue({ data: null } as any)
    mockUseRunStatus.mockReturnValue(RUN_STATUS_SUCCEEDED)
    const { getByText } = render(props)
    getByText('Final Step 42/?')
  })
})
