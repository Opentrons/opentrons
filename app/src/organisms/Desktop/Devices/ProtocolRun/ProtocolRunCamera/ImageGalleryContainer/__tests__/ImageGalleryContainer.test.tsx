import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useImageInfo } from '/app/resources/dataFiles/useImageInfo'

import { ImageGalleryContainer } from '..'
import { GalleryItemCard } from '../GalleryItemCard'

import type { RobotType } from '@opentrons/shared-data'
import type { UseImagesInfoItem } from '/app/resources/dataFiles/useImageInfo'

vi.mock('../GalleryItemCard')
vi.mock('/app/resources/dataFiles/useImageInfo')
vi.mock('/app/redux/protocol-runs')
vi.mock('../GalleryContainerOverflowMenu')

const render = () => {
  const RUN_ID = 'run123'
  const robotType = 'OT-3 Standard' as RobotType
  return renderWithProviders(
    <ImageGalleryContainer
      runId={RUN_ID}
      robotType={robotType}
      protocolName="MOCK-PROTOCOL"
      runTimestamp="MOCK-RUN-TIMESTAMP"
      robotName="MOCK-ROBOT-NAME"
    />,
    {
      i18nInstance: i18n,
    }
  )
}

const mockImagesInfo: UseImagesInfoItem[] = [
  {
    imageId: '/path/to/image1.jpg',
    stepCommandId: 'Step 1 command',
    previousStepCommandId: 'Previous step 1',
    timestamp: '2024-01-01 10:00:00',
  },
  {
    imageId: '/path/to/image2.jpg',
    stepCommandId: 'Step 2 command',
    previousStepCommandId: 'Previous step 2',
    timestamp: '2024-01-01 11:00:00',
  },
  {
    imageId: '/path/to/image3.jpg',
    stepCommandId: 'Step 3 command',
    previousStepCommandId: 'Previous step 3',
    timestamp: '2024-01-01 12:00:00',
  },
]

const mockProtocolAnalysis = {
  commands: [],
  labware: [],
} as any

describe('ImageGalleryContainer', () => {
  beforeEach(() => {
    vi.mocked(useImageInfo).mockReturnValue({
      items: mockImagesInfo,
      protocolAnalysis: mockProtocolAnalysis,
      isLoadingImages: false,
      allRunDefs: [],
    })
    vi.mocked(GalleryItemCard).mockImplementation(({ item }) => (
      <div>MOCK_GALLERY_ITEM_CARD_{item.timestamp}</div>
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
