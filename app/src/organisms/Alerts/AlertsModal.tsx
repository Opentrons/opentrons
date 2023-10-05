import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'

import * as AppAlerts from '../../redux/alerts'
import { getHasJustUpdated, toggleConfigValue } from '../../redux/config'
import { getAvailableShellUpdate } from '../../redux/shell'
import { SUCCESS_TOAST, WARNING_TOAST } from '../../atoms/Toast'
import { useToaster } from '../ToasterOven'
import { AnalyticsSettingsModal } from '../AnalyticsSettingsModal'
import { UpdateAppModal } from '../UpdateAppModal'
import { U2EDriverOutdatedAlert } from './U2EDriverOutdatedAlert'
import { useRemoveActiveAppUpdateToast } from '.'

import type { State, Dispatch } from '../../redux/types'
import type { AlertId } from '../../redux/alerts/types'
import type { MutableRefObject } from 'react'

interface AlertsModalProps {
  toastIdRef: MutableRefObject<string | null>
}

export function AlertsModal({ toastIdRef }: AlertsModalProps): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const [showUpdateModal, setShowUpdateModal] = React.useState<boolean>(false)
  const { t } = useTranslation('app_settings')
  const { makeToast } = useToaster()
  const { removeActiveAppUpdateToast } = useRemoveActiveAppUpdateToast()

  // TODO(mc, 2020-05-07): move head logic to selector with alert priorities
  const activeAlertId: AlertId | null = useSelector((state: State) => {
    return head(AppAlerts.getActiveAlerts(state)) ?? null
  })
  const isAppUpdateAvailable = Boolean(useSelector(getAvailableShellUpdate))

  const dismissDriverAlert = (remember?: boolean): void => {
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
  const removeToast = !isAppUpdateAvailable || isAppUpdateIgnored
  const createAppUpdateAvailableToast =
    isAppUpdateAvailable && !isAppUpdateIgnored

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
    if (createAppUpdateAvailableToast) {
      toastIdRef.current = makeToast(
        t('opentrons_app_update_available_variation'),
        WARNING_TOAST,
        {
          closeButton: true,
          disableTimeout: true,
          linkText: t('view_update'),
          onLinkClick: () => setShowUpdateModal(true),
        }
      )
    } else if (removeToast && toastIdRef.current) {
      removeActiveAppUpdateToast()
    }
  }, [isAppUpdateAvailable, isAppUpdateIgnored])

  return (
    <>
      {/* TODO(mc, 2020-05-07): AnalyticsSettingsModal currently controls its
            own render; move its logic into `state.alerts` */}
      <AnalyticsSettingsModal />

      {activeAlertId === AppAlerts.ALERT_U2E_DRIVER_OUTDATED ? (
        <U2EDriverOutdatedAlert dismissAlert={dismissDriverAlert} />
      ) : null}
      {showUpdateModal ? (
        <UpdateAppModal closeModal={() => setShowUpdateModal(false)} />
      ) : null}
    </>
  )
}
