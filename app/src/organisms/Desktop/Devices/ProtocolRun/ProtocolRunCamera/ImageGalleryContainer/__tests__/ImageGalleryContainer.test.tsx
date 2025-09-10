import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { ImageGalleryContainer } from '..'
import { GalleryItemCard } from '../GalleryItemCard'
import { useStubImagesInfo } from '../hooks/useStubImagesInfo'

import type { UseStubImagesInfoResult } from '../hooks/useStubImagesInfo'

vi.mock('../GalleryItemCard')
vi.mock('../hooks/useStubImagesInfo')

const render = () => {
  return renderWithProviders(<ImageGalleryContainer />, {
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
  {
    imagePath: '/path/to/image3.jpg',
    stepCommandText: 'Step 3 command',
    previousStepCommandText: 'Previous step 3',
    timestamp: '2024-01-01 12:00:00',
  },
]

describe('ImageGalleryContainer', () => {
  beforeEach(() => {
    vi.mocked(useStubImagesInfo).mockReturnValue(mockImagesInfo)
    vi.mocked(GalleryItemCard).mockImplementation(({ timestamp }) => (
      <div>MOCK_GALLERY_ITEM_CARD_{timestamp}</div>
    ))
  })

  it('renders image gallery header text', () => {
    render()

    screen.getByText('Image Gallery')
    screen.getByText('3 photos')
    screen.getByText(
      'Protocol images can be viewed once captured and downloaded when the run is complete.'
    )
  })

  it('renders gallery table headers', () => {
    render()

    screen.getByText('Thumbnail')
    screen.getByText('Step Detail')
    screen.getByText('Timestamp')
  })

  it('renders expected GalleryItemCards', () => {
    render()

    screen.getByText('MOCK_GALLERY_ITEM_CARD_2024-01-01 10:00:00')
    screen.getByText('MOCK_GALLERY_ITEM_CARD_2024-01-01 11:00:00')
    screen.getByText('MOCK_GALLERY_ITEM_CARD_2024-01-01 12:00:00')
  })
})
