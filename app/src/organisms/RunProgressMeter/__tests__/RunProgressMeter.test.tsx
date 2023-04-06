import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import {
  useAllCommandsQuery,
  useCommandQuery,
} from '@opentrons/react-api-client'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { i18n } from '../../../i18n'
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
import { RunProgressMeter } from '..'

jest.mock('@opentrons/react-api-client')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('../../Devices/hooks/useLastRunCommandKey')
jest.mock('../../Devices/hooks')
jest.mock('../../../atoms/ProgressBar')

const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
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
const mockUseLastRunCommandKey = useLastRunCommandKey as jest.MockedFunction<
  typeof useLastRunCommandKey
>
const mockProgressBar = ProgressBar as jest.MockedFunction<typeof ProgressBar>

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
    mockUseRunStatus.mockReturnValue(RUN_STATUS_RUNNING)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(NON_DETERMINISTIC_RUN_ID)
      .mockReturnValue(null)
    when(mockUseAllCommandsQuery)
      .calledWith(NON_DETERMINISTIC_RUN_ID)
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

    props = {
      runId: NON_DETERMINISTIC_RUN_ID,
      robotName: ROBOT_NAME,
      makeHandleJumpToStep: jest.fn(),
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
})
