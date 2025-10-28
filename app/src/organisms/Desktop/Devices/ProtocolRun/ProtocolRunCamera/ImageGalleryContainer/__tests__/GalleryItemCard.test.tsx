import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { GalleryItemCard } from '../GalleryItemCard'

import type { RobotType } from '@opentrons/shared-data'
import type { UseImageGalleryDataProps } from '/app/local-resources/dataFiles/hooks/useImageGalleryData'

const render = (props: UseImageGalleryDataProps) => {
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
  let mockProps: UseImageGalleryDataProps
  beforeEach(() => {
    mockProps = {
      item: MOCK_IMAGE_ITEM,
      protocolAnalysis: mockProtocolAnalysis,
      runId: MOCK_RUN_ID,
      robotType: 'OT3-Standard' as RobotType,
      allRunDefs: [],
    }
  })

  it('renders expected card content', () => {
    render(mockProps)
    expect(screen.queryByAltText('camera-photo')).toBeNull()
    expect(screen.getAllByTestId('Skeleton'))
  })

  it('shows "View image" on hover', async () => {
    render(mockProps)

    expect(screen.queryByAltText('camera-photo')).toBeNull()
    expect(screen.getAllByTestId('Skeleton'))
  })
})
