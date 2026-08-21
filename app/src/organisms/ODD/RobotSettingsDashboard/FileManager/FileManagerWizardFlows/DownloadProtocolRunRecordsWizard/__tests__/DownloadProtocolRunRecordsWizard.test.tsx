import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useToaster } from '/app/organisms/ToasterOven'
import { getLocalRobot } from '/app/redux/discovery'
import { getShellUsbMassStorageMountPaths } from '/app/redux/shell'
import { useDeleteSelectedRuns } from '/app/resources/devices/hooks/useDeleteSelectedRuns'
import { useDownloadSelectedRuns } from '/app/resources/devices/hooks/useDownloadSelectedRuns'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import { DownloadProtocolRunRecordsWizard } from '..'

vi.mock('/app/local-resources/access-control/useDocumentationState')
vi.mock('/app/redux/discovery')
vi.mock('/app/redux/shell')
vi.mock('/app/resources/devices/hooks/useDeleteSelectedRuns')
vi.mock('/app/resources/devices/hooks/useDownloadSelectedRuns')
vi.mock('/app/resources/runs')
vi.mock('/app/organisms/ToasterOven')

const ROBOT_NAME = 'otie'
const mockRun = { id: 'run-1' } as any
const mockOnClose = vi.fn()

const render = () => {
  return renderWithProviders(
    <DownloadProtocolRunRecordsWizard onClose={mockOnClose} />,
    { i18nInstance: i18n }
  )[0]
}

describe('DownloadProtocolRunRecordsWizard', () => {
  let mockDownloadRuns: ReturnType<typeof vi.fn>
  let mockDeleteSelectedRuns: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.mocked(useDocumentationState).mockReturnValue({} as any)
    vi.mocked(getLocalRobot).mockReturnValue({ name: ROBOT_NAME } as any)
    vi.mocked(getShellUsbMassStorageMountPaths).mockReturnValue(['/mnt/usb1'])
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRun] },
    } as any)
    vi.mocked(useToaster).mockReturnValue({
      makeToast: vi.fn(),
      eatToast: vi.fn(),
    } as any)

    mockDownloadRuns = vi.fn().mockResolvedValue([mockRun])
    mockDeleteSelectedRuns = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDownloadSelectedRuns).mockReturnValue({
      downloadRuns: mockDownloadRuns,
      isDownloading: false,
      hasError: false,
    } as any)
    vi.mocked(useDeleteSelectedRuns).mockReturnValue({
      deleteSelectedRuns: mockDeleteSelectedRuns,
      deletingIds: new Set(),
    } as any)
  })

  it('should walk through the USB selection, choosing not to delete, and land on success', async () => {
    render()

    screen.getByText(
      'Which USB device do you want to download all protocol run records to?'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    screen.getByText('Delete all protocol run records after download?')
    fireEvent.click(screen.getByText('No'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    screen.getByText('Downloading all protocol files')

    await waitFor(() => {
      screen.getByText('All protocol files downloaded')
    })
    expect(mockDownloadRuns).toHaveBeenCalledWith([mockRun], '/mnt/usb1')
    expect(mockDeleteSelectedRuns).not.toHaveBeenCalled()
  })

  it('should delete after downloading when the user chooses to', async () => {
    render()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByText('Yes'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      screen.getByText('All protocol files downloaded')
    })
    expect(mockDeleteSelectedRuns).toHaveBeenCalledWith([mockRun])
  })

  it('should show an error screen when the download fails', async () => {
    mockDownloadRuns.mockRejectedValue(new Error('nope'))
    render()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByText('No'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      screen.getByText(
        'Failed to download run records. Check USB connection and try again.'
      )
    })
  })

  it('should show an error screen when the delete fails', async () => {
    mockDeleteSelectedRuns.mockRejectedValue(new Error('nope'))
    render()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByText('Yes'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      screen.getByText('Failed to delete run records. Please try again.')
    })
  })

  it('should call onClose when exiting from the success screen', async () => {
    render()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByText('No'))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      screen.getByText('All protocol files downloaded')
    })
    fireEvent.click(screen.getByRole('button', { name: 'Finish' }))

    expect(mockOnClose).toHaveBeenCalled()
  })
})
