import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import head from 'lodash/head'

import * as AppAlerts from '../../redux/alerts'
import { LostConnectionAlert } from './LostConnectionAlert'
import { AnalyticsSettingsModal } from '../AnalyticsSettingsModal'
import { UpdateAppModal } from '../UpdateAppModal'
import { U2EDriverOutdatedAlert } from './U2EDriverOutdatedAlert'

import type { State, Dispatch } from '../../redux/types'
import type { AlertId } from '../../redux/alerts/types'

export function Alerts(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()

  // TODO(mc, 2020-05-07): move head logic to selector with alert priorities
  const activeAlert: AlertId | null = useSelector((state: State) => {
    return head(AppAlerts.getActiveAlerts(state)) ?? null
  })

  const dismissAlert = (remember?: boolean): void => {
    if (activeAlert) {
      dispatch(AppAlerts.alertDismissed(activeAlert, remember))
    }
  }

  return (
    <>
      {/* TODO(mc, 2020-05-07): LostConnectionAlert currently controls its own
          render; move its logic into `state.alerts` */}
      <LostConnectionAlert />
      {/* TODO(mc, 2020-05-07): AnalyticsSettingsModal currently controls its
          own render; move its logic into `state.alerts` */}
      <AnalyticsSettingsModal />

      {activeAlert === AppAlerts.ALERT_U2E_DRIVER_OUTDATED ? (
        <U2EDriverOutdatedAlert dismissAlert={dismissAlert} />
      ) : activeAlert === AppAlerts.ALERT_APP_UPDATE_AVAILABLE ? (
        <UpdateAppModal dismissAlert={dismissAlert} />
      ) : null}
    </>
  )
}
