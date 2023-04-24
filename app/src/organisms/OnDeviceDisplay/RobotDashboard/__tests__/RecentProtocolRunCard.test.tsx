import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { formatDistance } from 'date-fns'
import { when, resetAllWhenMocks } from 'jest-when'

import { renderWithProviders } from '@opentrons/components'
import { useAllRunsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { useMissingProtocolHardware } from '../../../../pages/Protocols/hooks'
import { useTrackEvent } from '../../../../redux/analytics'
import { useTrackProtocolRunEvent } from '../../../Devices/hooks'
import { RecentRunProtocolCard } from '../'

import type { ProtocolHardware } from '../../../../pages/Protocols/hooks'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../pages/Protocols/hooks')
jest.mock('../../../../organisms/Devices/hooks')

const mockProtocolName = 'mockProtocol'
const mockProtocolId = 'mockProtocolId'
const mockLastRun = '2023-04-12T21:30:49.124108+00:00'

const mockMissingPipette = [
  {
    hardwareType: 'pipette',
    pipetteName: 'p1000_single_gen3',
    mount: 'left',
    connected: false,
  },
] as ProtocolHardware[]

const mockMissingModule = [
  {
    hardwareType: 'module',
    moduleModel: 'temperatureModuleV2',
    slot: '1',
    connected: false,
  },
] as ProtocolHardware[]

const missingBoth = [
  {
    hardwareType: 'pipette',
    pipetteName: 'p1000_single_gen3',
    mount: 'left',
    connected: false,
  },
  {
    hardwareType: 'module',
    moduleModel: 'temperatureModuleV2',
    slot: '1',
    connected: false,
  },
] as ProtocolHardware[]
const RUN_ID = '95e67900-bc9f-4fbf-92c6-cc4d7226a51b'

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockRun = {
  actions: [],
  completedAt: '2023-04-12T15:14:13.811757+00:00',
  createdAt: '2023-04-12T15:13:52.110602+00:00',
  current: false,
  errors: [],
  // id: '853a3fae-8043-47de-8f03-5d28b3ee3d35',
  id: mockProtocolId,
  labware: [],
  labwareOffsets: [],
  liquids: [],
  modules: [],
  pipettes: [],
  protocolId: 'mockSortedProtocolID',
  status: 'stopped',
}

const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>
const mockUseMissingProtocolHardware = useMissingProtocolHardware as jest.MockedFunction<
  typeof useMissingProtocolHardware
>
const mockUseTrackProtocolRunEvent = useTrackProtocolRunEvent as jest.MockedFunction<
  typeof useTrackProtocolRunEvent
>
const mockUseTrackEvent = useTrackEvent as jest.MockedFunction<
  typeof useTrackEvent
>

const render = (props: React.ComponentProps<typeof RecentRunProtocolCard>) => {
  return renderWithProviders(<RecentRunProtocolCard {...props} />, {
    i18nInstance: i18n,
  })
}

let mockTrackEvent: jest.Mock
let mockTrackProtocolRunEvent: jest.Mock

describe('RecentRunProtocolCard', () => {
  let props: React.ComponentProps<typeof RecentRunProtocolCard>

  beforeEach(() => {
    props = {
      protocolName: mockProtocolName,
      protocolId: mockProtocolId,
      lastRun: mockLastRun,
    }
    mockUseAllRunsQuery.mockReturnValue({ data: { data: [mockRun] } } as any)
    mockTrackEvent = jest.fn()
    mockTrackProtocolRunEvent = jest.fn(
      () => new Promise(resolve => resolve({}))
    )
    mockUseTrackEvent.mockReturnValue(mockTrackEvent)
    mockUseMissingProtocolHardware.mockReturnValue([])
    when(mockUseTrackProtocolRunEvent).calledWith(RUN_ID).mockReturnValue({
      trackProtocolRunEvent: mockTrackProtocolRunEvent,
    })
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.clearAllMocks()
  })

  it('should render text', () => {
    const [{ getByText }] = render(props)
    const lastRunTime = formatDistance(new Date(mockLastRun), new Date(), {
      addSuffix: true,
    }).replace('about ', '')
    getByText('Ready to run')
    getByText('mockProtocol')
    getByText(`Last run ${lastRunTime}`)
  })

  it('should render missing chip when missing a pipette', () => {
    mockUseMissingProtocolHardware.mockReturnValue(mockMissingPipette)
    const [{ getByText }] = render(props)
    getByText('Missing 1 pipette')
  })

  it('should render missing chip when missing a module', () => {
    mockUseMissingProtocolHardware.mockReturnValue(mockMissingModule)
    const [{ getByText }] = render(props)
    getByText('Missing 1 module')
  })

  it('should render missing chip (module and pipette) when missing a pipette and a module', () => {
    mockUseMissingProtocolHardware.mockReturnValue(missingBoth)
    const [{ getByText }] = render(props)
    getByText('Missing hardware')
  })

  // it('when tapping a card, a mock function is called', () => {
  //   const [{ getByLabelText }] = render(props)
  //   const button = getByLabelText('RecentRunProtocolCard')
  //   fireEvent.click(button)
  //   expect(mockPush).toHaveBeenCalledWith(`protocols/${props.protocolId}`)
  // })
})
