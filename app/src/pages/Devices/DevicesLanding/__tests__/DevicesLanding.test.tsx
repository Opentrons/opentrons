import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { DevicesEmptyState } from '../../../../organisms/Devices/DevicesEmptyState'
import { RobotSection } from '../../../../organisms/Devices/RobotSection'
import { Scanning } from '../../../../organisms/Devices/Scanning'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../../redux/discovery/__fixtures__'
import {
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getScanning,
} from '../../../../redux/discovery'
import { DevicesLanding } from '..'

jest.mock('../../../../organisms/Devices/DevicesEmptyState')
jest.mock('../../../../organisms/Devices/RobotSection')
jest.mock('../../../../organisms/Devices/Scanning')
jest.mock('../../../../redux/discovery')

const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>
const mockGetConnectableRobots = getConnectableRobots as jest.MockedFunction<
  typeof getConnectableRobots
>
const mockGetReachableRobots = getReachableRobots as jest.MockedFunction<
  typeof getReachableRobots
>
const mockGetUnreachableRobots = getUnreachableRobots as jest.MockedFunction<
  typeof getUnreachableRobots
>

const mockScanning = Scanning as jest.MockedFunction<typeof Scanning>
const mockDevicesEmptyState = DevicesEmptyState as jest.MockedFunction<
  typeof DevicesEmptyState
>
const mockRobotSection = RobotSection as jest.MockedFunction<
  typeof RobotSection
>

const render = () => {
  return renderWithProviders(<DevicesLanding />, {
    i18nInstance: i18n,
  })
}

describe('DevicesLanding', () => {
  beforeEach(() => {
    mockGetScanning.mockReturnValue(false)
    mockScanning.mockReturnValue(<div>Mock Scanning</div>)
    mockDevicesEmptyState.mockReturnValue(<div>Mock DevicesEmptyState</div>)
    mockRobotSection.mockReturnValue(<div>Mock RobotSection</div>)
    mockGetConnectableRobots.mockReturnValue([])
    mockGetReachableRobots.mockReturnValue([])
    mockGetUnreachableRobots.mockReturnValue([])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a Devices title', () => {
    const [{ getByText }] = render()

    getByText('Devices')
  })

  it('renders a Scanning component when scanning for robots', () => {
    mockGetScanning.mockReturnValue(true)
    const [{ getByText }] = render()

    getByText('Mock Scanning')
  })

  it('renders the DevicesEmptyState when no robots are found', () => {
    const [{ getByText }] = render()

    getByText('Mock DevicesEmptyState')
  })

  it('renders a RobotSection when connectable robots are found', () => {
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    const [{ getByText }] = render()

    getByText('Mock RobotSection')
  })

  it('renders a RobotSection when reachable robots are found', () => {
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    const [{ getByText }] = render()

    getByText('Mock RobotSection')
  })

  it('renders a RobotSection when unreachable robots are found', () => {
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    const [{ getByText }] = render()

    getByText('Mock RobotSection')
  })
})
