import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { GalleryItemCard } from '../GalleryItemCard'

import type { GalleryItemCardProps } from '../GalleryItemCard'

const render = (props: GalleryItemCardProps) => {
  return renderWithProviders(<GalleryItemCard {...props} />, {
    i18nInstance: i18n,
  })
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
}

const MOCK_RUN_ID = 'run123'
describe('GalleryItemCard', () => {
  let mockProps: GalleryItemCardProps

  beforeEach(() => {
    mockProps = {
      item: MOCK_IMAGE_ITEM,
      protocolAnalysis: mockProtocolAnalysis,
      runId: MOCK_RUN_ID,
      robotType: 'OT-3 Standard',
      allRunDefs: [],
    }
  })

  it('renders expected card content', () => {
    render(mockProps)

    const image = screen.getByAltText('camera-photo')
    expect(image).toHaveAttribute('src', 'mock-image-path.png')

    screen.getByText('Step 1/100: Current command text')
    screen.getByText('Previous command text')
    screen.getByText(MOCK_IMAGE_ITEM.timestamp)
  })

  it('shows "View image" on hover', async () => {
    const user = userEvent.setup()
    render(mockProps)

    const image = screen.getByAltText('camera-photo')
    await user.hover(image)

    screen.getByText('View image')
  })
})
