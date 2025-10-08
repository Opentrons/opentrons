import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { useStubImagesInfo } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useStubImagesInfo'
import { GalleryListItem } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/GalleryListItem'
import { ProtocolPlayPauseHeader } from '/app/organisms/ODD/RunningProtocol/shared/ProtocolPlayPauseHeader'

import { ImageGalleryList } from '..'

// eslint-disable-next-line opentrons/no-imports-across-applications
import type { UseStubImagesInfoResult } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useStubImagesInfo'
import type { ImageGalleryListProps } from '..'

vi.mock(
  '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useStubImagesInfo'
)
vi.mock('/app/organisms/ODD/RunningProtocol/ImageGalleryList/GalleryListItem')
vi.mock('/app/organisms/ODD/RunningProtocol/shared/ProtocolPlayPauseHeader')

const render = (props: ImageGalleryListProps) => {
  return renderWithProviders(<ImageGalleryList {...props} />, {
    i18nInstance: i18n,
  })
}

const mockImagesInfo: UseStubImagesInfoResult[] = [
  {
    imagePath: '/path/to/image1.jpg',
    stepCommandText: 'Step 1 command',
    previousStepCommandText: 'Previous step 1',
    timestamp: '2024-01-01 10:00:00',
  },
  {
    imagePath: '/path/to/image2.jpg',
    stepCommandText: 'Step 2 command',
    previousStepCommandText: 'Previous step 2',
    timestamp: '2024-01-01 11:00:00',
  },
]

describe('ImageGalleryList', () => {
  let mockProps: ImageGalleryListProps

  beforeEach(() => {
    mockProps = {
      runStatus: RUN_STATUS_IDLE,
      onStop: vi.fn(),
      onTogglePlayPause: vi.fn(),
      protocolName: 'Test Protocol',
    }

    vi.mocked(useStubImagesInfo).mockReturnValue(mockImagesInfo)
    vi.mocked(GalleryListItem).mockImplementation(({ timestamp }) => (
      <div>MOCK_GALLERY_LIST_ITEM_{timestamp}</div>
    ))
    vi.mocked(ProtocolPlayPauseHeader).mockImplementation(() => (
      <div>MOCK_PROTOCOL_PLAY_PAUSE_HEADER</div>
    ))
  })

  it('renders ProtocolPlayPauseHeader with correct props', () => {
    render(mockProps)

    screen.getByText('MOCK_PROTOCOL_PLAY_PAUSE_HEADER')
    expect(vi.mocked(ProtocolPlayPauseHeader)).toHaveBeenCalledWith(
      mockProps,
      {}
    )
  })

  it('renders table headers', () => {
    render(mockProps)

    screen.getByText('Timestamp')
    screen.getByText('Step Detail')
  })

  it('renders GalleryListItems for each image', () => {
    render(mockProps)

    screen.getByText('MOCK_GALLERY_LIST_ITEM_2024-01-01 10:00:00')
    screen.getByText('MOCK_GALLERY_LIST_ITEM_2024-01-01 11:00:00')
  })

  it('renders image capture floating action button', () => {
    render(mockProps)

    screen.getByText('Image capture')
  })

  it('renders with running status', () => {
    const runningProps = { ...mockProps, runStatus: RUN_STATUS_RUNNING }
    render(runningProps)

    expect(vi.mocked(ProtocolPlayPauseHeader)).toHaveBeenCalledWith(
      runningProps,
      {}
    )
  })

  it('calls image capture button onClick handler', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const captureButton = screen.getByText('Image capture')
    await user.click(captureButton)
  })
})
