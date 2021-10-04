import * as React from 'react'
import { mountWithStore, BORDER_SOLID_LIGHT } from '@opentrons/components'
import * as Alerts from '../../../../redux/alerts'
import * as Analytics from '../../../../redux/analytics'
import { TitledControl } from '../../../../atoms/TitledControl'
import { ToggleBtn } from '../../../../atoms/ToggleBtn'
import { UpdateNotificationsControl } from '../UpdateNotificationsControl'

import type { StyleProps } from '@opentrons/components'
import type { State, Action } from '../../../../redux/types'
import { AnalyticsEvent } from '../../../../redux/analytics/types'

jest.mock('../../../../redux/alerts/selectors')
jest.mock('../../../../redux/analytics/hooks')

const getAlertIsPermanentlyIgnored = Alerts.getAlertIsPermanentlyIgnored as jest.MockedFunction<
  typeof Alerts.getAlertIsPermanentlyIgnored
>

const useTrackEvent = Analytics.useTrackEvent as jest.MockedFunction<
  typeof Analytics.useTrackEvent
>

const MOCK_STATE: State = {} as any

describe('UpdateNotificationsControl', () => {
  const trackEvent: (e: AnalyticsEvent) => void = jest.fn() as any

  const render = (styleProps: Partial<StyleProps> = {}) => {
    return mountWithStore<
      React.ComponentProps<typeof UpdateNotificationsControl>,
      State,
      Action
    >(<UpdateNotificationsControl {...styleProps} />, {
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

    toggle.invoke('onClick')?.({} as React.MouseEvent)

    expect(store.dispatch).toHaveBeenCalledWith(
      Alerts.alertUnignored(Alerts.ALERT_APP_UPDATE_AVAILABLE)
    )
  })

  it('should ignore app alerts when toggled from on to off', () => {
    // false means alert is enabled which means toggle is on
    getAlertIsPermanentlyIgnored.mockReturnValue(false)

    const { wrapper, store } = render()
    const toggle = wrapper.find(ToggleBtn)

    toggle.invoke('onClick')?.({} as React.MouseEvent)

    expect(store.dispatch).toHaveBeenCalledWith(
      Alerts.alertPermanentlyIgnored(Alerts.ALERT_APP_UPDATE_AVAILABLE)
    )
  })

  it('should send an appUpdateNotificationsToggled analytics event when toggled from on to off', () => {
    // false means alert is enabled which means toggle is currently on
    getAlertIsPermanentlyIgnored.mockReturnValue(false)

    const { wrapper } = render()
    const toggle = wrapper.find(ToggleBtn)

    toggle.invoke('onClick')?.({} as React.MouseEvent)

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'appUpdateNotificationsToggled',
      properties: { updatesIgnored: true },
    })
  })

  it('should send an appUpdateNotificationsToggled analytics event when toggled from off to on', () => {
    // true means alert is disabled which means toggle is currently off
    getAlertIsPermanentlyIgnored.mockReturnValue(true)

    const { wrapper } = render()
    const toggle = wrapper.find(ToggleBtn)

    toggle.invoke('onClick')?.({} as React.MouseEvent)

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'appUpdateNotificationsToggled',
      properties: { updatesIgnored: false },
    })
  })
})
