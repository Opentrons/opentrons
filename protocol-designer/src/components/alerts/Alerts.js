// @flow
import * as React from 'react'
import assert from 'assert'
import { AlertItem, OutlineButton } from '@opentrons/components'
import i18n from '../../localization'
// TODO: Ian 2019-03-27 the use of Component Library `Alert` is being
// stretched beyond its intentions here, we should reconcile PD + Run App uses of Alert later
import styles from './alerts.css'
import type { AlertData } from './types'

/* TODO:  BC 2018-09-13 this component is an abstraction that is meant to be shared for timeline
 * and form level alerts. Currently it is being used in TimelineAlerts, but it should be used in
 * FormAlerts as well. This change will also include adding form level alert copy to i18n
 * see #1814 for reference
 */

type Props = {
  errors: Array<AlertData>,
  warnings: Array<AlertData>,
  dismissWarning: string => mixed,
}

type MakeAlert = (
  alertType: 'error' | 'warning',
  data: AlertData,
  key: number | string
) => React.Node

class Alerts extends React.Component<Props> {
  makeHandleCloseWarning = (dismissId: ?string) => () => {
    assert(dismissId, 'expected dismissId, Alert cannot dismiss warning')
    if (dismissId) {
      this.props.dismissWarning(dismissId)
    }
  }

  makeAlert: MakeAlert = (alertType, data, key) => {
    return (
      <AlertItem
        type={alertType}
        key={`${alertType}:${key}`}
        title={
          <div className={styles.alert_inner_wrapper}>
            <div className={styles.icon_label}>
              {i18n.t(`alert.type.${alertType}`)}
            </div>
            <div className={styles.alert_body}>
              <div className={styles.alert_title}>
                {data.title}
                {/* i18n.t(`alert.${level}.${alertType}.${data.type}.title`) */}
              </div>
              <div className={styles.alert_description}>{data.description}</div>
            </div>
            {alertType === 'warning' && (
              <OutlineButton
                className={styles.dismiss_button}
                onClick={this.makeHandleCloseWarning(data.dismissId)}
              >
                {i18n.t('alert.dismiss')}
              </OutlineButton>
            )}
          </div>
        }
        onCloseClick={undefined}
      />
    )
  }

  render() {
    return (
      <React.Fragment>
        {this.props.errors.map((error, key) =>
          this.makeAlert('error', error, key)
        )}
        {this.props.warnings.map((warning, key) =>
          this.makeAlert('warning', warning, key)
        )}
      </React.Fragment>
    )
  }
}

export default Alerts
