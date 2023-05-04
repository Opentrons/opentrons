import { Alerts } from '..'
import * as AppAlerts from '../../../redux/alerts'
import type { AlertId } from '../../../redux/alerts/types'
import type { State } from '../../../redux/types'
import { AnalyticsSettingsModal } from '../../AnalyticsSettingsModal'
import { UpdateAppModal } from '../../UpdateAppModal'
import { U2EDriverOutdatedAlert } from '../U2EDriverOutdatedAlert'
import { mountWithStore } from '@opentrons/components'
import * as React from 'react'

jest.mock('../../AnalyticsSettingsModal', () => ({
  AnalyticsSettingsModal: () => <></>,
}))

jest.mock('../U2EDriverOutdatedAlert', () => ({
  U2EDriverOutdatedAlert: () => <></>,
}))

jest.mock('../../UpdateAppModal', () => ({
  UpdateAppModal: () => <></>,
}))

jest.mock('../../../redux/alerts/selectors')

const getActiveAlerts = AppAlerts.getActiveAlerts as jest.MockedFunction<
  typeof AppAlerts.getActiveAlerts
>

const MOCK_STATE: State = { mockState: true } as any

describe('app-wide Alerts component', () => {
  const render = () => {
    return mountWithStore<React.ComponentProps<typeof Alerts>>(<Alerts />, {
      initialState: MOCK_STATE,
    })
  }

  const stubActiveAlerts = (alertIds: AlertId[]): void => {
    getActiveAlerts.mockImplementation((state: State): AlertId[] => {
      expect(state).toEqual(MOCK_STATE)
      return alertIds
    })
  }

  beforeEach(() => {
    stubActiveAlerts([])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  // TODO(mc, 2020-05-07): AnalyticsSettingsModal currently controls its own
  // render; move its logic into `state.alerts`
  it('should render AnalyticsSettingsModal', () => {
    const { wrapper } = render()
    expect(wrapper.exists(AnalyticsSettingsModal)).toBe(true)
  })

  it('should render a U2EDriverOutdatedAlert if alert is triggered', () => {
    const { wrapper, store, refresh } = render()
    expect(wrapper.exists(U2EDriverOutdatedAlert)).toBe(false)

    stubActiveAlerts([AppAlerts.ALERT_U2E_DRIVER_OUTDATED])
    refresh()
    expect(wrapper.exists(U2EDriverOutdatedAlert)).toBe(true)

    wrapper.find(U2EDriverOutdatedAlert).invoke('dismissAlert')?.(true)

    expect(store.dispatch).toHaveBeenCalledWith(
      AppAlerts.alertDismissed(AppAlerts.ALERT_U2E_DRIVER_OUTDATED, true)
    )
  })

  it('should render an UpdateAppModal if appUpdateAvailable alert is triggered', () => {
    const { wrapper, store, refresh } = render()
    expect(wrapper.exists(UpdateAppModal)).toBe(false)

    stubActiveAlerts([AppAlerts.ALERT_APP_UPDATE_AVAILABLE])
    refresh()
    expect(wrapper.exists(UpdateAppModal)).toBe(true)

    wrapper.find(UpdateAppModal).invoke('dismissAlert')?.(true)

    expect(store.dispatch).toHaveBeenCalledWith(
      AppAlerts.alertDismissed(AppAlerts.ALERT_APP_UPDATE_AVAILABLE, true)
    )
  })
})
