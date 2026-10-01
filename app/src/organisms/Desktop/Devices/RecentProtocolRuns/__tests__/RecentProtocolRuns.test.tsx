import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { isFileSaveCanceledError } from '/app/local-resources/files/fileSaveCanceledError'
import { useToaster } from '/app/organisms/ToasterOven'
import { useIsRobotViewable } from '/app/redux-resources/robots'
import {
  useDeleteSelectedRuns,
  useDownloadSelectedRuns,
} from '/app/resources/devices'
import { useNotifyAllRunsQuery, useRunStatuses } from '/app/resources/runs'

import { RecentProtocolRuns } from '../../RecentProtocolRuns'
import { HistoricalProtocolRun } from '../HistoricalProtocolRun'

import type { AxiosError } from 'axios'
import type { UseQueryResult } from 'react-query'
import type { Protocols, Runs } from '@opentrons/api-client'
import type { ToasterContextType } from '/app/organisms/ToasterOven/ToasterContext'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/local-resources/access-control/useDocumentationState')
vi.mock('/app/local-resources/files/fileSaveCanceledError', () => ({
  isFileSaveCanceledError: vi.fn(),
}))
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/resources/devices')
vi.mock('/app/resources/runs')
vi.mock('../HistoricalProtocolRun')

const render = () => {
  return renderWithProviders(<RecentProtocolRuns robotName="otie" />, {
    i18nInstance: i18n,
  })
}
const mockDownloadRuns = vi.fn()
const mockDeleteRuns = vi.fn()
const mockMakeToast = vi.fn()
const mockEatToast = vi.fn()

const RUNS_WITH_DATA = {
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
} as any as UseQueryResult<Runs, AxiosError>

describe('RecentProtocolRuns', () => {
  beforeEach(() => {
    mockDownloadRuns.mockReset()
    mockMakeToast.mockReset()
    mockMakeToast.mockReturnValue('toast-id')
    mockEatToast.mockReset()
    vi.mocked(isFileSaveCanceledError).mockReturnValue(false)
    vi.mocked(useToaster).mockReturnValue({
      makeToast: mockMakeToast,
      eatToast: mockEatToast,
    } as unknown as ToasterContextType)
    vi.mocked(useRunStatuses).mockReturnValue({
      isRunRunning: false,
      isRunStill: false,
      isRunTerminal: true,
      isRunIdle: false,
    })
    vi.mocked(HistoricalProtocolRun).mockReturnValue(
      <div>mock HistoricalProtocolRun</div>
    )
    vi.mocked(useDownloadSelectedRuns).mockReturnValue({
      mutateAsync: mockDownloadRuns,
      status: 'idle',
    } as any)
    vi.mocked(useDeleteSelectedRuns).mockReturnValue({
      deleteSelectedRuns: mockDeleteRuns,
      deletingIds: new Set(),
    })
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
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue(RUNS_WITH_DATA)
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
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue(RUNS_WITH_DATA)
    render()
    screen.getByText('mock HistoricalProtocolRun')
  })

  it('does not toast an error when the save dialog is canceled', async () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue(RUNS_WITH_DATA)
    const cancelError = new Error('File save canceled')
    cancelError.name = 'FileSaveCanceledError'
    mockDownloadRuns.mockRejectedValue(cancelError)
    vi.mocked(isFileSaveCanceledError).mockReturnValue(true)

    render()
    fireEvent.click(screen.getByText('Download all'))

    await vi.waitFor(() => {
      expect(mockEatToast).toHaveBeenCalledWith('toast-id')
    })
    expect(mockMakeToast).not.toHaveBeenCalledWith(
      cancelError.message,
      'error',
      expect.anything()
    )
  })

  it('toasts an error when download fails for a non-cancel reason', async () => {
    vi.mocked(useIsRobotViewable).mockReturnValue(true)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue(RUNS_WITH_DATA)
    mockDownloadRuns.mockRejectedValue(new Error('network down'))

    render()
    fireEvent.click(screen.getByText('Download all'))

    await vi.waitFor(() => {
      expect(mockMakeToast).toHaveBeenCalledWith('network down', 'error', {
        closeButton: true,
      })
    })
  })
})
