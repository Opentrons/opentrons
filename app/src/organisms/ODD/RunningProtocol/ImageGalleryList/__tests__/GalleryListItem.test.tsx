import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { handleCameraPhotoModal } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal'

import { GalleryListItem } from '../GalleryListItem'

// eslint-disable-next-line opentrons/no-imports-across-applications
import type { UseStubImagesInfoResult } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useStubImagesInfo'

vi.mock('/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal')

const render = (props: UseStubImagesInfoResult) => {
  return renderWithProviders(<GalleryListItem {...props} />, {
    i18nInstance: i18n,
  })
}

const MOCK_IMG_PATH = '/path/to/test-image.jpg'
const MOCK_TIMESTAMP = '2024-01-01 12:00:00'
const MOCK_CMD_TEXT = 'Test step command'
const MOCK_PREV_CMD_TEXT = 'Previous test command'

describe('GalleryListItem', () => {
  let props: UseStubImagesInfoResult

  beforeEach(() => {
    props = {
      imagePath: MOCK_IMG_PATH,
      stepCommandText: MOCK_CMD_TEXT,
      previousStepCommandText: MOCK_PREV_CMD_TEXT,
      timestamp: MOCK_TIMESTAMP,
    }
    vi.mocked(handleCameraPhotoModal).mockResolvedValue(null)
  })

  it('renders expected list item content', () => {
    render(props)

    screen.getByText(MOCK_TIMESTAMP)
    screen.getByText(MOCK_CMD_TEXT)
    screen.getByText(MOCK_PREV_CMD_TEXT)
    screen.getByText('View image')
  })

  it('calls handleCameraPhotoModal when view image button is clicked', async () => {
    const user = userEvent.setup()
    render(props)

    const viewButton = screen.getByText('View image')
    await user.click(viewButton)

    expect(vi.mocked(handleCameraPhotoModal)).toHaveBeenCalledWith({
      imagePath: MOCK_IMG_PATH,
      timestamp: MOCK_TIMESTAMP,
      stepCommandText: MOCK_CMD_TEXT,
    })
  })

  it('renders expected text', () => {
    render(props)

    screen.getByText(MOCK_CMD_TEXT)
    screen.getByText(MOCK_PREV_CMD_TEXT)
    screen.getByText(MOCK_TIMESTAMP)
  })
})
