import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { home } from '../../../redux/robot-controls'
import * as Buildroot from '../../../redux/buildroot'
import { restartRobot } from '../../../redux/robot-admin'
import {
  mockConnectableRobot,
  mockReachableRobot,
  mockUnreachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { ChooseProtocolSlideout } from '../../ChooseProtocolSlideout'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'
import { useIsRobotBusy } from '../hooks'
import { UpdateBuildroot } from '../RobotSettings/UpdateBuildroot'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/robot-admin')
jest.mock('../hooks')
jest.mock('../../../redux/buildroot')
jest.mock('../../ChooseProtocolSlideout')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../RobotSettings/UpdateBuildroot')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
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
const mockChooseProtocolSlideout = ChooseProtocolSlideout as jest.MockedFunction<
  typeof ChooseProtocolSlideout
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
    when(getBuildrootUpdateDisplayInfo)
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
  })
  afterEach(() => {
    resetAllWhenMocks()
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
    const settingsBtn = getByRole('button', { name: 'Robot settings' })

    expect(queryByText('Update robot software')).toBeNull()
    expect(runAProtocolBtn).toBeEnabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(settingsBtn).toBeEnabled()
  })

  it('should render update robot software button when robot is on wrong version of software', () => {
    when(getBuildrootUpdateDisplayInfo)
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

  it('should render disabled run a protocol, restart, and home gantry menu items when robot is busy', () => {
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(true)

    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    expect(getByRole('button', { name: 'Run a protocol' })).toBeDisabled()
    expect(getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(getByRole('button', { name: 'Robot settings' })).toBeEnabled()
  })

  it('should render menu items when the robot is reachable', () => {
    const { getByRole } = render({ robot: mockReachableRobot })

    getByRole('button').click()
    expect(getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(getByRole('button', { name: 'Robot settings' })).toBeEnabled()
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

  it('should render disabled menu items when the robot is unreachable', () => {
    when(mockUseIsRobotBusy).calledWith().mockReturnValue(true)

    const { getByRole, queryByRole } = render({ robot: mockUnreachableRobot })
    const btn = getByRole('button')
    btn.click()
    expect(queryByRole('Update robot software')).toBeNull()
    expect(queryByRole('button', { name: 'Run a protocol' })).toBeNull()
    expect(getByRole('button', { name: 'Restart robot' })).toBeDisabled()
    expect(getByRole('button', { name: 'Home gantry' })).toBeDisabled()
    expect(getByRole('button', { name: 'Robot settings' })).toBeDisabled()
  })
})
