import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useImage } from '/app/resources/dataFiles/useImage'

import { GalleryItemCard } from '../GalleryItemCard'

import type { RobotType } from '@opentrons/shared-data'
import type { UseImageGalleryDataProps } from '/app/local-resources/images/hooks/useImageGalleryData'

vi.mock('/app/resources/dataFiles/useImage')
vi.mock('../GalleryItemOverflowMenu')

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
  })

  it('renders expected card content', () => {
    vi.mocked(useImage).mockReturnValue(null)

    render(mockProps)
    expect(screen.queryByAltText('camera-photo')).toBeNull()
    expect(screen.getAllByTestId('Skeleton'))
  })

  it('shows "View image" on hover', async () => {
    vi.mocked(useImage).mockReturnValue(null)

    render(mockProps)

    expect(screen.queryByAltText('camera-photo')).toBeNull()
    expect(screen.getAllByTestId('Skeleton'))
  })

  it('renders appropriate card copy when there is an image', () => {
    render(mockProps)

    screen.getByText('Step ? / ?: ?')
    screen.getByText('View image')
    screen.getByText('2024-01-01 12:00:00')
  })
})
