import * as React from 'react'
import { when } from 'vitest-when'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

import { useCommandQuery } from '@opentrons/react-api-client'
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
import {
  useNotifyRunQuery,
  useNotifyAllCommandsQuery,
} from '../../../resources/runs'
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
import { renderWithProviders } from '../../../__testing-utils__'
import { useLastRunCommand } from '../../Devices/hooks/useLastRunCommand'

import type { RunCommandSummary } from '@opentrons/api-client'
import type * as ApiClient from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()
  return {
    ...actual,
    useCommandQuery: vi.fn(),
  }
})
vi.mock('../../RunTimeControl/hooks')
vi.mock('../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../../../resources/runs')
vi.mock('../../Devices/hooks')
vi.mock('../../../atoms/ProgressBar')
vi.mock('../../InterventionModal')
vi.mock('../../Devices/hooks/useLastRunCommand')

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
    vi.mocked(ProgressBar).mockReturnValue(<div>MOCK PROGRESS BAR</div>)
    vi.mocked(InterventionModal).mockReturnValue(
      <div>MOCK INTERVENTION MODAL</div>
    )
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_RUNNING)
    when(useMostRecentCompletedAnalysis)
      .calledWith(NON_DETERMINISTIC_RUN_ID)
      .thenReturn(null)
    when(useNotifyAllCommandsQuery)
      .calledWith(NON_DETERMINISTIC_RUN_ID, { cursor: null, pageLength: 1 })
      .thenReturn(mockUseAllCommandsResponseNonDeterministic)
    when(useCommandQuery)
      .calledWith(NON_DETERMINISTIC_RUN_ID, NON_DETERMINISTIC_COMMAND_KEY)
      .thenReturn(mockUseCommandResultNonDeterministic)
    vi.mocked(useDownloadRunLog).mockReturnValue({
      downloadRunLog: vi.fn(),
      isRunLogLoading: false,
    })
    when(useLastRunCommand)
      .calledWith(NON_DETERMINISTIC_RUN_ID, { refetchInterval: 1000 })
      .thenReturn({ key: NON_DETERMINISTIC_COMMAND_KEY } as RunCommandSummary)

    vi.mocked(useNotifyRunQuery).mockReturnValue({ data: null } as any)

    props = {
      runId: NON_DETERMINISTIC_RUN_ID,
      robotName: ROBOT_NAME,
      makeHandleJumpToStep: vi.fn(),
      resumeRunHandler: vi.fn(),
    }
  })

  it('should show only the total count of commands in run and not show the meter when protocol is non-deterministic', () => {
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)
    render(props)
    expect(screen.getByText('Current Step 42/?')).toBeTruthy()
    expect(screen.queryByText('MOCK PROGRESS BAR')).toBeFalsy()
  })
  it('should give the correct info when run status is idle', () => {
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_IDLE)
    render(props)
    screen.getByText('Current Step:')
    screen.getByText('Not started yet')
    screen.getByText('Download run log')
  })
  it('should render an intervention modal when lastRunCommand is a pause command', () => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      data: { data: [mockPauseCommandWithStartTime], meta: { totalLength: 1 } },
    } as any)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: { labware: [] } },
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({} as any)
    render(props)
  })

  it('should render an intervention modal when lastRunCommand is a move labware command', () => {
    vi.mocked(useNotifyAllCommandsQuery).mockReturnValue({
      data: {
        data: [mockMoveLabwareCommandFromSlot],
        meta: { totalLength: 1 },
      },
    } as any)
    vi.mocked(useNotifyRunQuery).mockReturnValue({
      data: { data: mockRunData },
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({} as any)
    render(props)
  })

  it('should render the correct run status when run status is completed', () => {
    vi.mocked(useCommandQuery).mockReturnValue({ data: null } as any)
    vi.mocked(useRunStatus).mockReturnValue(RUN_STATUS_SUCCEEDED)
    render(props)
    screen.getByText('Final Step 42/?')
  })
})
