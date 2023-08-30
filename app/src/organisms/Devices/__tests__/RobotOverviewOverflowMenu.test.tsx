import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { home } from '../../../redux/robot-controls'
import * as Buildroot from '../../../redux/robot-update'
import { restartRobot } from '../../../redux/robot-admin'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { useCanDisconnect } from '../../../resources/networking/hooks'
import { DisconnectModal } from '../../../organisms/Devices/RobotSettings/ConnectNetwork/DisconnectModal'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'
import { useIsRobotBusy } from '../hooks'
import { UpdateBuildroot } from '../RobotSettings/UpdateBuildroot'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/robot-admin')
jest.mock('../hooks')
jest.mock('../../../redux/robot-update')
jest.mock('../../../resources/networking/hooks')
jest.mock(
  '../../../organisms/Devices/RobotSettings/ConnectNetwork/DisconnectModal'
)
jest.mock('../../ChooseProtocolSlideout')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../RobotSettings/UpdateBuildroot')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockGetBuildrootUpdateDisplayInfo = Buildroot.getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof Buildroot.getRobotUpdateDisplayInfo
>
const mockHome = home as jest.MockedFunction<typeof home>
const mockRestartRobot = restartRobot as jest.MockedFunction<
  typeof restartRobot
>
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>
const mockUpdateBuildroot = UpdateBuildroot as jest.MockedFunction<
  typeof UpdateBuildroot
>
const mockChooseProtocolSlideout = ChooseProtocolSlideout as jest.MockedFunction<
  typeof ChooseProtocolSlideout
>
const mockDisconnectModal = DisconnectModal as jest.MockedFunction<
  typeof DisconnectModal
>
const mockUseCanDisconnect = useCanDisconnect as jest.MockedFunction<
  typeof useCanDisconnect
>

