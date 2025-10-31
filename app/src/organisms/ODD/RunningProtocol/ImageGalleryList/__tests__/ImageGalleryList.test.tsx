import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { GalleryListItem } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/GalleryListItem'
import { ProtocolPlayPauseHeader } from '/app/organisms/ODD/RunningProtocol/shared/ProtocolPlayPauseHeader'
import { useFeatureFlag } from '/app/redux/config'
import { useImageInfo } from '/app/resources/dataFiles/useImageInfo'

import { ImageGalleryList } from '..'

import type { ImageGalleryListProps } from '..'

vi.mock('/app/resources/dataFiles/useImageInfo')
vi.mock('/app/organisms/ODD/RunningProtocol/ImageGalleryList/GalleryListItem')
vi.mock('/app/organisms/ODD/RunningProtocol/shared/ProtocolPlayPauseHeader')
vi.mock('/app/redux/config')

const render = (props: ImageGalleryListProps) => {
  return renderWithProviders(<ImageGalleryList {...props} />, {
    i18nInstance: i18n,
  })
}

const mockProtocolAnalysis = {
  commands: [],
  labware: [],
} as any

const mockImagesInfo = {
  items: [
    {
      imageId: 'imageId1',
      stepCommandId: 'commandId1',
      previousStepCommandId: 'previouscommandId1',
      timestamp: '2024-01-01 10:00:00',
    },
    {
      imageId: 'imageId2',
      stepCommandId: 'commandId2',
      previousStepCommandId: 'previouscommandId2',
      timestamp: '2024-01-01 11:00:00',
    },
  ],
  protocolAnalysis: mockProtocolAnalysis,
  isLoadingImages: false,
  allRunDefs: [],
}

describe('ImageGalleryList', () => {
  let mockProps: ImageGalleryListProps

  beforeEach(() => {
    mockProps = {
      runStatus: RUN_STATUS_IDLE,
      onStop: vi.fn(),
      onTogglePlayPause: vi.fn(),
      protocolName: 'Test Protocol',
      runId: 'run123',
      protocolAnalysis: mockProtocolAnalysis,
      robotType: 'OT-3 Standard',
      allRunDefs: [],
    }

    vi.mocked(useImageInfo).mockReturnValue(mockImagesInfo)
    vi.mocked(GalleryListItem).mockImplementation(({ timestamp }) => (
      <div>MOCK_GALLERY_LIST_ITEM_{timestamp}</div>
    ))
    vi.mocked(ProtocolPlayPauseHeader).mockImplementation(() => (
      <div>MOCK_PROTOCOL_PLAY_PAUSE_HEADER</div>
    ))
    vi.mocked(useFeatureFlag).mockReturnValue(true)
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
