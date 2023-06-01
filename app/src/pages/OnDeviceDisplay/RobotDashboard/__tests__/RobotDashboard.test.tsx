import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { EmptyRecentRun } from '../../../../organisms/OnDeviceDisplay/RobotDashboard/EmptyRecentRun'
import { RecentRunProtocolCarousel } from '../../../../organisms/OnDeviceDisplay/RobotDashboard'
import { Navigation } from '../../../../organisms/OnDeviceDisplay/Navigation'
import { useMissingProtocolHardware } from '../../../Protocols/hooks'
import { getOnDeviceDisplaySettings } from '../../../../redux/config'
import { WelcomedModal } from '../WelcomeModal'
import { RobotDashboard } from '../../RobotDashboard'

import type { ProtocolResource } from '@opentrons/shared-data'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})
jest.mock('@opentrons/react-api-client')
jest.mock('../../../../organisms/OnDeviceDisplay/RobotDashboard/EmptyRecentRun')
jest.mock(
  '../../../../organisms/OnDeviceDisplay/RobotDashboard/RecentRunProtocolCarousel'
)
jest.mock('../../../../organisms/OnDeviceDisplay/Navigation')
jest.mock('../../../Protocols/hooks')
jest.mock('../../../../redux/config')
jest.mock('../WelcomeModal')

const mockNavigation = Navigation as jest.MockedFunction<typeof Navigation>
const mockUseAllProtocolsQuery = useAllProtocolsQuery as jest.MockedFunction<
  typeof useAllProtocolsQuery
>
const mockUseAllRunsQuery = useAllRunsQuery as jest.MockedFunction<
  typeof useAllRunsQuery
>
const mockEmptyRecentRun = EmptyRecentRun as jest.MockedFunction<
  typeof EmptyRecentRun
>
const mockUseMissingProtocolHardware = useMissingProtocolHardware as jest.MockedFunction<
  typeof useMissingProtocolHardware
>
const mockRecentRunProtocolCarousel = RecentRunProtocolCarousel as jest.MockedFunction<
  typeof RecentRunProtocolCarousel
>
const mockGetOnDeviceDisplaySettings = getOnDeviceDisplaySettings as jest.MockedFunction<
  typeof getOnDeviceDisplaySettings
>
const mockWelcomeModal = WelcomedModal as jest.MockedFunction<
  typeof WelcomedModal
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotDashboard />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}
const mockProtocol: ProtocolResource = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  protocolType: 'json',
  robotType: 'OT-3 Standard',
  metadata: {
    protocolName: 'yay mock protocol',
    author: 'engineering',
    description: 'A short mock protocol',
    created: 1606853851893,
    tags: ['unitTest'],
  },
  analysisSummaries: [],
  files: [],
  key: '26ed5a82-502f-4074-8981-57cdda1d066d',
}
const mockRunData = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  completedAt: 'thistime',
  startedAt: 'thistime',
  protocolId: 'mockProtocol1',
} as any

describe('RobotDashboard', () => {
  beforeEach(() => {
    mockEmptyRecentRun.mockReturnValue(<div> mock EmptyRecentRun</div>)
    mockNavigation.mockReturnValue(<div>mock Navigation</div>)
    mockUseAllProtocolsQuery.mockReturnValue({} as any)
    mockUseAllRunsQuery.mockReturnValue({} as any)
    mockUseMissingProtocolHardware.mockReturnValue([])
    mockRecentRunProtocolCarousel.mockReturnValue(
      <div>mock RecentRunProtocolCarousel</div>
    )
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      unfinishedUnboxingFlowRoute: null,
    } as any)
    mockWelcomeModal.mockReturnValue(<div>mock WelcomeModal</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render empty recent run image and buttons', () => {
    const [{ getByText }] = render()
    getByText('mock Navigation')
    getByText('mock EmptyRecentRun')
  })

  it('should render a recent run protocol carousel', () => {
    mockUseAllProtocolsQuery.mockReturnValue({
      data: {
        data: [mockProtocol],
      },
    } as any)
    mockUseAllRunsQuery.mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    const [{ getByText }] = render()
    getByText('mock Navigation')
    getByText('Run again')
    getByText('mock RecentRunProtocolCarousel')
  })

  it('should render WelcomeModal component when finish unboxing flow', () => {
    mockGetOnDeviceDisplaySettings.mockReturnValue({
      unfinishedUnboxingFlowRoute: '/robot-settings/rename-robot',
    } as any)
    const [{ getByText }] = render()
    getByText('mock WelcomeModal')
  })
})
