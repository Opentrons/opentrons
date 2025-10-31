import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useDownloadRunLog } from '/app/organisms/Desktop/Devices/hooks'

import { GalleryItemErrorModal } from '../GalleryItemErrorModal'

import type { RunTimeCommand } from '@opentrons/shared-data'

vi.mock('/app/organisms/Desktop/Devices/hooks')

const MOCK_ERROR_COMMAND: RunTimeCommand = {
  id: 'command123',
  commandType: 'pickUpTip',
  status: 'failed',
  error: {
    errorCode: 'ERR-001',
    errorType: 'TipPickupError',
    detail: 'Failed to pick up tip from slot A1',
    createdAt: '2024-01-01T12:00:00Z',
  },
  createdAt: '2024-01-01T12:00:00Z',
  startedAt: '2024-01-01T12:00:01Z',
  completedAt: '2024-01-01T12:00:02Z',
  params: {},
} as any

const mockDownloadRunLog = vi.fn()
const mockToggleModal = vi.fn()

const render = (erroredCommand: RunTimeCommand = MOCK_ERROR_COMMAND) => {
  return renderWithProviders(
    <GalleryItemErrorModal
      erroredCommand={erroredCommand}
      runId="MOCK-RUN-ID"
      robotName="MOCK-ROBOT-NAME"
      toggleModal={mockToggleModal}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('GalleryItemErrorModal', () => {
  beforeEach(() => {
    vi.mocked(useDownloadRunLog).mockReturnValue({
      downloadRunLog: mockDownloadRunLog,
      isRunLogLoading: false,
    } as any)
  })

  it('renders modal with error details title', () => {
    render()
    screen.getByText('Error details')
  })

  it('renders description text', () => {
    render()
    screen.getByText(
      'Download the run log and send it to support@opentrons.com for assistance.'
    )
  })

  it('renders download run log link', () => {
    render()
    screen.getByText('Download Run Log')
  })

  it('renders close button', () => {
    render()
    screen.getByText('Close')
  })

  it('calls downloadRunLog when download link is clicked', () => {
    render()
    const downloadLink = screen.getByText('Download Run Log')
    fireEvent.click(downloadLink)
    expect(mockDownloadRunLog).toHaveBeenCalled()
  })

  it('calls toggleModal when close button is clicked', () => {
    render()
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)
    expect(mockToggleModal).toHaveBeenCalled()
  })

  it('renders the proper error message', () => {
    render()
    screen.getByText('ERR-001: Failed to pick up tip from slot A1')
  })
})
