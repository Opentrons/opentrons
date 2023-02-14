import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { usePipettesQuery } from '@opentrons/react-api-client'
import { ChoosePipette } from '../../../organisms/PipetteWizardFlows/ChoosePipette'
import { getIs96ChannelPipetteAttached } from '../../../organisms/Devices/utils'
import { mockConnectedRobot } from '../../../redux/discovery/__fixtures__'
import { PipetteWizardFlows } from '../../../organisms/PipetteWizardFlows'
import { getLocalRobot } from '../../../redux/discovery'
import { AttachInstrumentsDashboard } from '../AttachInstrumentsDashboard'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../redux/discovery')
jest.mock('../../../organisms/PipetteWizardFlows')
jest.mock('../../../organisms/Devices/utils')
jest.mock('../../../organisms/PipetteWizardFlows/ChoosePipette')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockGetLocalRobot = getLocalRobot as jest.MockedFunction<
  typeof getLocalRobot
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
describe('AttachInstrumentsDashboard', () => {
  beforeEach(() => {
    mockChoosePipette.mockReturnValue(<div>mock choose pipette</div>)
    mockGetIs96ChannelPipetteAttached.mockReturnValue(false)
    mockGetLocalRobot.mockReturnValue(mockConnectedRobot)
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: null,
        right: null,
      },
    } as any)
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
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: {
          id: 'pipetteId',
          name: `test-pipetteId`,
          model: 'p1000_single_v3',
          tip_length: 0,
          mount_axis: 'z',
          plunger_axis: 'b',
        },
        right: {
          id: 'pipetteId',
          name: `test-pipetteId`,
          model: 'p1000_single_v3',
          tip_length: 0,
          mount_axis: 'y',
          plunger_axis: 'a',
        },
      },
    } as any)
    const [{ getByText }] = render()
    getByText('detach left pipette')
    getByText('calibrate left pipette')
    getByText('detach right pipette')
    getByText('calibrate right pipette').click()
    getByText('mock pipette wizard flows')
  })
})
