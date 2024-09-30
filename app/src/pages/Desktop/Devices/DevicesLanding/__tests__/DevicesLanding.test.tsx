import { fireEvent, screen } from '@testing-library/react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { DevicesEmptyState } from '/app/organisms/Desktop/Devices/DevicesEmptyState'
import { RobotCard } from '/app/organisms/Desktop/Devices/RobotCard'
import {
  getScanning,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '/app/redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'
import { DevicesLanding } from '..'

vi.mock('/app/organisms/Desktop/Devices/DevicesEmptyState')
vi.mock('/app/organisms/Desktop/Devices/RobotCard')
vi.mock('/app/redux/discovery')

const render = () => {
  return renderWithProviders(<DevicesLanding />, {
    i18nInstance: i18n,
  })
}

describe('DevicesLanding', () => {
  beforeEach(() => {
    vi.mocked(getScanning).mockReturnValue(false)
    vi.mocked(RobotCard).mockImplementation(({ robot: { name } }) => (
      <div>Mock Robot {name}</div>
    ))
    vi.mocked(DevicesEmptyState).mockReturnValue(
      <div>Mock DevicesEmptyState</div>
    )
    vi.mocked(getConnectableRobots).mockReturnValue([
      { ...mockConnectableRobot, name: 'connectableRobot' },
    ])
    vi.mocked(getReachableRobots).mockReturnValue([
      { ...mockReachableRobot, name: 'reachableRobot' },
    ])
    vi.mocked(getUnreachableRobots).mockReturnValue([
      { ...mockUnreachableRobot, name: 'unreachableRobot' },
    ])
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders a Devices title', () => {
    render()

    screen.getByText('Devices')
  })

  it('renders the DevicesEmptyState when no robots are found', () => {
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    render()

    screen.getByText('Mock DevicesEmptyState')
  })

  it('renders the Looking for robots copy when scanning is true and there are no devices', () => {
    vi.mocked(getScanning).mockReturnValue(true)
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    render()

    screen.getByText('Looking for robots')
  })

  it('renders the Icon when scanning is true and there are no devices', () => {
    vi.mocked(getScanning).mockReturnValue(true)
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    render()

    screen.getByLabelText('ot-spinner')
  })

  it('renders available and not available sections when both are present', () => {
    render()

    screen.getByText('Mock Robot connectableRobot')
    screen.getByText('Available (1)')
    screen.getByText('Not available (2)')

    expect(screen.queryByText('Mock Robot unreachableRobot')).toBeNull()
    expect(screen.queryByText('Mock Robot reachableRobot')).toBeNull()

    const expandButton = screen.getByTestId(
      'CollapsibleSection_expand_Not available (2)'
    )
    fireEvent.click(expandButton)

    screen.getByText('Mock Robot unreachableRobot')
    screen.getByText('Mock Robot reachableRobot')
  })
  it('does not render available or not available sections when none are present', () => {
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    render()

    expect(screen.queryByText('Available')).toBeNull()
    expect(screen.queryByText('Not available')).toBeNull()
  })
})
