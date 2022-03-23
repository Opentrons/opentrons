import * as React from 'react'
import { SecondaryBtn, mountWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'

import * as Fixtures from '../../../../redux/discovery/__fixtures__'
import {
  connect,
  disconnect,
  selectors as RobotSelectors,
} from '../../../../redux/robot'
import { StatusCard } from '../StatusCard'

import type { ViewableRobot } from '../../../../redux/discovery/types'

jest.mock('../../../../redux/robot/selectors')

const getSessionStatus = RobotSelectors.getSessionStatus as jest.MockedFunction<
  typeof RobotSelectors.getSessionStatus
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
      connect(Fixtures.mockConnectableRobot.name)
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
    expect(store.dispatch).toHaveBeenCalledWith(disconnect())
  })

  // TODO(mc, 2020-03-30): add tooltip to button
  it('connect button should be disabled if robot not connectable', () => {
    const { wrapper } = render(Fixtures.mockReachableRobot)
    const button = wrapper.find(SecondaryBtn)

    expect(button.prop('disabled')).toBe(true)
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
