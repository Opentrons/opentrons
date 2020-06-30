// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import noop from 'lodash/noop'

import * as AppAlerts from '../../../alerts'
import { LostConnectionAlert } from '../../LostConnectionAlert'
import { AnalyticsSettingsModal } from '../../analytics-settings'
import { U2EDriverOutdatedAlert } from '../U2EDriverOutdatedAlert'

import type { State } from '../../../types'
import type { AlertId } from '../../../alerts/types'
import { Alerts } from '..'

jest.mock('../../LostConnectionAlert', () => ({
  LostConnectionAlert: () => <></>,
}))

jest.mock('../../analytics-settings', () => ({
  AnalyticsSettingsModal: () => <></>,
}))

jest.mock('../U2EDriverOutdatedAlert', () => ({
  U2EDriverOutdatedAlert: () => <></>,
}))

jest.mock('../../../alerts/selectors')

const getActiveAlerts: JestMockFn<[State], $ReadOnlyArray<AlertId>> =
  AppAlerts.getActiveAlerts

describe('app-wide Alerts component', () => {
  const dispatch = jest.fn()
  const MOCK_STATE: State = ({ mockState: true }: any)
  const MOCK_STORE = {
    dispatch,
    getState: () => MOCK_STATE,
    subscribe: noop,
  }

  const render = () => {
    return mount(<Alerts />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: MOCK_STORE },
    })
  }

  const stubActiveAlerts = alertIds => {
    getActiveAlerts.mockImplementation(state => {
      expect(state).toBe(MOCK_STATE)
      return alertIds
    })
  }

  beforeEach(() => {
    stubActiveAlerts([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // TODO(mc, 2020-05-07): LostConnectionAlert currently controls its own
  // render; move its logic into `state.alerts`
  it('should render LostConnectionAlert', () => {
    const wrapper = render()
    expect(wrapper.exists(LostConnectionAlert)).toBe(true)
  })

  // TODO(mc, 2020-05-07): AnalyticsSettingsModal currently controls its own
  // render; move its logic into `state.alerts`
  it('should render AnalyticsSettingsModal', () => {
    const wrapper = render()
    expect(wrapper.exists(AnalyticsSettingsModal)).toBe(true)
  })

  it('should render a U2EDriverOutdatedAlert if alert is triggered', () => {
    const wrapper = render()
    expect(wrapper.exists(U2EDriverOutdatedAlert)).toBe(false)

    stubActiveAlerts([AppAlerts.ALERT_U2E_DRIVER_OUTDATED])
    wrapper.setProps({})
    expect(wrapper.exists(U2EDriverOutdatedAlert)).toBe(true)

    wrapper.find(U2EDriverOutdatedAlert).invoke('dismissAlert')(true)

    expect(dispatch).toHaveBeenCalledWith(
      AppAlerts.alertDismissed(AppAlerts.ALERT_U2E_DRIVER_OUTDATED, true)
    )
  })
})
