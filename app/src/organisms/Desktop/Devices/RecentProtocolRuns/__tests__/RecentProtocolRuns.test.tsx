import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useIsRobotViewable } from '/app/redux-resources/robots'
import { useNotifyAllRunsQuery, useRunStatuses } from '/app/resources/runs'

import { RecentProtocolRuns } from '../../RecentProtocolRuns'
import { HistoricalProtocolRun } from '../HistoricalProtocolRun'

import type { AxiosError } from 'axios'
import type { UseQueryResult } from 'react-query'
import type { Protocols, Runs } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/runs')
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
        ] as any as Runs,
      },
    } as any as UseQueryResult<Runs, AxiosError>)
    render()
    screen.getByText('Run History')
    screen.getByText('Run Date')
    screen.getByText('Protocol')
    screen.getByText('Status')
    screen.getByText('Run duration')
    screen.getByText('mock HistoricalProtocolRun')
  })
  it('renders quick transfer runs', () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useAllProtocolsQuery).mockReturnValue({
      data: {
        data: [
          {
            id: 'test_protocol_id',
            protocolKind: 'quick-transfer',
            metadata: {
              protocolName: 'test protocol',
            },
          },
        ],
      },
    } as any as UseQueryResult<Protocols, AxiosError>)
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
        ] as any as Runs,
      },
    } as any as UseQueryResult<Runs, AxiosError>)
    render()
    screen.getByText('mock HistoricalProtocolRun')
  })
})
