import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { DestinationLabwareContainer } from '../DestinationLabwareContainer'
import { PipetteContainer } from '../PipetteContainer'
import { SourceLabwareContainer } from '../SourceLabwareContainer'
import { SourceWellViewContainer } from '../SourceWellViewContainer'
import { StepDetailContainer } from '../StepDetailContainer'
import { TipDisposalContainer } from '../TipDisposalContainer'
import { TipPickupContainer } from '../TipPickupContainer'

import type { ComponentProps } from 'react'
import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

vi.mock('../PipetteContainer')
vi.mock('../DestinationLabwareContainer')
vi.mock('../TipDisposalContainer')
vi.mock('../SourceLabwareContainer')
vi.mock('../SourceWellViewContainer')
vi.mock('../TipPickupContainer')

const render = (props: ComponentProps<typeof StepDetailContainer>) => {
  return renderWithProviders(<StepDetailContainer {...props} />)
}

const mockLiquids = [] as Liquid[]

describe('StepDetailContainer', () => {
  let props: ComponentProps<typeof StepDetailContainer>

  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
      commands: [
        {
          commandType: 'loadPipette',
          params: {
            pipetteName: 'p300_single',
            mount: 'left',
            pipetteId: 'leftPipetteId',
          },
          result: { pipetteId: 'leftPipetteId' },
        },
        {
          commandType: 'loadPipette',
          params: {
            pipetteName: 'p300_multi',
            mount: 'right',
            pipetteId: 'rightPipetteId',
          },
          result: { pipetteId: 'rightPipetteId' },
        },
      ] as RunTimeCommand[],
      selectedSlot: 'mockSelectedSlot',
      robotState: {
        labware: {},
        liquidState: {
          pipettes: {},
          labware: {},
          trashBins: {},
          wasteChute: {},
        },
        modules: {},
        pipettes: {
          leftPipetteId: {
            mount: 'left',
            nozzles: 'ALL',
            tipWell: 'A1',
            tiprackId: 'mockTiprackId',
          },
          rightPipetteId: {
            mount: 'right',
            nozzles: 'ALL',
            tipWell: 'A1',
            tiprackId: 'mockTiprackId',
          },
        },
        tipState: {
          tipracks: {},
          pipettes: {},
        },
      } as RobotState,
      invariantContext: { moduleEntities: {} } as InvariantContext,
      liquids: mockLiquids,
      previousRobotState: {} as any,
      currentCommandIndex: 1,
    }
    vi.mocked(PipetteContainer).mockReturnValue(
      <div>mock Pipette Container</div>
    )
    vi.mocked(TipPickupContainer).mockReturnValue(
      <div>mock Tip Pickup Container</div>
    )
    vi.mocked(DestinationLabwareContainer).mockReturnValue(
      <div>mock Destination Labware Container</div>
    )
    vi.mocked(TipDisposalContainer).mockReturnValue(
      <div>mock Tip Disposal Container</div>
    )
    vi.mocked(SourceLabwareContainer).mockReturnValue(
      <div>mock Source Labware Container</div>
    )
    vi.mocked(SourceWellViewContainer).mockReturnValue(
      <div>mock Source Well View Container</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the pipette container', () => {
    render(props)
    expect(screen.getAllByText('mock Pipette Container')).toHaveLength(2)
    // screen.getByText('mock Destination Labware Container')
    // screen.getByText('mock Source Labware Container')
    screen.getByText('mock Tip Disposal Container')
    // screen.getByText('mock Source Well View Container')
    screen.getByText('mock Tip Pickup Container')
  })
})
