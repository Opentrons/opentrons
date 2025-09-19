import NiceModal from '@ebay/nice-modal-react'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { handleCameraPhotoModal } from '../CameraPhotoModal'

import type { CameraPhotoModalProps } from '../CameraPhotoModal'

const MOCK_IMG_PATH = '/path/to/test-image.jpg'
const MOCK_TIMESTAMP = '2024-01-01 12:00:00'
const MOCK_CMD_TEXT = 'Test step command'

const render = (props: CameraPhotoModalProps) => {
  return renderWithProviders(
    <NiceModal.Provider>
      <button
        onClick={() => handleCameraPhotoModal(props)}
        data-testid="testButton"
      />
    </NiceModal.Provider>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CameraPhotoModal', () => {
  let mockProps: CameraPhotoModalProps

  beforeEach(() => {
    mockProps = {
      imagePath: MOCK_IMG_PATH,
      stepCommandText: MOCK_CMD_TEXT,
      timestamp: MOCK_TIMESTAMP,
    }
  })

  it('renders modal with correct header title', () => {
    render(mockProps)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    screen.getByText(`Image at ${MOCK_CMD_TEXT} at ${MOCK_TIMESTAMP}`)
  })

  it('renders image with correct src and alt text', () => {
    render(mockProps)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    const image = screen.getByAltText('camera-capture')
    expect(image).toHaveAttribute('src', MOCK_IMG_PATH)
  })

  it('closes modal when exit icon is clicked', () => {
    render(mockProps)
    const btn = screen.getByTestId('testButton')
    fireEvent.click(btn)

    screen.getByText(`Image at ${MOCK_CMD_TEXT} at ${MOCK_TIMESTAMP}`)

    const exitButton = screen.getByLabelText('closeIcon')
    fireEvent.click(exitButton)
  })
})
