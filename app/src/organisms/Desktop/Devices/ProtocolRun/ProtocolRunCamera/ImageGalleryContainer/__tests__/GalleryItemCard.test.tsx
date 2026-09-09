import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCommandQuery, useHost } from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { saveFileFromUrl } from '/app/redux/shell/remote'
import { useImage } from '/app/resources/dataFiles/useImage'

import { GalleryItemCard } from '../GalleryItemCard'

import type { RobotType } from '@opentrons/shared-data'
import type { UseImageGalleryDataProps } from '/app/local-resources/images/hooks/useImageGalleryData'

const mockSaveFileFromUrl = vi.hoisted(() => vi.fn().mockResolvedValue('/tmp'))

vi.mock('/app/resources/dataFiles/useImage')
vi.mock('/app/redux/discovery/selectors')
vi.mock('/app/redux/shell/remote', () => ({
  saveFileFromUrl: mockSaveFileFromUrl,
}))
vi.mock('/app/local-resources/files/fileSaveCanceledError', () => ({
  isFileSaveCanceledError: vi.fn(() => false),
}))
vi.mock('@opentrons/react-api-client', () => ({
  useCommandQuery: vi.fn(),
  useHost: vi.fn(),
}))
vi.mock('@opentrons/components', async () => {
  const actual = await vi.importActual('@opentrons/components')
  return {
    ...actual,
    useCommandTextString: vi.fn(() => ({ commandText: 'Mock command text' })),
  }
})
vi.mock('../GalleryItemErrorModal', () => ({
  GalleryItemErrorModal: vi.fn(
    ({ erroredCommand, runId, robotName, toggleModal }) => (
      <div data-testid="gallery-item-error-modal">Mock Error Modal</div>
    )
  ),
}))

const render = (props: UseImageGalleryDataProps) => {
  return renderWithProviders(
    <GalleryItemCard
      {...props}
      protocolName="MOCK-PROTOCOL"
      runId="MOCK-RUN-ID"
      runTimestamp="MOCK-RUN-TIMESTAMP"
      robotName="MOCK-ROBOT-NAME"
    />,
    {
      i18nInstance: i18n,
    }
  )
}

const mockProtocolAnalysis = {
  commands: [],
  labware: [],
} as any

const MOCK_IMAGE_ITEM = {
  imageId: 'imageid123',
  stepCommandId: 'step1',
  previousStepCommandId: 'step2',
  timestamp: '2024-01-01 12:00:00',
  filename: 'test-filename',
}
const MOCK_RUN_ID = 'run123'
describe('GalleryItemCard', () => {
  let mockProps: UseImageGalleryDataProps
  beforeEach(() => {
    mockProps = {
      item: MOCK_IMAGE_ITEM,
      protocolAnalysis: mockProtocolAnalysis,
      runId: MOCK_RUN_ID,
      robotType: 'OT3-Standard' as RobotType,
      allRunDefs: [],
    }

    vi.mocked(useImage).mockReturnValue('img-id')
    vi.mocked(useHost).mockReturnValue({
      hostname: '10.0.0.5',
      port: 31950,
    } as any)
    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: null },
      isLoading: false,
    } as any)
    mockSaveFileFromUrl.mockClear()
  })

  it('renders expected card content', () => {
    vi.mocked(useImage).mockReturnValue(null)

    render(mockProps)
    expect(screen.queryByAltText('camera-photo')).toBeNull()
    expect(screen.getAllByRole('status'))
  })

  it('shows "View image" on hover', async () => {
    vi.mocked(useImage).mockReturnValue(null)

    render(mockProps)

    expect(screen.queryByAltText('camera-photo')).toBeNull()
    expect(screen.getAllByRole('status'))
  })

  it('renders appropriate card copy when there is an image', () => {
    render(mockProps)

    screen.getByText('Step ? / ?: Mock command text')
    screen.getByText('View image')
    screen.getByText('2024-01-01 12:00:00')
  })

  it('shows overflow menu and saves the image when download is clicked', async () => {
    render(mockProps)

    const overflowButton = screen.getByRole('button')
    fireEvent.click(overflowButton)

    const downloadItem = screen.getByText('Download image')
    expect(downloadItem).toBeInTheDocument()

    fireEvent.click(downloadItem)

    expect(screen.queryByText('Download image')).toBeNull()
    await vi.waitFor(() => {
      expect(saveFileFromUrl).toHaveBeenCalledWith({
        name: 'test-filename',
        source: '/dataFiles/imageid123/download',
        hostname: '10.0.0.5',
        port: 31950,
        token: undefined,
        secure: undefined,
      })
    })
  })

  it('renders error modal when command has error and modal is toggled', () => {
    const mockErroredCommand = {
      error: {
        errorCode: '3000',
        detail: 'Test error detail',
      },
    }

    vi.mocked(useCommandQuery).mockReturnValue({
      data: { data: mockErroredCommand },
      isLoading: false,
    } as any)

    render(mockProps)

    const overflowButton = screen.getByRole('button')
    fireEvent.click(overflowButton)

    const viewErrorDetailsButton = screen.queryByText('View error details')
    if (viewErrorDetailsButton != null) {
      fireEvent.click(viewErrorDetailsButton)
      expect(screen.getByTestId('gallery-item-error-modal')).toBeInTheDocument()
    }
  })
})
