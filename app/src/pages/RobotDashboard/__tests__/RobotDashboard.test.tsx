import * as React from 'react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { renderWithProviders } from '../../../__testing-utils__'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../i18n'
import {
  RecentRunProtocolCarousel,
  EmptyRecentRun,
} from '../../../organisms/OnDeviceDisplay/RobotDashboard'
import { Navigation } from '../../../organisms/Navigation'
import { useMissingProtocolHardware } from '../../Protocols/hooks'
import { getOnDeviceDisplaySettings } from '../../../redux/config'
import { WelcomeModal } from '../WelcomeModal'
import { RobotDashboard } from '..'
import { useNotifyAllRunsQuery } from '../../../resources/runs'

import type { ProtocolResource } from '@opentrons/shared-data'
import type * as ReactRouterDom from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('../../../organisms/OnDeviceDisplay/RobotDashboard/EmptyRecentRun')
vi.mock(
  '../../../organisms/OnDeviceDisplay/RobotDashboard/RecentRunProtocolCarousel'
)
vi.mock('../../../organisms/Navigation')
vi.mock('../../Protocols/hooks')
vi.mock('../../../redux/config')
vi.mock('../WelcomeModal')
vi.mock('../../../resources/runs')

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
    vi.mocked(useAllProtocolsQuery).mockReturnValue({} as any)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({} as any)
    vi.mocked(useMissingProtocolHardware).mockReturnValue({
      missingProtocolHardware: [],
      isLoading: false,
      conflictedSlots: [],
    })
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue({
      unfinishedUnboxingFlowRoute: null,
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render empty recent run image and buttons', () => {
    render()
    expect(vi.mocked(Navigation)).toHaveBeenCalled()
    expect(vi.mocked(EmptyRecentRun)).toHaveBeenCalled()
  })

  it('should render a recent run protocol carousel', () => {
    vi.mocked(useAllProtocolsQuery).mockReturnValue({
      data: {
        data: [mockProtocol],
      },
    } as any)
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    const [{ getByText }] = render()
    expect(vi.mocked(Navigation)).toHaveBeenCalled()
    getByText('Run again')
    expect(vi.mocked(RecentRunProtocolCarousel)).toHaveBeenCalled()
  })

  it('should render WelcomeModal component when finish unboxing flow', () => {
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue({
      unfinishedUnboxingFlowRoute: '/robot-settings/rename-robot',
    } as any)
    render()
    expect(vi.mocked(WelcomeModal)).toHaveBeenCalled()
  })
})
