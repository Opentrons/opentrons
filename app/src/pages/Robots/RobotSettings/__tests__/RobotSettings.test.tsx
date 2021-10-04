import * as React from 'react'
import { StaticRouter, Route, Redirect } from 'react-router-dom'

import { SpinnerModalPage, mountWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '../../../../redux/discovery/__fixtures__'

import * as Buildroot from '../../../../redux/buildroot'
import * as Admin from '../../../../redux/robot-admin'
import * as Controls from '../../../../redux/robot-controls'
import * as Settings from '../../../../redux/robot-settings'
import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../../redux/robot'

import { Page } from '../../../../atoms/Page'
import { ErrorModal } from '../../../../molecules/modals'
import { ReachableRobotBanner } from '../ReachableRobotBanner'
import { ConnectBanner } from '../ConnectBanner'
import { RestartRequiredBanner } from '../RestartRequiredBanner'
import { ConnectAlertModal } from '../ConnectAlertModal'
import { UpdateBuildroot } from '../UpdateBuildroot'
import { ResetRobotModal } from '../ResetRobotModal'
import { RobotSettings } from '..'

import type { State, Action } from '../../../../redux/types'
import type { ViewableRobot } from '../../../../redux/discovery/types'

jest.mock('../../../../redux/buildroot/selectors')
jest.mock('../../../../redux/robot-admin/selectors')
jest.mock('../../../../redux/robot-controls/selectors')
jest.mock('../../../../redux/robot-settings/selectors')
jest.mock('../../../../redux/robot/selectors')

// emulate shallow render
jest.mock('../ConnectAlertModal', () => ({
  ConnectAlertModal: () => <></>,
}))

jest.mock('../UpdateBuildroot', () => ({
  UpdateBuildroot: () => <></>,
}))

jest.mock('../ResetRobotModal', () => ({
  ResetRobotModal: () => <></>,
}))

jest.mock('../StatusCard', () => ({
  StatusCard: () => <></>,
}))
jest.mock('../InformationCard', () => ({
  InformationCard: () => <></>,
}))
jest.mock('../CalibrationCard', () => ({
  CalibrationCard: () => <></>,
}))
jest.mock('../ControlsCard', () => ({
  ControlsCard: () => <></>,
}))
jest.mock('../ConnectionCard', () => ({
  ConnectionCard: () => <></>,
}))
jest.mock('../AdvancedSettingsCard', () => ({
  AdvancedSettingsCard: () => <></>,
}))

const MOCK_STATE: State = { mockState: true } as any
const ROBOT_URL = `/robots/${mockConnectableRobot.name}`

const getConnectRequest = RobotSelectors.getConnectRequest as jest.MockedFunction<
  typeof RobotSelectors.getConnectRequest
>

const getBuildrootUpdateSeen = Buildroot.getBuildrootUpdateSeen as jest.MockedFunction<
  typeof Buildroot.getBuildrootUpdateSeen
>

const getBuildrootUpdateDisplayInfo = Buildroot.getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof Buildroot.getBuildrootUpdateDisplayInfo
>

const getBuildrootUpdateInProgress = Buildroot.getBuildrootUpdateInProgress as jest.MockedFunction<
  typeof Buildroot.getBuildrootUpdateInProgress
>

const getBuildrootUpdateAvailable = Buildroot.getBuildrootUpdateAvailable as jest.MockedFunction<
  typeof Buildroot.getBuildrootUpdateAvailable
>

const getRobotRestartRequired = Settings.getRobotRestartRequired as jest.MockedFunction<
  typeof Settings.getRobotRestartRequired
>

const getMovementStatus = Controls.getMovementStatus as jest.MockedFunction<
  typeof Controls.getMovementStatus
>

const getMovementError = Controls.getMovementError as jest.MockedFunction<
  typeof Controls.getMovementError
>

const getRobotRestarting = Admin.getRobotRestarting as jest.MockedFunction<
  typeof Admin.getRobotRestarting
>

describe('/robots/:robotName page component', () => {
  const render = (
    robot: ViewableRobot = mockConnectableRobot,
    url = ROBOT_URL
  ) => {
    return mountWithProviders<
      React.ComponentProps<typeof StaticRouter>,
      State,
      Action
    >(
      <StaticRouter location={url} context={{}}>
        <Route path="/robots/:name?">
          <RobotSettings robot={robot} />
        </Route>
      </StaticRouter>,
      { initialState: MOCK_STATE, i18n }
    )
  }

  beforeEach(() => {
    getConnectRequest.mockReturnValue({
      name: '',
      inProgress: false,
      error: null,
    })
    getBuildrootUpdateSeen.mockReturnValue(false)
    getBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    getBuildrootUpdateInProgress.mockReturnValue(false)
    getBuildrootUpdateAvailable.mockReturnValue(null)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render a Page with the robot displayName as title', () => {
    const { wrapper } = render()
    const page = wrapper.find(Page)

    expect(page.prop('titleBarProps')).toEqual({
      title: mockConnectableRobot.displayName,
    })
  })

  it('should display a ReachableRobotBanner warning banner if not connectable', () => {
    const { wrapper } = render(mockReachableRobot)
    const banner = wrapper.find(ReachableRobotBanner)

    expect(banner.props()).toMatchObject(mockReachableRobot)
  })

  it('should display a ConnectBanner if connectable', () => {
    const { wrapper } = render(mockConnectableRobot)
    const banner = wrapper.find(ConnectBanner)

    expect(banner.props()).toMatchObject(mockConnectableRobot)
  })

  it('should display a RestartRequiredBanner if restart required', () => {
    getRobotRestartRequired.mockReturnValue(true)

    const { wrapper } = render()
    const banner = wrapper.find(RestartRequiredBanner)

    expect(getRobotRestartRequired).toHaveBeenCalledWith(
      MOCK_STATE,
      mockConnectableRobot.name
    )
    expect(banner.prop('robotName')).toBe(mockConnectableRobot.name)
  })

  it('should render RobotSettings contents', () => {
    const { wrapper } = render()

    const infoCard = wrapper.find('InformationCard')
    expect(infoCard.prop('robot')).toBe(mockConnectableRobot)
    expect(infoCard.prop('updateUrl')).toBe(`${ROBOT_URL}/update`)

    const calCard = wrapper.find('CalibrationCard')
    expect(calCard.prop('pipettesPageUrl')).toBe(`${ROBOT_URL}/instruments`)

    const advancedSettingsCard = wrapper.find('AdvancedSettingsCard')
    expect(advancedSettingsCard.prop('resetUrl')).toBe(`${ROBOT_URL}/reset`)
  })

  it('should render an UpdateBuildroot wizard if the route matches', () => {
    const updateUrl = `${ROBOT_URL}/update`
    const { wrapper } = render(mockConnectableRobot, updateUrl)
    const wizard = wrapper.find(UpdateBuildroot)

    expect(wizard.prop('robot')).toBe(mockConnectableRobot)
  })

  it('should render a ResetRobotModal wizard if the route matches', () => {
    const updateUrl = `${ROBOT_URL}/reset`
    const { wrapper } = render(mockConnectableRobot, updateUrl)
    const wizard = wrapper.find(ResetRobotModal)

    expect(wizard.prop('robotName')).toBe(mockConnectableRobot.name)
  })

  it('should render a SpinnerModalPage if the robot is homing', () => {
    getMovementStatus.mockReturnValue(Controls.HOMING)

    const { wrapper } = render()
    const spinner = wrapper.find(SpinnerModalPage)

    expect(getMovementStatus).toHaveBeenCalledWith(
      MOCK_STATE,
      mockConnectableRobot.name
    )
    expect(spinner.prop('message')).toBe('Robot is homing.')
  })

  it('should render a SpinnerModalPage if the robot is restarting', () => {
    getRobotRestarting.mockReturnValue(true)

    const { wrapper } = render()
    const spinner = wrapper.find(SpinnerModalPage)

    expect(getRobotRestarting).toHaveBeenCalledWith(
      MOCK_STATE,
      mockConnectableRobot.name
    )
    expect(spinner.prop('message')).toBe('Robot is restarting.')
  })

  it('should render an ErrorModal if the robot home errored', () => {
    getMovementError.mockReturnValue('oh no!')

    const { wrapper, store } = render()
    const errorModal = wrapper.find(ErrorModal)

    expect(getMovementError).toHaveBeenCalledWith(
      MOCK_STATE,
      mockConnectableRobot.name
    )
    expect(errorModal.prop('heading')).toBe('Robot unable to home')
    expect(errorModal.prop('description')).toMatch(/robot was unable to home/i)
    expect(errorModal.prop('error')).toEqual({ message: 'oh no!' })

    errorModal.invoke('close')?.()
    expect(store.dispatch).toHaveBeenCalledWith(
      Controls.clearMovementStatus(mockConnectableRobot.name)
    )
  })

  it('should redirect to the update URL if an update is in progress', () => {
    getBuildrootUpdateInProgress.mockReturnValue(true)

    const { wrapper } = render()
    const redirect = wrapper.find(Redirect)

    expect(redirect.prop('to')).toBe(`${ROBOT_URL}/update`)
    expect(getBuildrootUpdateInProgress).toHaveBeenCalledWith(
      MOCK_STATE,
      mockConnectableRobot
    )
  })

  it('should redirect to the update URL if an unseen upgrade is available', () => {
    getBuildrootUpdateInProgress.mockReturnValue(false)
    getBuildrootUpdateSeen.mockReturnValue(false)
    getBuildrootUpdateAvailable.mockReturnValue(Buildroot.UPGRADE)

    const { wrapper } = render()
    const redirect = wrapper.find(Redirect)

    expect(redirect.prop('to')).toBe(`${ROBOT_URL}/update`)
    expect(getBuildrootUpdateSeen).toHaveBeenCalledWith(MOCK_STATE)
    expect(getBuildrootUpdateAvailable).toHaveBeenCalledWith(
      MOCK_STATE,
      mockConnectableRobot
    )
  })

  it('should not redirect if an upgrade has been seen ', () => {
    getBuildrootUpdateInProgress.mockReturnValue(false)
    getBuildrootUpdateSeen.mockReturnValue(true)
    getBuildrootUpdateAvailable.mockReturnValue(Buildroot.UPGRADE)

    const { wrapper } = render()
    const redirect = wrapper.find(Redirect)

    expect(redirect.exists()).toBe(false)
  })

  it('should not redirect if an unseen downgrade is available', () => {
    getBuildrootUpdateInProgress.mockReturnValue(false)
    getBuildrootUpdateSeen.mockReturnValue(false)
    getBuildrootUpdateAvailable.mockReturnValue(Buildroot.DOWNGRADE)

    const { wrapper } = render()
    const redirect = wrapper.find(Redirect)

    expect(redirect.exists()).toBe(false)
  })

  it('should not redirect if autoupdates are disabled', () => {
    getBuildrootUpdateInProgress.mockReturnValue(false)
    getBuildrootUpdateSeen.mockReturnValue(false)
    getBuildrootUpdateAvailable.mockReturnValue(Buildroot.UPGRADE)
    getBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: Buildroot.UPGRADE,
      autoUpdateDisabledReason: 'oh no!',
      updateFromFileDisabledReason: null,
    })

    const { wrapper } = render()
    const redirect = wrapper.find(Redirect)

    expect(redirect.exists()).toBe(false)
    expect(getBuildrootUpdateDisplayInfo).toHaveBeenCalledWith(
      MOCK_STATE,
      mockConnectableRobot.name
    )
  })

  it('should show a ConnectAlertModal if a RPC connect fails', () => {
    getConnectRequest.mockReturnValue({
      name: mockConnectableRobot.name,
      inProgress: false,
      error: { message: 'oh no!' },
    })

    const { wrapper, store } = render()
    const errorModal = wrapper.find(ConnectAlertModal)

    expect(errorModal.exists()).toBe(true)

    errorModal.invoke('onCloseClick')?.()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotActions.clearConnectResponse()
    )
  })
})
