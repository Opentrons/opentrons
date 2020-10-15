// @flow
import * as React from 'react'
import { mountWithStore } from '@opentrons/components/__utils__'

import { BORDER_SOLID_LIGHT } from '@opentrons/components'
import * as Alerts from '../../../alerts'
import * as Analytics from '../../../analytics'
import { TitledControl } from '../../TitledControl'
import { ToggleBtn } from '../../ToggleBtn'
import { UpdateNotificationsControl } from '../UpdateNotificationsControl'

import type { StyleProps } from '@opentrons/components'
import type { State } from '../../../types'
import type { AlertId } from '../../../alerts/types'
import type { AnalyticsEvent } from '../../../analytics/types'

jest.mock('../../../alerts/selectors')
jest.mock('../../../analytics/hooks')

const getAlertIsPermanentlyIgnored: JestMockFn<
  [State, AlertId],
  boolean | null
> = Alerts.getAlertIsPermanentlyIgnored

const useTrackEvent: JestMockFn<[], JestMockFn<[AnalyticsEvent], void>> =
  Analytics.useTrackEvent

const MOCK_STATE: $Shape<State> = {}

describe('UpdateNotificationsControl', () => {
  const trackEvent = jest.fn()

  const render = (styleProps: $Shape<StyleProps> = {}) => {
    return mountWithStore(<UpdateNotificationsControl {...styleProps} />, {
      initialState: MOCK_STATE,
    })
  }

  beforeEach(() => {
    useTrackEvent.mockReturnValue(trackEvent)
    getAlertIsPermanentlyIgnored.mockImplementation((state, alertId) => {
      expect(state).toBe(MOCK_STATE)
      expect(alertId).toBe(Alerts.ALERT_APP_UPDATE_AVAILABLE)
      return null
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should be TitledControl', () => {
    const { wrapper } = render()
    const control = wrapper.find(TitledControl)

    expect(control.prop('title')).toBe('App Update Alerts')
    expect(control.text()).toMatch(/get notified when.+app update/i)
  })

  it('should pass style props to the TitledControl', () => {
    const { wrapper } = render({ borderTop: BORDER_SOLID_LIGHT })
    const control = wrapper.find(TitledControl)

    expect(control.prop('borderTop')).toBe(BORDER_SOLID_LIGHT)
  })

  it('should have a ToggleBtn with state driven by alerts', () => {
    const { wrapper, refresh } = render()
    const getToggle = () => wrapper.find(ToggleBtn)

    expect(getToggle().prop('disabled')).toBe(true)
    expect(getToggle().prop('toggledOn')).toBe(false)

    // enable notifications toggle should be on if alerts are not ignored
    getAlertIsPermanentlyIgnored.mockReturnValue(false)
    refresh()
    expect(getToggle().prop('disabled')).toBe(false)
    expect(getToggle().prop('toggledOn')).toBe(true)

    // enable notifications toggle should be on if alerts are not ignored
    getAlertIsPermanentlyIgnored.mockReturnValue(true)
    refresh()
    expect(getToggle().prop('disabled')).toBe(false)
    expect(getToggle().prop('toggledOn')).toBe(false)
  })

  it('should unignore app alerts when toggled from off to on', () => {
    // true means alert is disabled which means toggle is off
    getAlertIsPermanentlyIgnored.mockReturnValue(true)

    const { wrapper, store } = render()
    const toggle = wrapper.find(ToggleBtn)

    toggle.invoke('onClick')()

    expect(store.dispatch).toHaveBeenCalledWith(
      Alerts.alertUnignored(Alerts.ALERT_APP_UPDATE_AVAILABLE)
    )
  })

  it('should ignore app alerts when toggled from on to off', () => {
    // false means alert is enabled which means toggle is on
    getAlertIsPermanentlyIgnored.mockReturnValue(false)

    const { wrapper, store } = render()
    const toggle = wrapper.find(ToggleBtn)

    toggle.invoke('onClick')()

    expect(store.dispatch).toHaveBeenCalledWith(
      Alerts.alertPermanentlyIgnored(Alerts.ALERT_APP_UPDATE_AVAILABLE)
    )
  })

  it('should send an appUpdateNotificationsToggle analytics event when toggled from on to off', () => {
    // false means alert is enabled which means toggle is currently on
    getAlertIsPermanentlyIgnored.mockReturnValue(false)

    const { wrapper } = render()
    const toggle = wrapper.find(ToggleBtn)

    toggle.invoke('onClick')()

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'appUpdateNotificationsToggle',
      properties: { enabled: false },
    })
  })

  it('should send an appUpdateNotificationsToggle analytics event when toggled from off to on', () => {
    // true means alert is disabled which means toggle is currently off
    getAlertIsPermanentlyIgnored.mockReturnValue(true)

    const { wrapper } = render()
    const toggle = wrapper.find(ToggleBtn)

    toggle.invoke('onClick')()

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'appUpdateNotificationsToggle',
      properties: { enabled: true },
    })
  })
})
