import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'

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

jest.mock('../../../../organisms/Devices/DevicesEmptyState')
jest.mock('../../../../organisms/Devices/RobotCard')
jest.mock('../../../../redux/discovery')

const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>
const mockRobotCard = RobotCard as jest.MockedFunction<typeof RobotCard>
const mockDevicesEmptyState = DevicesEmptyState as jest.MockedFunction<
  typeof DevicesEmptyState
>
const mockGetConnectableRobots = getConnectableRobots as jest.MockedFunction<
  typeof getConnectableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockGetUnreachableRobots = getUnreachableRobots as jest.MockedFunction<
  typeof getUnreachableRobots
>

const render = () => {
  return renderWithProviders(<DevicesLanding />, {
    i18nInstance: i18n,
  })
}

describe('DevicesLanding', () => {
  beforeEach(() => {
    mockGetScanning.mockReturnValue(false)
    mockRobotCard.mockImplementation(({ robot: { name } }) => (
      <div>Mock Robot {name}</div>
    ))
    mockDevicesEmptyState.mockReturnValue(<div>Mock DevicesEmptyState</div>)
    mockGetConnectableRobots.mockReturnValue([
      { ...mockConnectableRobot, name: 'connectableRobot' },
    ])
    mockGetReachableRobots.mockReturnValue([
      { ...mockReachableRobot, name: 'reachableRobot' },
    ])
    mockGetUnreachableRobots.mockReturnValue([
      { ...mockUnreachableRobot, name: 'unreachableRobot' },
    ])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a Devices title', () => {
    const [{ getByText }] = render()

    getByText('Devices')
  })

  it('renders the DevicesEmptyState when no robots are found', () => {
    mockGetConnectableRobots.mockReturnValue([])
    mockGetReachableRobots.mockReturnValue([])
    mockGetUnreachableRobots.mockReturnValue([])
    const [{ getByText }] = render()

    getByText('Mock DevicesEmptyState')
  })

  it('renders the Looking for robots copy when scanning is true and there are no devices', () => {
    mockGetScanning.mockReturnValue(true)
    mockGetConnectableRobots.mockReturnValue([])
    mockGetReachableRobots.mockReturnValue([])
    mockGetUnreachableRobots.mockReturnValue([])
    const [{ getByText }] = render()

    getByText('Looking for robots')
  })

  it('renders the Icon when scanning is true and there are no devices', () => {
    mockGetScanning.mockReturnValue(true)
    mockGetConnectableRobots.mockReturnValue([])
    mockGetReachableRobots.mockReturnValue([])
    mockGetUnreachableRobots.mockReturnValue([])
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
    mockGetConnectableRobots.mockReturnValue([])
    mockGetReachableRobots.mockReturnValue([])
    mockGetUnreachableRobots.mockReturnValue([])
    const [{ queryByText }] = render()

    expect(queryByText('Available')).toBeNull()
    expect(queryByText('Not available')).toBeNull()
  })
})
