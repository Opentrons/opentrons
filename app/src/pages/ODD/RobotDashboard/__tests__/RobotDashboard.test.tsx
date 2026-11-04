import { MemoryRouter } from 'react-router-dom'
import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { Navigation } from '/app/organisms/ODD/Navigation'
import {
  EmptyRecentRun,
  RecentRunProtocolCarousel,
} from '/app/organisms/ODD/RobotDashboard'
import { getOnDeviceDisplaySettings } from '/app/redux/config'
import { useNotifyAllRunsQuery } from '/app/resources/runs'
import { useMissingProtocolHardware } from '/app/transformations/commands'

import { RobotDashboard } from '..'
import { WelcomeModal } from '../WelcomeModal'

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
const mockRunData = {
  id: 'mockProtocol1',
  createdAt: '2022-05-03T21:36:12.494778+00:00',
  completedAt: 'thistime',
  startedAt: 'thistime',
  protocolId: 'mockProtocol1',
} as any

describe('RobotDashboard', () => {
  beforeEach(() => {
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

  it('should render the carousel while cards are resolving', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    render()
    expect(vi.mocked(Navigation)).toHaveBeenCalled()
    expect(vi.mocked(RecentRunProtocolCarousel)).toHaveBeenCalled()
  })

  it('should show run again header when cards resolve with standard protocols', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    render()
    const carouselProps = vi.mocked(RecentRunProtocolCarousel).mock.calls[0][0]
    act(() => {
      carouselProps.onCardResolved(mockRunData.id, true)
    })
    screen.getByText('Run again')
  })

  it('should show empty recent run when all cards resolve as quick-transfer', () => {
    vi.mocked(useNotifyAllRunsQuery).mockReturnValue({
      data: { data: [mockRunData] },
    } as any)
    render()
    const carouselProps = vi.mocked(RecentRunProtocolCarousel).mock.calls[0][0]
    act(() => {
      carouselProps.onCardResolved(mockRunData.id, false)
    })
    expect(vi.mocked(EmptyRecentRun)).toHaveBeenCalled()
  })

  it('should render WelcomeModal component when finish unboxing flow', () => {
    vi.mocked(getOnDeviceDisplaySettings).mockReturnValue({
      unfinishedUnboxingFlowRoute: '/robot-settings/rename-robot',
    } as any)
    render()
    expect(vi.mocked(WelcomeModal)).toHaveBeenCalled()
  })
})
