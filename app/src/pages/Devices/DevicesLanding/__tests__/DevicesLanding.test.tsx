import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { DevicesEmptyState } from '../../../../organisms/Devices/DevicesEmptyState'
import { RobotCard } from '../../../../organisms/Devices/RobotCard'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import { getScanning } from '../../../../redux/discovery'
import { useAvailableAndUnavailableDevices } from '../hooks'
import { DevicesLanding } from '..'

jest.mock('../../../../organisms/Devices/DevicesEmptyState')
jest.mock('../../../../organisms/Devices/RobotCard')
jest.mock('../../../../redux/discovery')
jest.mock('../hooks')

const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>

const mockRobotCard = RobotCard as jest.MockedFunction<typeof RobotCard>
const mockDevicesEmptyState = DevicesEmptyState as jest.MockedFunction<
  typeof DevicesEmptyState
>
const mockUseAvailableAndUnavailableDevices = useAvailableAndUnavailableDevices as jest.MockedFunction<
  typeof useAvailableAndUnavailableDevices
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
    mockUseAvailableAndUnavailableDevices.mockReturnValue({
      availableDevices: [{ ...mockConnectableRobot, name: 'connectableRobot' }],
      unavailableDevices: [
        { ...mockReachableRobot, name: 'reachableRobot' },
        { ...mockUnreachableRobot, name: 'unreachableRobot' },
      ],
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a Devices title', () => {
    const [{ getByText }] = render()

    getByText('Devices')
  })

  it('renders the DevicesEmptyState when no robots are found', () => {
    mockUseAvailableAndUnavailableDevices.mockReturnValue({
      availableDevices: [],
      unavailableDevices: [],
    })
    const [{ getByText }] = render()

    getByText('Mock DevicesEmptyState')
  })

  it('renders available and unavailable sections when both are present', () => {
    const [{ getByText }] = render()

    getByText('Mock Robot connectableRobot')
    getByText('Available (1)')
    getByText('Mock Robot unreachableRobot')
    getByText('Mock Robot reachableRobot')
    getByText('Unavailable (2)')
  })
  it('does not render available or unavailable sections when none are present', () => {
    mockUseAvailableAndUnavailableDevices.mockReturnValue({
      availableDevices: [],
      unavailableDevices: [],
    })
    const [{ queryByText }] = render()

    expect(queryByText('Available')).toBeFalsy()
    expect(queryByText('Unavailable')).toBeFalsy()
  })
})
