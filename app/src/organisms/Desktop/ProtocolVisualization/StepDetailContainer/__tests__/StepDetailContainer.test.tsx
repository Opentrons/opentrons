import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'

import { LabwareSlotContainer } from '../../LabwareSlotContainer'
import { PipetteContainer } from '../../PipetteContainer'
import { StepDetailContainer } from '../../StepDetailContainer'
// import { TipDisposalContainer } from '../../TipDisposalContainer'
import { TipPickupContainer } from '../../TipPickupContainer'

import type { ComponentProps } from 'react'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

vi.mock('../../PipetteContainer')
// vi.mock('../../TipDisposalContainer')
vi.mock('../../TipPickupContainer')
vi.mock('../../LabwareSlotContainer')

const render = (props: ComponentProps<typeof StepDetailContainer>) => {
  return renderWithProviders(<StepDetailContainer {...props} />)
}

describe('StepDetailContainer', () => {
  let props: ComponentProps<typeof StepDetailContainer>

  beforeEach(() => {
    props = {
      protocolKey: 'mockProtocolKey',
      liquids: [],
      currentCommand: {
        commandType: 'loadPipette',
        params: {
          pipetteName: 'p300_single',
          mount: 'left',
          pipetteId: 'leftPipetteId',
        },
        result: { pipetteId: 'leftPipetteId' },
      } as any,
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
      invariantContext: {
        moduleEntities: {},
        trashBinEntities: {},
        wasteChuteEntities: {},
      } as InvariantContext,
    }
    vi.mocked(PipetteContainer).mockReturnValue(
      <div>mock Pipette Container</div>
    )
    vi.mocked(LabwareSlotContainer).mockReturnValue(
      <div>mock LabwareSlotContainer </div>
    )
    // vi.mocked(TipDisposalContainer).mockReturnValue(
    //   <div>mock Tip Disposal Container</div>
    // )

    vi.mocked(TipPickupContainer).mockReturnValue(
      <div>mock Tip Pickup Container</div>
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the pipette containers and tip container', () => {
    render(props)
    expect(screen.getAllByText('mock Pipette Container')).toHaveLength(2)
    // screen.getByText('mock Tip Disposal Container')
  })
})