const render = (
  props: React.ComponentProps<typeof RobotOverviewOverflowMenu>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotOverviewOverflowMenu {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('RobotOverviewOverflowMenu', () => {
  let props: React.ComponentProps<typeof RobotOverviewOverflowMenu>
  jest.useFakeTimers()

  beforeEach(() => {
    props = { robot: mockConnectableRobot }
    when(mockGetBuildrootUpdateDisplayInfo)
      .calledWith({} as State, mockConnectableRobot.name)
      .mockReturnValue({
        autoUpdateAction: 'reinstall',
        autoUpdateDisabledReason: null,
        updateFromFileDisabledReason: null,
      })
    when(mockUseCurrentRunId).calledWith().mockReturnValue(null)
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(false)
    when(mockUpdateBuildroot).mockReturnValue(<div>mock update buildroot</div>)
    when(mockChooseProtocolSlideout).mockReturnValue(
      <div>choose protocol slideout</div>
    )
    when(mockDisconnectModal).mockReturnValue(<div>mock disconnect modal</div>)
    when(mockUseCanDisconnect)
      .calledWith(mockConnectableRobot.name)
      .mockReturnValue(true)
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.resetAllMocks()
  })

  it('should render enabled buttons in the menu when the status is idle', () => {
    const { getByRole, queryByText } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const runAProtocolBtn = getByRole('button', {
      name: 'Run a protocol',
    })
    const restartBtn = getByRole('button', { name: 'Restart robot' })
    const homeBtn = getByRole('button', { name: 'Home gantry' })
    const disconnectBtn = getByRole('button', {
      name: 'Disconnect from network',
    })
    const settingsBtn = getByRole('button', { name: 'Robot settings' })

    expect(queryByText('Update robot software')).toBeNull()
    expect(runAProtocolBtn).toBeEnabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(disconnectBtn).toBeEnabled()
    expect(settingsBtn).toBeEnabled()
  })

  it('should render update robot software button when robot is on wrong version of software', () => {
    when(mockGetBuildrootUpdateDisplayInfo)
      .calledWith({} as State, mockConnectableRobot.name)
      .mockReturnValue({
        autoUpdateAction: 'upgrade',
        autoUpdateDisabledReason: null,
        updateFromFileDisabledReason: null,
      })

    const { getByRole, getByText } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const updateRobotSoftwareBtn = getByRole('button', {
      name: 'Update robot software',
    })
    const runAProtocolBtn = getByRole('button', {
      name: 'Run a protocol',
    })
    const restartBtn = getByRole('button', { name: 'Restart robot' })
    const homeBtn = getByRole('button', { name: 'Home gantry' })
    const settingsBtn = getByRole('button', { name: 'Robot settings' })

    expect(updateRobotSoftwareBtn).toBeEnabled()
    expect(runAProtocolBtn).toBeDisabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(settingsBtn).toBeEnabled()
    fireEvent.click(updateRobotSoftwareBtn)
    getByText('mock update buildroot')
  })

  it('should render disabled run a protocol, restart, disconnect, and home gantry menu items when robot is busy', () => {
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(true)

    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    expect(getByRole('button', { name: 'Run a protocol' })).toBeDisabled()
    expect(getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(
      getByRole('button', { name: 'Disconnect from network' })
    ).toBeDisabled()
    expect(getByRole('button', { name: 'Robot settings' })).toBeEnabled()
  })

  it('should render menu items when the robot is reachable', () => {
    const { getByRole, queryByRole } = render({ robot: mockReachableRobot })

    getByRole('button').click()
    expect(getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(
      queryByRole('button', { name: 'Disconnect from network' })
    ).toBeNull()
    expect(getByRole('button', { name: 'Robot settings' })).toBeEnabled()
  })

  it('clicking home gantry should home the robot arm', () => {
    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const homeBtn = getByRole('button', { name: 'Home gantry' })
    fireEvent.click(homeBtn)

    expect(mockHome).toBeCalled()
  })

  it('should render disabled disconnect button in the menu when the robot cannot disconnect', () => {
    when(mockUseCanDisconnect)
      .calledWith(mockConnectableRobot.name)
      .mockReturnValue(false)

    const { getByRole, queryByText } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const runAProtocolBtn = getByRole('button', {
      name: 'Run a protocol',
    })
    const restartBtn = getByRole('button', { name: 'Restart robot' })
    const homeBtn = getByRole('button', { name: 'Home gantry' })
    const disconnectBtn = getByRole('button', {
      name: 'Disconnect from network',
    })
    const settingsBtn = getByRole('button', { name: 'Robot settings' })

    expect(queryByText('Update robot software')).toBeNull()
    expect(runAProtocolBtn).toBeEnabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(disconnectBtn).toBeDisabled()
    expect(settingsBtn).toBeEnabled()
  })

  it('clicking disconnect from network should launch the disconnect modal', () => {
    const { getByRole, getByText, queryByText } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    expect(queryByText('mock disconnect modal')).toBeNull()

    const disconnectBtn = getByRole('button', {
      name: 'Disconnect from network',
    })
    fireEvent.click(disconnectBtn)

    getByText('mock disconnect modal')
  })

  it('clicking the restart robot button should restart the robot', () => {
    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const restartBtn = getByRole('button', { name: 'Restart robot' })
    fireEvent.click(restartBtn)

    expect(mockRestartRobot).toBeCalled()
  })
  it('render overflow menu buttons without the update robot software button', () => {
    when(mockGetBuildrootUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const { getByRole, queryByRole } = render(props)
    const btn = getByRole('button')
    btn.click()
    expect(queryByRole('Update robot software')).toBeNull()
    getByRole('button', { name: 'Run a protocol' })
    getByRole('button', { name: 'Restart robot' })
    getByRole('button', { name: 'Home gantry' })
    getByRole('button', { name: 'Disconnect from network' })
    getByRole('button', { name: 'Robot settings' })
  })
  it('should disable settings link when the robot is unreachable', () => {
    const { getByRole } = render({ robot: mockUnreachableRobot })
    const btn = getByRole('button')
    fireEvent.click(btn)
    expect(getByRole('button', { name: 'Robot settings' })).toBeDisabled()
  })
})
