import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { ChoosePipette } from '../../../organisms/PipetteWizardFlows/ChoosePipette'
import { getIs96ChannelPipetteAttached } from '../../../organisms/Devices/utils'
import { useAttachedPipettes } from '../../../organisms/Devices/hooks'
import {
  mockAttachedGen3Pipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { PipetteWizardFlows } from '../../../organisms/PipetteWizardFlows'
import { AttachInstrumentsDashboard } from '../AttachInstrumentsDashboard'
import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../../../organisms/Devices/hooks')
jest.mock('../../../organisms/PipetteWizardFlows')
jest.mock('../../../organisms/Devices/utils')
jest.mock('../../../organisms/PipetteWizardFlows/ChoosePipette')
jest.mock('../../../organisms/OnDeviceDisplay/Navigation')

const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const mockPipetteWizardFlows = PipetteWizardFlows as jest.MockedFunction<
  typeof PipetteWizardFlows
>
const mockGetIs96ChannelPipetteAttached = getIs96ChannelPipetteAttached as jest.MockedFunction<
  typeof getIs96ChannelPipetteAttached
>
const mockChoosePipette = ChoosePipette as jest.MockedFunction<
  typeof ChoosePipette
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <AttachInstrumentsDashboard />
    </MemoryRouter>
  )
}
const mockPipette: AttachedPipette = {
  ...mockAttachedGen3Pipette,
  modelSpecs: {
    ...mockGen3P1000PipetteSpecs,
  },
}
describe('AttachInstrumentsDashboard', () => {
  beforeEach(() => {
    mockChoosePipette.mockReturnValue(<div>mock choose pipette</div>)
    mockGetIs96ChannelPipetteAttached.mockReturnValue(false)
    mockUseAttachedPipettes.mockReturnValue({ left: null, right: null })
    mockPipetteWizardFlows.mockReturnValue(<div>mock pipette wizard flows</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should render attach pipette for both mounts when gantry is empty, clicking on btn renders choose pipette', () => {
    const [{ getByText }] = render()
    getByText('attach right pipette')
    getByText('attach left pipette').click()
    getByText('mock choose pipette')
  })
  it('shoud render detach pipette and calibrate pipette buttons, clicking on them renders wizard flow', () => {
    mockUseAttachedPipettes.mockReturnValue({
      left: mockPipette,
      right: mockPipette,
    })
    const [{ getByText }] = render()
    getByText('detach left pipette')
    getByText('calibrate left pipette')
    getByText('detach right pipette')
    getByText('calibrate right pipette').click()
    getByText('mock pipette wizard flows')
  })
})
