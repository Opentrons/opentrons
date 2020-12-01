// @flow
import * as React from 'react'
import { StaticRouter, Route, Redirect } from 'react-router-dom'

import { mountWithStore } from '@opentrons/components/__utils__'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '../../../discovery/__fixtures__'

import * as Buildroot from '../../../buildroot'
import * as Admin from '../../../robot-admin'
import * as Controls from '../../../robot-controls'
import * as Settings from '../../../robot-settings'
import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../robot'

import { SpinnerModalPage } from '@opentrons/components'
import { Page } from '../../../components/Page'
import { ErrorModal } from '../../../components/modals'
import { ReachableRobotBanner } from '../../../components/RobotSettings/ReachableRobotBanner'
import { ConnectBanner } from '../../../components/RobotSettings/ConnectBanner'
import { RestartRequiredBanner } from '../../../components/RobotSettings/RestartRequiredBanner'
import {
  RobotSettings as RobotSettingsContents,
  ConnectAlertModal,
} from '../../../components/RobotSettings'
import { UpdateBuildroot } from '../../../components/RobotSettings/UpdateBuildroot'
import { ResetRobotModal } from '../../../components/RobotSettings/ResetRobotModal'
import { RobotSettings } from '../RobotSettings'

import type { State } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'

jest.mock('../../../buildroot/selectors')
jest.mock('../../../robot-admin/selectors')
jest.mock('../../../robot-controls/selectors')
jest.mock('../../../robot-settings/selectors')
jest.mock('../../../robot/selectors')

// emulate shallow render
jest.mock('../../../components/RobotSettings', () => ({
  RobotSettings: () => <></>,
  ConnectAlertModal: () => <></>,
}))

jest.mock('../../../components/RobotSettings/UpdateBuildroot', () => ({
  UpdateBuildroot: () => <></>,
}))

jest.mock('../../../components/RobotSettings/ResetRobotModal', () => ({
  ResetRobotModal: () => <></>,
}))

const MOCK_STATE: State = ({ mockState: true }: any)
const ROBOT_URL = `/robots/${mockConnectableRobot.name}`

const getConnectRequest: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getConnectRequest, State>
> = RobotSelectors.getConnectRequest

const getBuildrootUpdateSeen: JestMockFn<[State], boolean> =
  Buildroot.getBuildrootUpdateSeen

const getBuildrootUpdateDisplayInfo: JestMockFn<
  [State, string],
  $Call<typeof Buildroot.getBuildrootUpdateDisplayInfo, State, string>
> = Buildroot.getBuildrootUpdateDisplayInfo

const getBuildrootUpdateInProgress: JestMockFn<
  [State, ViewableRobot],
  boolean
> = Buildroot.getBuildrootUpdateInProgress

const getBuildrootUpdateAvailable: JestMockFn<
  [State, ViewableRobot],
  $Call<typeof Buildroot.getBuildrootUpdateAvailable, State, ViewableRobot>
> = Buildroot.getBuildrootUpdateAvailable

const getRobotRestartRequired: JestMockFn<[State, string | null], boolean> =
  Settings.getRobotRestartRequired

const getMovementStatus: JestMockFn<
  [State, string],
  $Call<typeof Controls.getMovementStatus, State, string>
> = Controls.getMovementStatus

const getMovementError: JestMockFn<
  [State, string],
  $Call<typeof Controls.getMovementError, State, string>
> = Controls.getMovementError

const getRobotRestarting: JestMockFn<[State, string], boolean> =
  Admin.getRobotRestarting

describe('/robots/:robotName page component', () => {
  const render = (robot = mockConnectableRobot, url = ROBOT_URL) => {
    return mountWithStore(
      <StaticRouter location={url} context={{}}>
        <Route path="/robots/:name?">
          <RobotSettings robot={robot} appUpdate={({ unused: true }: any)} />
        </Route>
      </StaticRouter>,
      { initialState: MOCK_STATE }
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
    const contents = wrapper.find(RobotSettingsContents)

    expect(contents.prop('robot')).toBe(mockConnectableRobot)
    expect(contents.prop('updateUrl')).toBe(`${ROBOT_URL}/update`)
    expect(contents.prop('resetUrl')).toBe(`${ROBOT_URL}/reset`)
    expect(contents.prop('pipettesPageUrl')).toBe(`${ROBOT_URL}/instruments`)
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

    errorModal.invoke('close')()
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

    errorModal.invoke('onCloseClick')()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotActions.clearConnectResponse()
    )
  })
})
