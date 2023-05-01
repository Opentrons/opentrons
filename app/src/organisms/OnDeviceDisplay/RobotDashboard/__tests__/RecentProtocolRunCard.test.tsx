import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { formatDistance } from 'date-fns'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { useMissingProtocolHardware } from '../../../../pages/Protocols/hooks'
import { RecentRunProtocolCard } from '../'

import type { ProtocolHardware } from '../../../../pages/Protocols/hooks'

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

const mockPush = jest.fn()
jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const mockUseMissingProtocolHardware = useMissingProtocolHardware as jest.MockedFunction<
  typeof useMissingProtocolHardware
>

const render = (props: React.ComponentProps<typeof RecentRunProtocolCard>) => {
  return renderWithProviders(<RecentRunProtocolCard {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RecentRunProtocolCard', () => {
  let props: React.ComponentProps<typeof RecentRunProtocolCard>

  beforeEach(() => {
    props = {
      protocolName: mockProtocolName,
      protocolId: mockProtocolId,
      lastRun: mockLastRun,
    }
    mockUseMissingProtocolHardware.mockReturnValue([])
  })

  afterEach(() => {
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

  it('when tapping a card, a mock function is called', () => {
    const [{ getByLabelText }] = render(props)
    const button = getByLabelText('RecentRunCard')
    fireEvent.click(button)
    expect(mockPush).toHaveBeenCalledWith(`protocols/${props.protocolId}`)
  })
})
