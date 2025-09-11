import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { GalleryItemCard } from '../GalleryItemCard'

import type { UseStubImagesInfoResult } from '../hooks/useStubImagesInfo'

const render = (props: UseStubImagesInfoResult) => {
  return renderWithProviders(<GalleryItemCard {...props} />, {
    i18nInstance: i18n,
  })
}

const MOCK_IMG_PATH = '/path/to/test-image.jpg'
const MOCK_TIMESTAMP = '2024-01-01 12:00:00'
const MOCK_CMD_TEXT = 'Test step command'
const MOCK_PREV_CMD_TEXT = 'Previous test command'

describe('GalleryItemCard', () => {
  let mockProps: UseStubImagesInfoResult

  beforeEach(() => {
    mockProps = {
      imagePath: MOCK_IMG_PATH,
      stepCommandText: MOCK_CMD_TEXT,
      previousStepCommandText: MOCK_PREV_CMD_TEXT,
      timestamp: MOCK_TIMESTAMP,
    }
  })

  it('renders expected card content', () => {
    render(mockProps)

    const image = screen.getByAltText('camera-photo')

    expect(image).toHaveAttribute('src', MOCK_IMG_PATH)
    screen.getByText(MOCK_CMD_TEXT)
    screen.getByText(MOCK_PREV_CMD_TEXT)
    screen.getByText(MOCK_TIMESTAMP)
  })

  it('shows "View image" on hover', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const image = screen.getByAltText('camera-photo')
    await user.hover(image)

    screen.getByText('View image')
  })
})
