// @flow
import { mount } from 'enzyme'
import * as React from 'react'
import { Provider } from 'react-redux'
import { StaticRouter } from 'react-router-dom'

import * as Buildroot from '../../../buildroot'
import * as Fixtures from '../../../discovery/__fixtures__'
import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../robot'
import type { State } from '../../../types'
import { RobotItem } from '../RobotItem'
import { RobotListItem } from '../RobotListItem'

jest.mock('../../../buildroot/selectors')
jest.mock('../../../robot/selectors')

const getBuildrootUpdateAvailable: JestMockFn<
  [State, any],
  $Call<typeof Buildroot.getBuildrootUpdateAvailable, State, any>
> = Buildroot.getBuildrootUpdateAvailable

const getConnectRequest: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getConnectRequest, State>
> = RobotSelectors.getConnectRequest

describe('ConnectPanel RobotItem', () => {
  const store = {
    subscribe: () => {},
    getState: () => ({ mockState: true }),
    dispatch: jest.fn(),
  }

  const render = (robot = Fixtures.mockConnectableRobot, matchParams = {}) => {
    // TODO(mc, 2020-03-30): upgrade react-router to 5.1 for hooks
    // grab the wrapped component from react-router::withRouter
    const Component = (RobotItem: any).WrappedComponent

    const Wrapper = ({ children }: {| children: React.Node |}) => (
      <Provider store={store}>
        <StaticRouter location="/" context={{}}>
          {children}
        </StaticRouter>
      </Provider>
    )

    return mount(<Component robot={robot} match={{ params: matchParams }} />, {
      wrappingComponent: Wrapper,
    })
  }

  beforeEach(() => {
    getBuildrootUpdateAvailable.mockReturnValue(null)
    getConnectRequest.mockReturnValue({
      inProgress: false,
      error: null,
      name: '',
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders a RobotListItem with the robot', () => {
    const robot = Fixtures.mockConnectableRobot
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    expect(item.prop('name')).toBe(robot.name)
    expect(item.prop('displayName')).toBe(robot.displayName)
    expect(item.prop('isConnectable')).toBe(true)
    expect(item.prop('isConnected')).toBe(false)
  })

  it('renders a connected robot', () => {
    const robot = Fixtures.mockConnectedRobot
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    expect(item.prop('isConnectable')).toBe(true)
    expect(item.prop('isConnected')).toBe(true)
    expect(item.prop('isSelected')).toBe(false)
  })

  it('marks item as selected if route matches', () => {
    const robot = Fixtures.mockConnectedRobot
    const wrapper = render(robot, { name: robot.name })
    const item = wrapper.find(RobotListItem)

    expect(item.prop('isSelected')).toBe(true)
  })

  it('renders a reachable but not connectable robot', () => {
    const robot = Fixtures.mockReachableRobot
    const wrapper = render(robot, { name: robot.name })
    const item = wrapper.find(RobotListItem)

    expect(item.prop('isConnectable')).toBe(false)
    expect(item.prop('isConnected')).toBe(false)
    expect(item.prop('isSelected')).toBe(true)
  })

  it('renders an upgradable robot if buildroot upgrade available', () => {
    getBuildrootUpdateAvailable.mockReturnValue(Buildroot.UPGRADE)

    const robot = Fixtures.mockConnectableRobot
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    expect(item.prop('isUpgradable')).toBe(true)
  })

  it('renders not upgradable robot if buildroot downgrade available', () => {
    getBuildrootUpdateAvailable.mockReturnValue(Buildroot.DOWNGRADE)

    const robot = Fixtures.mockConnectableRobot
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    expect(item.prop('isUpgradable')).toBe(false)
  })

  it('renders as local if robot.local', () => {
    const robot = { ...Fixtures.mockConnectableRobot, local: true }
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    expect(item.prop('isLocal')).toBe(true)
  })

  it('renders as not local if not robot.local', () => {
    const robot = { ...Fixtures.mockConnectableRobot, local: false }
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    expect(item.prop('isLocal')).toBe(false)
  })

  it('dispatches connect on toggleConnect if disconnected', () => {
    const robot = Fixtures.mockConnectableRobot
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    item.invoke('onToggleConnect')()

    expect(store.dispatch).toHaveBeenCalledWith(
      RobotActions.connect(robot.name)
    )
  })

  it('dispatches disconnect on toggleConnect if connected', () => {
    const robot = Fixtures.mockConnectedRobot
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    item.invoke('onToggleConnect')()

    expect(store.dispatch).toHaveBeenCalledWith(RobotActions.disconnect())
  })

  it('dispatches nothing on toggleConnect if connect request in flight', () => {
    getConnectRequest.mockReturnValue({
      inProgress: true,
      error: null,
      name: 'foo',
    })

    const robot = Fixtures.mockConnectedRobot
    const wrapper = render(robot)
    const item = wrapper.find(RobotListItem)

    item.invoke('onToggleConnect')()

    expect(store.dispatch).not.toHaveBeenCalled()
  })
})
