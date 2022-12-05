import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { i18n } from '../../../i18n'
import { home } from '../../../redux/robot-controls'
import * as Buildroot from '../../../redux/buildroot'
import { restartRobot } from '../../../redux/robot-admin'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { useCurrentRunStatus } from '../../RunTimeControl/hooks'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'
import { useIsRobotBusy } from '../hooks'
import { UpdateBuildroot } from '../RobotSettings/UpdateBuildroot'

jest.mock('../../RunTimeControl/hooks')
jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/robot-admin')
jest.mock('../hooks')
jest.mock('../../../redux/buildroot')
jest.mock('../RobotSettings/UpdateBuildroot')

const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>
const getBuildrootUpdateDisplayInfo = Buildroot.getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof Buildroot.getBuildrootUpdateDisplayInfo
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
  beforeEach(() => {
    props = { robot: mockConnectableRobot }
    when(getBuildrootUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    when(mockUseCurrentRunStatus).calledWith().mockReturnValue(RUN_STATUS_IDLE)
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(false)
    when(mockUpdateBuildroot).mockReturnValue(<div>mock update buildroot</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render enabled buttons in the menu when the status is idle', () => {
    const { getByRole, getByText } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const updateRobotSoftwareBtn = getByRole('button', {
      name: 'Update robot software',
    })
    const restartBtn = getByRole('button', { name: 'Restart robot' })
    const homeBtn = getByRole('button', { name: 'Home gantry' })
    const settingsBtn = getByRole('button', { name: 'Robot settings' })

    expect(updateRobotSoftwareBtn).toBeEnabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(settingsBtn).toBeEnabled()
    fireEvent.click(updateRobotSoftwareBtn)
    getByText('mock update buildroot')
  })

  it('should render disabled restart and home gantry menu items when robot is busy', () => {
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(true)
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)

    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    expect(screen.queryByText('Update robot software')).toBeNull()
    expect(getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    getByRole('button', { name: 'Robot settings' })
  })

  it('should render menu items when the robot is reachable', () => {
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(true)
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)
    const { getByRole } = render({ robot: mockReachableRobot })
    const btn = getByRole('button')
    expect(btn).not.toBeDisabled()
  })

  it('clicking home gantry should home the gantry', () => {
    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const homeBtn = getByRole('button', { name: 'Home gantry' })
    fireEvent.click(homeBtn)

    expect(mockHome).toBeCalled()
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
    when(getBuildrootUpdateDisplayInfo).mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const { getByRole } = render(props)
    const btn = getByRole('button')
    fireEvent.click(btn)
    getByRole('button', { name: 'Restart robot' })
    getByRole('button', { name: 'Home gantry' })
    getByRole('button', { name: 'Robot settings' })
  })
  it('should render disabled menu items when the robot is unreachable', () => {
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(true)
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)
    const { getByRole } = render({ robot: mockUnreachableRobot })
    const btn = getByRole('button')
    btn.click()
    expect(getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(getByRole('button', { name: 'Robot settings' })).toBeDisabled()
  })
})
