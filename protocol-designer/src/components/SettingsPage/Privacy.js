// @flow
import React from 'react'
// import {connect} from 'react-redux'
import i18n from '../../localization'
import {Card, ToggleButton} from '@opentrons/components'
// import type {BaseState} from '../types'
// import {selectors, type Page} from '../navigation'
import styles from './SettingsPage.css'

type Props = {currentPage: Page}

class Privacy extends React.Component<Props> {
  toggleAnalyticsOptInValue = () => {
    // TODO: BC 2018-09-01 replace with actual localStorage setting
    console.info('attempted to toggle analytic opt in value')
    return true
  }

  getAnalyticsOptInValue = () => {
    // TODO: BC 2018-09-01 replace with actual localStorage value
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
              toggledOn={this.getAnalyticsOptInValue()}
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
