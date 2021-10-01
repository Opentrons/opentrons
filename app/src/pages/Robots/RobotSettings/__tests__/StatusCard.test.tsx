import * as React from 'react'
import { mountWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'

import * as Fixtures from '../../../../redux/discovery/__fixtures__'
import {
  actions as RobotActions,
  selectors as RobotSelectors,
} from '../../../../redux/robot'
import { SecondaryBtn, Icon } from '@opentrons/components'
import { StatusCard } from '../StatusCard'

import type { ViewableRobot } from '../../../../redux/discovery/types'

jest.mock('../../../../redux/robot/selectors')

const getSessionStatus = RobotSelectors.getSessionStatus as jest.MockedFunction<
  typeof RobotSelectors.getSessionStatus
>

const getConnectRequest = RobotSelectors.getConnectRequest as jest.MockedFunction<
  typeof RobotSelectors.getConnectRequest
>

describe('RobotSettings StatusCard', () => {
  const render = (
    robot: ViewableRobot = Fixtures.mockConnectableRobot
  ): ReturnType<typeof mountWithProviders> => {
    return mountWithProviders(<StatusCard robot={robot} />, {
      i18n,
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
    const { wrapper } = render()
    const button = wrapper.find(SecondaryBtn)

    expect(button.html()).toContain('connect')
  })

  it('dispatch connect on connect button click if disconnected', () => {
    const { wrapper, store } = render()
    const button = wrapper.find(SecondaryBtn)

    button.invoke('onClick')?.({} as React.MouseEvent)
    expect(store.dispatch).toHaveBeenCalledWith(
      RobotActions.connect(Fixtures.mockConnectableRobot.name)
    )
  })

  it('should have a disconnect button if connected', () => {
    const { wrapper } = render(Fixtures.mockConnectedRobot)
    const button = wrapper.find(SecondaryBtn)

    expect(button.html()).toContain('disconnect')
  })

  it('dispatch disconnect on button click if connected', () => {
    const { wrapper, store } = render(Fixtures.mockConnectedRobot)
    const button = wrapper.find(SecondaryBtn)

    button.invoke('onClick')?.({} as React.MouseEvent)
    expect(store.dispatch).toHaveBeenCalledWith(RobotActions.disconnect())
  })

  // TODO(mc, 2020-03-30): add tooltip to button
  it('connect button should be disabled if robot not connectable', () => {
    const { wrapper } = render(Fixtures.mockReachableRobot)
    const button = wrapper.find(SecondaryBtn)

    expect(button.prop('disabled')).toBe(true)
  })

  // TODO(mc, 2020-03-30): add tooltip to button
  it('connect button should be disabled with if connect in progress', () => {
    getConnectRequest.mockReturnValue({
      inProgress: true,
      name: 'foobar',
      error: null,
    })

    const { wrapper } = render()
    const button = wrapper.find(SecondaryBtn)

    expect(button.prop('disabled')).toBe(true)
  })

  it('connect button should have spinner if connect in progress to same robot', () => {
    getConnectRequest.mockReturnValue({
      inProgress: true,
      name: Fixtures.mockConnectableRobot.name,
      error: null,
    })

    const { wrapper } = render()
    const button = wrapper.find(SecondaryBtn)
    const icon = button.find(Icon)
    expect(button.prop('disabled')).toBe(true)
    expect(icon.prop('name')).toBe('ot-spinner')
    expect(icon.prop('spin')).toBe(true)
  })

  it('displays unknown session status if not connected', () => {
    const { wrapper } = render()
    const status = wrapper.find('LabeledValue')

    expect(status.html()).toMatch(/unknown/i)
  })

  // TODO(mc, 2020-03-30): https://github.com/Opentrons/opentrons/issues/1033
  it('displays RPC session status if connected', () => {
    getSessionStatus.mockReturnValue('running')

    const { wrapper } = render(Fixtures.mockConnectedRobot)
    const status = wrapper.find('LabeledValue')

    expect(status.html()).toMatch(/running/i)
  })
})
