import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAllProtocolsQuery,
  useDeleteRunMutation,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '/app/local-resources/access-control/__fixtures__/documentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { getLocalRobot } from '/app/redux/discovery'
import { getShellUsbMountPaths } from '/app/redux/shell'
import { useDownloadSelectedRuns } from '/app/resources/devices/hooks/useDownloadSelectedRuns'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { ProtocolRunRecords } from '..'

import type { RunData } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux/shell')
vi.mock('/app/organisms/ToasterOven')
vi.mock('/app/resources/devices/hooks/useDownloadSelectedRuns')
vi.mock('/app/resources/runs')
vi.mock('/app/local-resources/access-control/useDocumentationState', () => ({
  useDocumentationState: () => ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
}))

const render = () => {
  return renderWithProviders(<ProtocolRunRecords />, { i18nInstance: i18n })[0]
}

const mockRun: RunData = {
  id: 'run-1',
  protocolId: 'protocol-1',
  createdAt: '2026-07-10T14:23:00Z',
  current: false,
  status: 'succeeded',
  actions: [],
  errors: [],
  hasEverEnteredErrorRecovery: false,
  pipettes: [],
  labware: [],
  liquids: [],
  modules: [],
  ok: true,
  runTimeParameters: [],
  outputFileIds: [],
} as any

describe('ProtocolRunRecords', () => {
  let mockDeleteRun: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.mocked(useAllProtocolsQuery).mockReturnValue({
      data: { data: [] },
    } as any)
    mockDeleteRun = vi.fn()
    vi.mocked(useDeleteRunMutation).mockReturnValue({
      deleteRun: mockDeleteRun,
    } as any)
    vi.mocked(getLocalRobot).mockReturnValue({ name: 'otie' } as any)
    vi.mocked(getShellUsbMountPaths).mockReturnValue(['/mnt/usb1'])
    vi.mocked(useToaster).mockReturnValue({
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    } as any)
    vi.mocked(useDownloadSelectedRuns).mockReturnValue({
      downloadRuns: vi.fn().mockResolvedValue(undefined),
      isDownloading: false,
      hasError: false,
    })
  })

  it('renders real rows when the query returns runs', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRun] },
    } as any)
    vi.mocked(useAllProtocolsQuery).mockReturnValue({
      data: {
        data: [{ id: 'protocol-1', metadata: { protocolName: 'My Protocol' } }],
      },
    } as any)

    render()

    screen.getByText('My Protocol')
    screen.getByText('Completed')
    expect(screen.queryAllByText('N/A')).toHaveLength(0)
  })

  it('calls deleteRun with the run id when the delete menu item is clicked', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRun] },
    } as any)

    render()

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Delete protocol record'))

    expect(mockDeleteRun).toHaveBeenCalledWith({ runId: 'run-1' })
  })

  it('opens the download wizard when the download menu item is clicked', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRun] },
    } as any)

    render()

    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Download protocol files'))

    screen.getByText(
      'Which USB device do you want to download this run record to?'
    )
  })
})
