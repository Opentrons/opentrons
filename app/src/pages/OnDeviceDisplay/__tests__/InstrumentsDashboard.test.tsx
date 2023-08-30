import * as React from 'react'
import { Route } from 'react-router'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { ChoosePipette } from '../../../organisms/PipetteWizardFlows/ChoosePipette'
import { Navigation } from '../../../organisms/Navigation'
import { formatTimestamp } from '../../../organisms/Devices/utils'
import { PipetteWizardFlows } from '../../../organisms/PipetteWizardFlows'
import { GripperWizardFlows } from '../../../organisms/GripperWizardFlows'
import { InstrumentsDashboard } from '../InstrumentsDashboard'
import { InstrumentDetail } from '../InstrumentDetail'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../organisms/GripperWizardFlows')
jest.mock('../../../organisms/PipetteWizardFlows')
jest.mock('../../../organisms/PipetteWizardFlows/ChoosePipette')
jest.mock('../../../organisms/Navigation')

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
  ok: true,
  subsystem: 'gripper',
  data: {
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2023-05-04T13:38:26.649Z',
    },
  },
}
const mockRightPipetteData = {
  instrumentModel: 'p50_single_v3.0',
  instrumentType: 'p50',
  mount: 'right',
  serialNumber: 'abc123',
  ok: true,
  subsystem: 'pipette_right',
  data: {
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2022-05-04T13:38:26.649Z',
    },
  },
}
const mockLeftPipetteData = {
  instrumentModel: 'p1000_single_v3.0',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
  ok: true,
  subsystem: 'pipette_left',
  data: {
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2023-05-04T13:38:26.649Z',
    },
  },
}
const mock96ChannelData = {
  instrumentModel: 'p1000_96_v3.0',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
  ok: true,
  subsystem: 'pipette_left',
  data: {
    channels: 96,
    calibratedOffset: {
      offset: { x: 0, y: 0, z: 0 },
      source: 'default',
      last_modified: '2023-05-04T13:38:26.649Z',
    },
  },
}
describe('InstrumentsDashboard', () => {
  beforeEach(() => {
    mockNavigation.mockReturnValue(<div>mock Navigation</div>)
    mockChoosePipette.mockReturnValue(<div>mock choose pipette</div>)
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
    getByText('Flex 1-Channel 1000 μL')
    getByText('right Mount')
    getByText('Flex 1-Channel 50 μL')
    getByText('extension Mount')
    getByText('Flex Gripper')
  })
  it('should route to left mount detail when instrument attached and clicked', async () => {
    const [{ getByText }] = render()
    await getByText('left Mount').click()
    getByText('serial number')
    getByText(mockLeftPipetteData.serialNumber)
    getByText(
      formatTimestamp(mockLeftPipetteData.data.calibratedOffset.last_modified)
    )
  })
  it('should route to right mount detail when instrument attached and clicked', async () => {
    const [{ getByText }] = render()
    await getByText('right Mount').click()
    getByText('serial number')
    getByText(mockRightPipetteData.serialNumber)
    getByText(
      formatTimestamp(mockRightPipetteData.data.calibratedOffset.last_modified)
    )
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
  it('should render the correct info for 96 channel attached', async () => {
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [mock96ChannelData, mockGripperData],
      },
    } as any)
    const [{ getByText }] = render()
    getByText('Left+Right Mounts')
    getByText('extension Mount')
  })
})
