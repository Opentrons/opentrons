// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import * as Fixtures from '../../../discovery/__fixtures__'
import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../robot'
import { OutlineButton, Icon, LabeledValue } from '@opentrons/components'
import { StatusCard } from '../StatusCard'

import type { State } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'

jest.mock('../../../robot/selectors')

const getSessionStatus: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getSessionStatus, any>
> = RobotSelectors.getSessionStatus

const getConnectRequest: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getConnectRequest, any>
> = RobotSelectors.getConnectRequest

describe('RobotSettings StatusCard', () => {
  const store = {
    dispatch: jest.fn(),
    getState: () => ({ mockState: true }),
    subscribe: () => {},
  }

  const render = (robot: ViewableRobot = Fixtures.mockConnectableRobot) => {
    return mount(<StatusCard robot={robot} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store },
    })
  }

  beforeEach(() => {
    getSessionStatus.mockReturnValue('')
    getConnectRequest.mockReturnValue({
      inProgress: false,
      name: '',
      error: null,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should have a connect button', () => {
    const wrapper = render()
    const button = wrapper.find(OutlineButton)

    expect(button.html()).toContain('connect')
  })

  it('dispatch connect on connect button click if disconnected', () => {
    const wrapper = render()
    const button = wrapper.find(OutlineButton)

    button.invoke('onClick')()
    expect(store.dispatch).toHaveBeenCalledWith(
      RobotActions.connect(Fixtures.mockConnectableRobot.name)
    )
  })

  it('should have a disconnect button if connected', () => {
    const wrapper = render(Fixtures.mockConnectedRobot)
    const button = wrapper.find(OutlineButton)

    expect(button.html()).toContain('disconnect')
  })

  it('dispatch disconnect on button click if connected', () => {
    const wrapper = render(Fixtures.mockConnectedRobot)
    const button = wrapper.find(OutlineButton)

    button.invoke('onClick')()
    expect(store.dispatch).toHaveBeenCalledWith(RobotActions.disconnect())
  })

  // TODO(mc, 2020-03-30): add tooltip to button
  it('connect button should be disabled if robot not connectable', () => {
    const wrapper = render(Fixtures.mockReachableRobot)
    const button = wrapper.find(OutlineButton)

    expect(button.prop('disabled')).toBe(true)
  })

  // TODO(mc, 2020-03-30): add tooltip to button
  it('connect button should be disabled with if connect in progress', () => {
    getConnectRequest.mockReturnValue({
      inProgress: true,
      name: 'foobar',
      error: null,
    })

    const wrapper = render()
    const button = wrapper.find(OutlineButton)

    expect(button.prop('disabled')).toBe(true)
  })

  it('connect button should have spinner if connect in progress to same robot', () => {
    getConnectRequest.mockReturnValue({
      inProgress: true,
      name: Fixtures.mockConnectableRobot.name,
      error: null,
    })

    const wrapper = render()
    const button = wrapper.find(OutlineButton)
    const icon = button.find(Icon)
    expect(button.prop('disabled')).toBe(true)
    expect(icon.prop('name')).toBe('ot-spinner')
    expect(icon.prop('spin')).toBe(true)
  })

  it('displays unknown session status if not connected', () => {
    const wrapper = render()
    const status = wrapper.find(LabeledValue)

    expect(status.html()).toMatch(/unknown/i)
  })

  // TODO(mc, 2020-03-30): https://github.com/Opentrons/opentrons/issues/1033
  it('displays RPC session status if connected', () => {
    getSessionStatus.mockReturnValue('running')

    const wrapper = render(Fixtures.mockConnectedRobot)
    const status = wrapper.find(LabeledValue)

    expect(status.html()).toMatch(/running/i)
  })
})
