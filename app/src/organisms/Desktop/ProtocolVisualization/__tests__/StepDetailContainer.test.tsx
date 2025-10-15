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

import type { ComponentProps } from 'react'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

vi.mock('../PipetteContainer')
vi.mock('../DestinationLabwareContainer')
vi.mock('../DestinationTipsContainer')
vi.mock('../SourceLabwareContainer')
vi.mock('../SourceWellViewContainer')
vi.mock('../TipPickupContainer')

const render = (props: ComponentProps<typeof StepDetailContainer>) => {
  return renderWithProviders(<StepDetailContainer {...props} />)
}

describe('StepDetailContainer', () => {
  let props: ComponentProps<typeof StepDetailContainer>

  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
      commands: [] as RunTimeCommand[],
      selectedSlot: 'mockSelectedSlot',
      robotState: {} as RobotState,
      invariantContext: {} as InvariantContext,
    }
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
    render(props)
    screen.getByText('mock Pipette Container')
    screen.getByText('mock Destination Labware Container')
    screen.getByText('mock Destination Tips Container')
    screen.getByText('mock Source Labware Container')
    screen.getByText('mock Source Well View Container')
    screen.getByText('mock Tip Pickup Container')
  })
})
