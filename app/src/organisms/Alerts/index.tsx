import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'

import * as AppAlerts from '../../redux/alerts'
import { getHasJustUpdated, toggleConfigValue } from '../../redux/config'
import { AnalyticsSettingsModal } from '../AnalyticsSettingsModal'
import { UpdateAppModal } from '../UpdateAppModal'
import { U2EDriverOutdatedAlert } from './U2EDriverOutdatedAlert'
import { useToaster } from '../ToasterOven'
import { SUCCESS_TOAST, WARNING_TOAST } from '../../atoms/Toast'

import type { State, Dispatch } from '../../redux/types'
import type { AlertId } from '../../redux/alerts/types'

export function Alerts(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const [showUpdateModal, setShowUpdateModal] = React.useState<boolean>(false)
  const { t } = useTranslation('app_settings')
  const { makeToast, eatToast } = useToaster()
  const toastRef = React.useRef<string | null>(null)

  // TODO(mc, 2020-05-07): move head logic to selector with alert priorities
  const activeAlertId: AlertId | null = useSelector((state: State) => {
    return head(AppAlerts.getActiveAlerts(state)) ?? null
  })

  const dismissAlert = (remember?: boolean): void => {
    if (activeAlertId != null) {
      dispatch(AppAlerts.alertDismissed(activeAlertId, remember))
    }
  }
  const isAppUpdateIgnored = useSelector((state: State) => {
    return AppAlerts.getAlertIsPermanentlyIgnored(
      state,
      AppAlerts.ALERT_APP_UPDATE_AVAILABLE
    )
  })

  const hasJustUpdated = useSelector(getHasJustUpdated)

  // Only run this hook on app startup
  React.useEffect(() => {
    if (hasJustUpdated) {
      makeToast(t('opentrons_app_successfully_updated'), SUCCESS_TOAST, {
        closeButton: true,
        disableTimeout: true,
      })
      dispatch(toggleConfigValue('update.hasJustUpdated'))
    }
  }, [])

  React.useEffect(() => {
    if (activeAlertId === AppAlerts.ALERT_APP_UPDATE_AVAILABLE)
      toastRef.current = makeToast(
        t('opentrons_app_update_available_variation'),
        WARNING_TOAST,
        {
          closeButton: true,
          disableTimeout: true,
          linkText: t('view_update'),
          onLinkClick: () => setShowUpdateModal(true),
        }
      )
    if (isAppUpdateIgnored && toastRef.current != null)
      eatToast(toastRef.current)
  }, [activeAlertId])

  return (
    <>
      {/* TODO(mc, 2020-05-07): AnalyticsSettingsModal currently controls its
          own render; move its logic into `state.alerts` */}
      <AnalyticsSettingsModal />

      {activeAlertId === AppAlerts.ALERT_U2E_DRIVER_OUTDATED ? (
        <U2EDriverOutdatedAlert dismissAlert={dismissAlert} />
      ) : showUpdateModal ? (
        <UpdateAppModal closeModal={() => setShowUpdateModal(false)} />
      ) : null}
    </>
  )
}
