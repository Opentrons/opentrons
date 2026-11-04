import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import head from 'lodash/head'

import { SUCCESS_TOAST, WARNING_TOAST } from '@opentrons/components'

import { useToaster } from '/app/organisms/ToasterOven'
import * as AppAlerts from '/app/redux/alerts'
import { getHasJustUpdated, toggleConfigValue } from '/app/redux/config'
import { getAvailableShellUpdate } from '/app/redux/shell'

import { useRemoveActiveAppUpdateToast } from '.'
import { UpdateAppModal } from '../UpdateAppModal'
import { U2EDriverOutdatedAlert } from './U2EDriverOutdatedAlert'

import type { MutableRefObject } from 'react'
import type { AlertId } from '/app/redux/alerts/types'
import type { Dispatch, State } from '/app/redux/types'

interface AlertsModalProps {
  toastIdRef: MutableRefObject<string | null>
}

export function AlertsModal({ toastIdRef }: AlertsModalProps): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false)
  const { t, i18n } = useTranslation(['app_settings', 'branded'])
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
  useEffect(
    () => {
      if (hasJustUpdated) {
        makeToast(
          t('branded:opentrons_app_successfully_updated') as string,
          SUCCESS_TOAST,
          {
            closeButton: true,
            disableTimeout: true,
          }
        )
        dispatch(toggleConfigValue('update.hasJustUpdated'))
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(
    () => {
      if (createAppUpdateAvailableToast) {
        if (toastIdRef.current != null) {
          removeActiveAppUpdateToast()
        }
        toastIdRef.current = makeToast(
          t('branded:opentrons_app_update_available_variation') as string,
          WARNING_TOAST,
          {
            closeButton: true,
            disableTimeout: true,
            linkText: t('view_update'),
            onLinkClick: () => {
              setShowUpdateModal(true)
            },
          }
        )
      } else if (removeToast && toastIdRef.current) {
        removeActiveAppUpdateToast()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createAppUpdateAvailableToast, removeToast, i18n.language]
  )

  return (
    <>
      {activeAlertId === AppAlerts.ALERT_U2E_DRIVER_OUTDATED ? (
        <U2EDriverOutdatedAlert dismissAlert={dismissDriverAlert} />
      ) : null}
      {showUpdateModal ? (
        <UpdateAppModal
          closeModal={() => {
            setShowUpdateModal(false)
          }}
        />
      ) : null}
    </>
  )
}
