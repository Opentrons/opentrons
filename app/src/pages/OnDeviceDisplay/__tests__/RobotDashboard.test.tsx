import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { COLORS, renderWithProviders } from '@opentrons/components'
import {
  useAllProtocolsQuery,
  useAllRunsQuery,
} from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import { EmptyRecentRun } from '../../../organisms/OnDeviceDisplay/RobotDashboard/EmptyRecentRun'
import { Navigation } from '../../../organisms/OnDeviceDisplay/Navigation'
import { useMissingProtocolHardware } from '../../Protocols/hooks'
import { RobotDashboard } from '../RobotDashboard'

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
jest.mock('../../../organisms/OnDeviceDisplay/RobotDashboard/EmptyRecentRun')
jest.mock('../../../organisms/OnDeviceDisplay/Navigation')
jest.mock('../../Protocols/hooks')

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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render empty recent run image and buttons', () => {
    const [{ getByText }] = render()
    getByText('mock Navigation')
    getByText('mock EmptyRecentRun')
  })
  it('should render a recent protocol with all the required info to run, clicking card goes to run history', () => {
    mockUseAllProtocolsQuery.mockReturnValue({
      data: {
        data: [mockProtocol],
      },
    } as any)
    mockUseAllRunsQuery.mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    const [{ getByText, getByLabelText }] = render()
    getByText('mock Navigation')
    getByText('Ready to run')
    getByText('Run again')
    getByText('yay mock protocol')
    getByLabelText('icon_Ready to run')
    const recentRunCard = getByLabelText('RecentRunCard')
    expect(recentRunCard).toHaveStyle(`background-color: ${COLORS.green3}`)
    fireEvent.click(recentRunCard)
    expect(mockPush).toHaveBeenCalledWith('protocols/mockProtocol1')
  })
  it('should render a recent protocol with required modules', () => {
    mockUseAllProtocolsQuery.mockReturnValue({
      data: {
        data: [mockProtocol],
      },
    } as any)
    mockUseAllRunsQuery.mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    mockUseMissingProtocolHardware.mockReturnValue([
      {
        hardwareType: 'module',
        slot: '1',
        connected: false,
        moduleModel: 'heaterShakerModuleV1',
      },
      {
        hardwareType: 'module',
        slot: '3',
        connected: false,
        moduleModel: 'magneticModuleV1',
      },
    ])

    const [{ getByText, getByLabelText }] = render()
    getByText('mock Navigation')
    getByText('Run again')
    getByText('yay mock protocol')
    getByText('Missing 2 modules')
    getByLabelText('icon_Missing 2 modules')
    expect(getByLabelText('RecentRunCard')).toHaveStyle(
      `background-color: ${COLORS.yellow3}`
    )
  })
  it('should render a recent protocol with required pipette', () => {
    mockUseAllProtocolsQuery.mockReturnValue({
      data: {
        data: [mockProtocol],
      },
    } as any)
    mockUseAllRunsQuery.mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    mockUseMissingProtocolHardware.mockReturnValue([
      {
        hardwareType: 'pipette',
        connected: false,
        mount: 'left',
        pipetteName: 'p1000_multi_gen3',
      },
    ])

    const [{ getByText, getByLabelText }] = render()
    getByText('mock Navigation')
    getByText('Run again')
    getByText('yay mock protocol')
    getByText('Missing 1 pipette')
    getByLabelText('icon_Missing 1 pipette')
    expect(getByLabelText('RecentRunCard')).toHaveStyle(
      `background-color: ${COLORS.yellow3}`
    )
  })
  it('should render a recent protocol with required pipette and modules', () => {
    mockUseAllProtocolsQuery.mockReturnValue({
      data: {
        data: [mockProtocol],
      },
    } as any)
    mockUseAllRunsQuery.mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    mockUseMissingProtocolHardware.mockReturnValue([
      {
        hardwareType: 'pipette',
        connected: false,
        mount: 'left',
        pipetteName: 'p1000_multi_gen3',
      },
      {
        hardwareType: 'module',
        slot: '3',
        connected: false,
        moduleModel: 'magneticModuleV1',
      },
    ])

    const [{ getByText, getByLabelText }] = render()
    getByText('mock Navigation')
    getByText('Run again')
    getByText('yay mock protocol')
    getByText('Missing hardware')
    getByLabelText('icon_Missing hardware')
    expect(getByLabelText('RecentRunCard')).toHaveStyle(
      `background-color: ${COLORS.yellow3}`
    )
  })
})
