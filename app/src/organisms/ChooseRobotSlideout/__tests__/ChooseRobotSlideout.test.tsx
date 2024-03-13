import * as React from 'react'
import { vi, it, describe, expect, beforeEach } from 'vitest'

import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  startDiscovery,
} from '../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { useFeatureFlag } from '../../../redux/config'
import { getNetworkInterfaces } from '../../../redux/networking'
import { ChooseRobotSlideout } from '..'
import { useNotifyService } from '../../../resources/useNotifyService'

vi.mock('../../../redux/discovery')
vi.mock('../../../redux/robot-update')
vi.mock('../../../redux/networking')
vi.mock('../../../resources/useNotifyService')
vi.mock('../../../redux/config')
const render = (props: React.ComponentProps<typeof ChooseRobotSlideout>) => {
  return renderWithProviders(
    <StaticRouter>
      <ChooseRobotSlideout {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

const mockSetSelectedRobot = vi.fn()

describe('ChooseRobotSlideout', () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockReturnValue(true)
    vi.mocked(getConnectableRobots).mockReturnValue([mockConnectableRobot])
    vi.mocked(getUnreachableRobots).mockReturnValue([mockUnreachableRobot])
    vi.mocked(getReachableRobots).mockReturnValue([mockReachableRobot])
    vi.mocked(getScanning).mockReturnValue(false)
    vi.mocked(startDiscovery).mockReturnValue({
      type: 'mockStartDiscovery',
    } as any)
    vi.mocked(getNetworkInterfaces).mockReturnValue({
      wifi: null,
      ethernet: null,
    })
    vi.mocked(useNotifyService).mockReturnValue({} as any)
  })

  it('renders slideout if isExpanded true', () => {
    render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: vi.fn(),
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })
    screen.getByText('choose robot slideout title')
  })
  it('shows a warning if the protocol has failed analysis', () => {
    render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: vi.fn(),
      title: 'choose robot slideout title',
      isAnalysisError: true,
      robotType: 'OT-2 Standard',
    })
    screen.getByText(
      'This protocol failed in-app analysis. It may be unusable on robots without custom software configurations.'
    )
  })
  it('renders an available robot option for every connectable robot, and link for other robots', () => {
    render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: vi.fn(),
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })
    screen.getByText('opentrons-robot-name')
    screen.getByText('2 unavailable robots are not listed.')
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    vi.mocked(getScanning).mockReturnValue(true)
    render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: vi.fn(),
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })
    screen.getByText('opentrons-robot-name')
    expect(
      screen.queryByText('2 unavailable robots are not listed.')
    ).not.toBeInTheDocument()
  })
  it('if not scanning, show refresh button, start discovery if clicked', () => {
    const { dispatch } = render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: mockSetSelectedRobot,
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })[1]
    const refreshButton = screen.getByRole('button', { name: 'refresh' })
    fireEvent.click(refreshButton)
    expect(vi.mocked(startDiscovery)).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('renders the multi slideout page 1', () => {
    render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: mockSetSelectedRobot,
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
      multiSlideout: { currentPage: 1 },
    })
    screen.getByText('Step 1 / 2')
  })
  it('renders the multi slideout page 2', () => {
    render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: mockSetSelectedRobot,
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
      multiSlideout: { currentPage: 2 },
    })
    screen.getByText('Step 2 / 2')
  })
  it('defaults to first available robot and allows an available robot to be selected', () => {
    vi.mocked(getConnectableRobots).mockReturnValue([
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
      mockConnectableRobot,
    ])
    render({
      onCloseClick: vi.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: mockSetSelectedRobot,
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })
    expect(mockSetSelectedRobot).toBeCalledWith({
      ...mockConnectableRobot,
      name: 'otherRobot',
      ip: 'otherIp',
    })
    const mockRobot = screen.getByText('opentrons-robot-name')
    fireEvent.click(mockRobot) // unselect default robot
    expect(mockSetSelectedRobot).toBeCalledWith(mockConnectableRobot)
    const otherRobot = screen.getByText('otherRobot')
    fireEvent.click(otherRobot)
    expect(mockSetSelectedRobot).toBeCalledWith({
      ...mockConnectableRobot,
      name: 'otherRobot',
      ip: 'otherIp',
    })
  })
})
