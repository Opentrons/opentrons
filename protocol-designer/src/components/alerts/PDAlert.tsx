import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertItem, OutlineButton } from '@opentrons/components'
import type { AlertData, AlertType } from './types'

// TODO: Ian 2019-03-27 the use of Component Library `Alert` is being
// stretched beyond its intentions here, we should reconcile PD + Run App uses of Alert later
import styles from './alerts.css'

interface PDAlertProps {
  alertType: AlertType
  title: string
  description: AlertData['description']
  onDismiss?: (() => unknown) | null
}

export const PDAlert = (props: PDAlertProps): JSX.Element => {
  const { alertType, title, description, onDismiss } = props
  const { t } = useTranslation('alert')
  return (
    <AlertItem
      type={alertType}
      title={
        <div className={styles.alert_inner_wrapper}>
          <div className={styles.icon_label}>{t(`type.${alertType}`)}</div>
          <div className={styles.alert_body}>
            <div className={styles.alert_title}>{title}</div>
            <div className={styles.alert_description}>{description}</div>
          </div>
          {onDismiss != null && (
            <OutlineButton
              className={styles.dismiss_button}
              onClick={onDismiss}
            >
              {t('dismiss')}
            </OutlineButton>
          )}
        </div>
      }
    />
  )
}
