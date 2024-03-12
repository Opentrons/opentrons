import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { useNotifyAllRunsQuery } from '../../../resources/runs'
import { i18n } from '../../../i18n'
import { useIsRobotViewable, useRunStatuses } from '../hooks'
import { RecentProtocolRuns } from '../RecentProtocolRuns'
import { HistoricalProtocolRun } from '../HistoricalProtocolRun'

import type { Runs } from '@opentrons/api-client'
import type { AxiosError } from 'axios'

vi.mock('../../../resources/runs')
vi.mock('../hooks')
vi.mock('../../ProtocolUpload/hooks')
vi.mock('../HistoricalProtocolRun')

const render = () => {
  return renderWithProviders(<RecentProtocolRuns robotName="otie" />, {
    i18nInstance: i18n,
  })
}

describe('RecentProtocolRuns', () => {
  beforeEach(() => {
    vi.mocked(useRunStatuses).mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })
    vi.mocked(HistoricalProtocolRun).mockReturnValue(
      <div>mock HistoricalProtocolRun</div>
    )
  })

  it('renders an empty state message when robot is not on the network', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(false)
    render()

    screen.getByText('Robot must be on the network to see protocol runs')
  })
  it('renders an empty state message when there are no runs', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {},
    } as UseQueryResult<Runs, AxiosError>)
    render()

    screen.getByText('No protocol runs yet!')
  })
  it('renders table headers if there are runs', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: {
        data: [
          {
            createdAt: '2022-05-04T18:24:40.833862+00:00',
            current: false,
            id: 'test_id',
            protocolId: 'test_protocol_id',
            status: 'succeeded',
          },
        ],
      },
    } as UseQueryResult<Runs, AxiosError>)
    render()
    screen.getByText('Recent Protocol Runs')
    screen.getByText('Run')
    screen.getByText('Protocol')
    screen.getByText('Status')
    screen.getByText('Run duration')
    screen.getByText('mock HistoricalProtocolRun')
  })
})
