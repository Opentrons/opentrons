import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { QueryClient, QueryClientProvider } from 'react-query'
import { i18n } from '../../../i18n'
import { ChoosePipette } from '../../../organisms/PipetteWizardFlows/ChoosePipette'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import { getIs96ChannelPipetteAttached } from '../../../organisms/Devices/utils'
import { PipetteWizardFlows } from '../../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../../organisms/GripperWizardFlows'
import { InstrumentsDashboard } from '../InstrumentsDashboard'
import { InstrumentDetail } from '../InstrumentDetail'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/GripperWizardFlows')
jest.mock('../../../organisms/PipetteWizardFlows')
jest.mock('../../../organisms/Devices/utils')
jest.mock('../../../organisms/PipetteWizardFlows/ChoosePipette')
jest.mock('../../../organisms/OnDeviceDisplay/Navigation')

const mockNavigation = Navigation as jest.MockedFunction<typeof Navigation>
const mockGripperWizardFlows = GripperWizardFlows as jest.MockedFunction<
  typeof GripperWizardFlows
>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
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
  const queryClient = new QueryClient()
  return renderWithProviders(
    <MemoryRouter initialEntries={['/instruments']} initialIndex={0}>
      <QueryClientProvider client={queryClient}>
        <Route path="/instruments">
          <InstrumentsDashboard />
        </Route>
        <Route path="/instruments/:mount">
          <InstrumentDetail />
        </Route>
      </QueryClientProvider>
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}
const mockGripperData = {
  instrumentModel: 'gripper_v1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: 'ghi789',
}
const mockRightPipetteData = {
  instrumentModel: 'p300_single_v2',
  instrumentType: 'p300',
  mount: 'right',
  serialNumber: 'abc123',
}
const mockLeftPipetteData = {
  instrumentModel: 'p1000_single_v2',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
}
describe('InstrumentsDashboard', () => {
  beforeEach(() => {
    mockNavigation.mockReturnValue(<div>mock Navigation</div>)
    mockChoosePipette.mockReturnValue(<div>mock choose pipette</div>)
    mockGetIs96ChannelPipetteAttached.mockReturnValue(false)
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [mockLeftPipetteData, mockRightPipetteData, mockGripperData],
      },
    } as any)
    mockPipetteWizardFlows.mockReturnValue(<div>mock pipette wizard flows</div>)
    mockGripperWizardFlows.mockReturnValue(<div>mock gripper wizard flows</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should render mount info for all attached mounts', () => {
    const [{ getByText }] = render()
    getByText('left Mount')
    getByText(mockLeftPipetteData.instrumentModel)
    getByText('right Mount')
    getByText(mockRightPipetteData.instrumentModel)
    getByText('extension Mount')
    getByText(mockGripperData.instrumentModel)
  })
  it('should route to left mount detail when instrument attached and clicked', async () => {
    const [{ getByText }] = render()
    await getByText('left Mount').click()
    getByText('serial number')
    getByText(mockLeftPipetteData.serialNumber)
  })
  it('should route to right mount detail when instrument attached and clicked', async () => {
    const [{ getByText }] = render()
    await getByText('right Mount').click()
    getByText('serial number')
    getByText(mockRightPipetteData.serialNumber)
  })
  it('should route to extension mount detail when instrument attached and clicked', async () => {
    const [{ getByText }] = render()
    await getByText('extension Mount').click()
    getByText('serial number')
    getByText(mockGripperData.serialNumber)
  })
  it('should open choose pipette to attach to left mount when empty and clicked', async () => {
    mockUseInstrumentsQuery.mockReturnValue({ data: { data: [] } } as any)
    const [{ getByText }] = render()
    await getByText('left Mount').click()
    getByText('mock choose pipette')
  })
  it('should open choose pipette to attach to right mount when empty and clicked', async () => {
    mockUseInstrumentsQuery.mockReturnValue({ data: { data: [] } } as any)
    const [{ getByText }] = render()
    await getByText('right Mount').click()
    getByText('mock choose pipette')
  })
  it('should open attach gripper wizard when extension mount item empty and clicked', async () => {
    mockUseInstrumentsQuery.mockReturnValue({ data: { data: [] } } as any)
    const [{ getByText }] = render()
    await getByText('extension Mount').click()
    getByText('mock gripper wizard flows')
  })
})
