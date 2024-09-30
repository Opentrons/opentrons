import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { useAllProtocolsQuery } from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
import {
  RecentRunProtocolCarousel,
  EmptyRecentRun,
} from '/app/organisms/ODD/RobotDashboard'
import { Navigation } from '/app/organisms/ODD/Navigation'
import { useMissingProtocolHardware } from '/app/transformations/commands'
import { getOnDeviceDisplaySettings } from '/app/redux/config'
import { WelcomeModal } from '../WelcomeModal'
import { RobotDashboard } from '..'
import { useNotifyAllRunsQuery } from '/app/resources/runs'

import type { ProtocolResource } from '@opentrons/shared-data'
import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})
vi.mock('@opentrons/react-api-client')
vi.mock('/app/organisms/ODD/RobotDashboard/EmptyRecentRun')
vi.mock('/app/organisms/ODD/RobotDashboard/RecentRunProtocolCarousel')
vi.mock('/app/organisms/ODD/Navigation')
vi.mock('/app/transformations/commands')
vi.mock('/app/redux/config')
vi.mock('../WelcomeModal')
vi.mock('/app/resources/runs')

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
  protocolKind: 'standard',
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
    render()
    expect(vi.mocked(Navigation)).toHaveBeenCalled()
    screen.getByText('Run again')
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
