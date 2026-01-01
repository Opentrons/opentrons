import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useImageGalleryData } from '/app/local-resources/images/hooks/useImageGalleryData'
import { handleCameraPhotoModal } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal'
import { useImage } from '/app/resources/dataFiles/useImage'

import { GalleryListItem } from '../GalleryListItem'

import type { GalleryListItemProps } from '../GalleryListItem'

vi.mock(
  '/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal',
  () => ({
    handleCameraPhotoModal: vi.fn(),
  })
)
vi.mock('/app/local-resources/images/hooks/useImageGalleryData')
vi.mock('/app/resources/dataFiles/useImage')

const MOCK_IMG_PATH = '/path/to/test-image.jpg'
const MOCK_TIMESTAMP = '2024-01-01 12:00:00'
const MOCK_CMD_TEXT = 'Test step command'
const MOCK_PREV_CMD_TEXT = 'Previous test command'

const mockProtocolAnalysis = {
  commands: [],
  labware: [],
} as any

const mockProps: GalleryListItemProps = {
  runId: 'run123',
  protocolAnalysis: mockProtocolAnalysis,
  robotType: FLEX_ROBOT_TYPE,
  allRunDefs: [],
  item: {
    imageId: 'imageId',
    stepCommandId: 'commandId',
    previousStepCommandId: 'previouscommandId',
    timestamp: MOCK_TIMESTAMP,
    filename: 'test-filename',
  },
}

const render = (props = mockProps) =>
  renderWithProviders(<GalleryListItem {...props} />, {
    i18nInstance: i18n,
  })

describe('GalleryListItem', () => {
  beforeEach(() => {
    vi.mocked(useImage).mockReturnValue(MOCK_IMG_PATH)
    vi.mocked(useImageGalleryData).mockReturnValue({
      currentCommand: {} as any,
      currentCommandString: MOCK_CMD_TEXT,
      previousCommandString: MOCK_PREV_CMD_TEXT,
      isLoading: false,
    })
    vi.mocked(handleCameraPhotoModal).mockResolvedValue(undefined)
  })

  it('renders expected list item content', () => {
    render()

    expect(screen.getByText(MOCK_TIMESTAMP)).toBeInTheDocument()
    expect(screen.getByText(MOCK_PREV_CMD_TEXT)).toBeInTheDocument()
    expect(screen.getByText('View image')).toBeInTheDocument()
  })

  it('calls handleCameraPhotoModal when view image button is clicked', async () => {
    const user = userEvent.setup()
    render()

    const viewButton = screen.getByText('View image')
    await user.click(viewButton)

    expect(handleCameraPhotoModal).toHaveBeenCalledWith({
      imagePath: MOCK_IMG_PATH,
      timestamp: MOCK_TIMESTAMP,
      stepCountStr: 'step ? / ?',
    })
  })
})
