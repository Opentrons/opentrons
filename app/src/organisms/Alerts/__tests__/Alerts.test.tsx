import * as React from 'react'
import { when } from 'jest-when'

import { mountWithStore } from '@opentrons/components'
import * as AppAlerts from '../../../redux/alerts'
import { getAvailableShellUpdate } from '../../../redux/shell'
import { getHasJustUpdated } from '../../../redux/config'
import { TOAST_ANIMATION_DURATION } from '../../../atoms/Toast'
import { AlertsModal } from '../AlertsModal'
import { AnalyticsSettingsModal } from '../../AnalyticsSettingsModal'
import { U2EDriverOutdatedAlert } from '../U2EDriverOutdatedAlert'
import { UpdateAppModal } from '../../UpdateAppModal'
import { useRemoveActiveAppUpdateToast } from '..'

import type { State } from '../../../redux/types'
import type { AlertId } from '../../../redux/alerts/types'

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
jest.mock('../../../redux/shell')
jest.mock('../../../redux/config')
jest.mock('..')

const getActiveAlerts = AppAlerts.getActiveAlerts as jest.MockedFunction<
  typeof AppAlerts.getActiveAlerts
>
const mockGetAvailableShellUpdate = getAvailableShellUpdate as jest.MockedFunction<
  typeof getAvailableShellUpdate
>
const mockGetHasJustUpdated = getHasJustUpdated as jest.MockedFunction<
  typeof getHasJustUpdated
>
const mockUseRemoveActiveAppUpdateToast = useRemoveActiveAppUpdateToast as jest.MockedFunction<
  typeof useRemoveActiveAppUpdateToast
>

const MOCK_STATE: State = { mockState: true } as any

describe('app-wide Alerts component', () => {
  let props: React.ComponentProps<typeof AlertsModal>
  const mockUseRef = { current: null }

  const render = () => {
    return mountWithStore<React.ComponentProps<typeof AlertsModal>>(
      <AlertsModal {...props} />,
      {
        initialState: MOCK_STATE,
      }
    )
  }

  const stubActiveAlerts = (alertIds: AlertId[]): void => {
    getActiveAlerts.mockImplementation((state: State): AlertId[] => {
      expect(state).toEqual(MOCK_STATE)
      return alertIds
    })
  }

  beforeEach(() => {
    stubActiveAlerts([])
    when(mockGetAvailableShellUpdate).mockReturnValue('true')
    when(mockGetHasJustUpdated).mockReturnValue(false)
    when(mockUseRemoveActiveAppUpdateToast).calledWith().mockReturnValue({
      removeActiveAppUpdateToast: jest.fn(),
    })
    props = {
      toastIdRef: mockUseRef,
    }
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
  it('should render a software update toast if a software update is available that is dismissed when clicked', () => {
    const { wrapper, refresh } = render()
    expect(wrapper.exists(UpdateAppModal)).toBe(false)

    stubActiveAlerts([AppAlerts.ALERT_APP_UPDATE_AVAILABLE])
    refresh()

    setTimeout(() => {
      expect(wrapper.contains('View Update')).toBe(true)
      wrapper.findWhere(node => node.text() === 'View Update').simulate('click')
      setTimeout(
        () => expect(wrapper.contains('View Update')).toBe(false),
        TOAST_ANIMATION_DURATION
      )
    }, TOAST_ANIMATION_DURATION)
  })
  it('should render an UpdateAppModal if the app update toast is clicked', () => {
    const { wrapper, store, refresh } = render()
    expect(wrapper.exists(UpdateAppModal)).toBe(false)

    stubActiveAlerts([AppAlerts.ALERT_APP_UPDATE_AVAILABLE])
    refresh()

    setTimeout(() => {
      expect(wrapper.contains('View Update')).toBe(true)
      wrapper.findWhere(node => node.text() === 'View Update').simulate('click')

      expect(wrapper.exists(UpdateAppModal)).toBe(true)

      wrapper.find(UpdateAppModal).invoke('closeModal')?.(true)

      expect(store.dispatch).toHaveBeenCalledWith(
        AppAlerts.alertDismissed(AppAlerts.ALERT_APP_UPDATE_AVAILABLE, true)
      )
    }, TOAST_ANIMATION_DURATION)
  })
  it('should render a success toast if the software update was successful', () => {
    const { wrapper } = render()
    when(mockGetHasJustUpdated).mockReturnValue(true)

    setTimeout(() => {
      expect(wrapper.contains('successfully updated')).toBe(true)
    }, TOAST_ANIMATION_DURATION)
  })
  it('should not render an app update toast if a software update is no longer available', () => {
    when(mockGetAvailableShellUpdate).mockReturnValue('false')
    const { wrapper } = render()
    setTimeout(() => {
      expect(wrapper.contains('View Update')).toBe(false)
      expect(mockUseRemoveActiveAppUpdateToast).toHaveBeenCalled()
    }, TOAST_ANIMATION_DURATION)
  })
})
