import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { DestinationLabwareContainer } from '../DestinationLabwareContainer'
import { DestinationTipsContainer } from '../DestinationTipsContainer'
import { PipetteContainer } from '../PipetteContainer'
import { SourceLabwareContainer } from '../SourceLabwareContainer'
import { SourceWellViewContainer } from '../SourceWellViewContainer'
import { StepDetailContainer } from '../StepDetailContainer'
import { TipPickupContainer } from '../TipPickupContainer'

vi.mock('../PipetteContainer')
vi.mock('../DestinationLabwareContainer')
vi.mock('../DestinationTipsContainer')
vi.mock('../SourceLabwareContainer')
vi.mock('../SourceWellViewContainer')
vi.mock('../TipPickupContainer')

const render = () => {
  return renderWithProviders(<StepDetailContainer />)
}

describe('StepDetailContainer', () => {
  beforeEach(() => {
    vi.mocked(PipetteContainer).mockReturnValue(
      <div>mock Pipette Container</div>
    )
    vi.mocked(DestinationLabwareContainer).mockReturnValue(
      <div>mock Destination Labware Container</div>
    )
    vi.mocked(DestinationTipsContainer).mockReturnValue(
      <div>mock Destination Tips Container</div>
    )
    vi.mocked(SourceLabwareContainer).mockReturnValue(
      <div>mock Source Labware Container</div>
    )
    vi.mocked(SourceWellViewContainer).mockReturnValue(
      <div>mock Source Well View Container</div>
    )
    vi.mocked(TipPickupContainer).mockReturnValue(
      <div>mock Tip Pickup Container</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the pipette container', () => {
    render()
    screen.getByText('mock Pipette Container')
    screen.getByText('mock Destination Labware Container')
    screen.getByText('mock Destination Tips Container')
    screen.getByText('mock Source Labware Container')
    screen.getByText('mock Source Well View Container')
    screen.getByText('mock Tip Pickup Container')
  })
})
