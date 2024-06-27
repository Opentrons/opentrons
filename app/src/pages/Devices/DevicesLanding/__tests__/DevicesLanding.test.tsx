import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { vi, it, describe, expect, beforeEach, afterEach } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { DevicesEmptyState } from '../../../../organisms/Devices/DevicesEmptyState'
import { RobotCard } from '../../../../organisms/Devices/RobotCard'
import {
  getScanning,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
} from '../../../../redux/discovery'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import { DevicesLanding } from '..'

vi.mock('../../../../organisms/Devices/DevicesEmptyState')
vi.mock('../../../../organisms/Devices/RobotCard')
vi.mock('../../../../redux/discovery')

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
    const [{ getByText }] = render()

    getByText('Devices')
  })

  it('renders the DevicesEmptyState when no robots are found', () => {
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    const [{ getByText }] = render()

    getByText('Mock DevicesEmptyState')
  })

  it('renders the Looking for robots copy when scanning is true and there are no devices', () => {
    vi.mocked(getScanning).mockReturnValue(true)
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    const [{ getByText }] = render()

    getByText('Looking for robots')
  })

  it('renders the Icon when scanning is true and there are no devices', () => {
    vi.mocked(getScanning).mockReturnValue(true)
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    const [{ getByLabelText }] = render()

    getByLabelText('ot-spinner')
  })

  it('renders available and not available sections when both are present', () => {
    const [{ getByText, getByTestId, queryByText }] = render()

    getByText('Mock Robot connectableRobot')
    getByText('Available (1)')
    getByText('Not available (2)')

    expect(queryByText('Mock Robot unreachableRobot')).toBeNull()
    expect(queryByText('Mock Robot reachableRobot')).toBeNull()

    const expandButton = getByTestId(
      'CollapsibleSection_expand_Not available (2)'
    )
    fireEvent.click(expandButton)

    getByText('Mock Robot unreachableRobot')
    getByText('Mock Robot reachableRobot')
  })
  it('does not render available or not available sections when none are present', () => {
    vi.mocked(getConnectableRobots).mockReturnValue([])
    vi.mocked(getReachableRobots).mockReturnValue([])
    vi.mocked(getUnreachableRobots).mockReturnValue([])
    const [{ queryByText }] = render()

    expect(queryByText('Available')).toBeNull()
    expect(queryByText('Not available')).toBeNull()
  })
})
