// @flow
import React from 'react'
// import {connect} from 'react-redux'
import i18n from '../../localization'
import {Card, ToggleButton} from '@opentrons/components'
// import type {BaseState} from '../types'
import styles from './SettingsPage.css'
import {
  optIn,
  optOut,
  getHasOptedIn,
  shutdownAnalytics,
  initializeAnalytics
} from '../../analytics'

type State = {optInToggleValue: boolean}
class Privacy extends React.Component<*, State> {
  state: State = {optInToggleValue: getHasOptedIn()}
  toggleAnalyticsOptInValue = () => {
    const hasOptedIn = getHasOptedIn()
    if (hasOptedIn) {
      shutdownAnalytics()
      if (optOut()) this.setState({optInToggleValue: false})
    } else {
      initializeAnalytics()
      optIn()
      if (optIn()) this.setState({optInToggleValue: true})
    }
    return true
  }

  render () {
    return (
      <div className={styles.card_wrapper}>
        <Card title={i18n.t('card.title.privacy')}>
          <div className={styles.toggle_row}>
            <p className={styles.toggle_label}>{i18n.t('card.toggle.share_session')}</p>
            <ToggleButton
              className={styles.toggle_button}
              toggledOn={this.state.optInToggleValue}
              onClick={this.toggleAnalyticsOptInValue} />
          </div>
          <div className={styles.body_wrapper}>
            <p className={styles.card_body}>{i18n.t('card.body.reason_for_collecting_data')}</p>
            <ul className={styles.card_point_list}>
              <li>{i18n.t('card.body.data_collected_is_internal')}</li>
              <li>{i18n.t('card.body.data_only_from_pd')}</li>
              <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
            </ul>
          </div>
        </Card>
      </div>
    )
  }
}

export default Privacy
