import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'

import { i18n } from '../../../i18n'
import {
  getConnectableRobots,
  getReachableRobots,
  getScanning,
  getUnreachableRobots,
  startDiscovery,
} from '../../../redux/discovery'
import { getRobotUpdateDisplayInfo } from '../../../redux/robot-update'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { getNetworkInterfaces } from '../../../redux/networking'
import { ChooseRobotSlideout } from '..'

jest.mock('../../../redux/discovery')
jest.mock('../../../redux/robot-update')
jest.mock('../../../redux/networking')

const mockGetBuildrootUpdateDisplayInfo = getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof getRobotUpdateDisplayInfo
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
const mockGetScanning = getScanning as jest.MockedFunction<typeof getScanning>
const mockStartDiscovery = startDiscovery as jest.MockedFunction<
  typeof startDiscovery
>
const mockGetNetworkInterfaces = getNetworkInterfaces as jest.MockedFunction<
  typeof getNetworkInterfaces
>

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

const mockSetSelectedRobot = jest.fn()

describe('ChooseRobotSlideout', () => {
  beforeEach(() => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: '',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockGetConnectableRobots.mockReturnValue([mockConnectableRobot])
    mockGetUnreachableRobots.mockReturnValue([mockUnreachableRobot])
    mockGetReachableRobots.mockReturnValue([mockReachableRobot])
    mockGetScanning.mockReturnValue(false)
    mockStartDiscovery.mockReturnValue({ type: 'mockStartDiscovery' } as any)
    mockGetNetworkInterfaces.mockReturnValue({ wifi: null, ethernet: null })
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders slideout if isExpanded true', () => {
    render({
      onCloseClick: jest.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: jest.fn(),
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })
    screen.getByText('choose robot slideout title')
  })
  it('shows a warning if the protocol has failed analysis', () => {
    render({
      onCloseClick: jest.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: jest.fn(),
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
      onCloseClick: jest.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: jest.fn(),
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })
    screen.getByText('opentrons-robot-name')
    screen.getByText('2 unavailable robots are not listed.')
  })
  it('if scanning, show robots, but do not show link to other devices', () => {
    mockGetScanning.mockReturnValue(true)
    render({
      onCloseClick: jest.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: jest.fn(),
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
      onCloseClick: jest.fn(),
      isExpanded: true,
      isSelectedRobotOnDifferentSoftwareVersion: false,
      selectedRobot: null,
      setSelectedRobot: mockSetSelectedRobot,
      title: 'choose robot slideout title',
      robotType: 'OT-2 Standard',
    })[1]
    const refreshButton = screen.getByRole('button', { name: 'refresh' })
    fireEvent.click(refreshButton)
    expect(mockStartDiscovery).toHaveBeenCalled()
    expect(dispatch).toHaveBeenCalledWith({ type: 'mockStartDiscovery' })
  })
  it('defaults to first available robot and allows an available robot to be selected', () => {
    mockGetConnectableRobots.mockReturnValue([
      { ...mockConnectableRobot, name: 'otherRobot', ip: 'otherIp' },
      mockConnectableRobot,
    ])
    render({
      onCloseClick: jest.fn(),
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
