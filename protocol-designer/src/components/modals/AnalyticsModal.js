// @flow
import * as React from 'react'
import cx from 'classnames'
import { AlertModal } from '@opentrons/components'
import i18n from '../../localization'
import modalStyles from './modal.css'
import settingsStyles from '../SettingsPage/SettingsPage.css'
import {
  initializeAnalytics,
  shutdownAnalytics,
  optIn,
  optOut,
  getHasOptedIn
} from '../../analytics'

type State = {isAnalyticsModalOpen: boolean}

class AnalyticsModal extends React.Component<*, State> {
  constructor () {
    super()
    const hasOptedIn = getHasOptedIn()
    let initialState = {isAnalyticsModalOpen: false}
    if (hasOptedIn === null) { // NOTE: only null if never set
      initialState = {isAnalyticsModalOpen: true}
    } else if (hasOptedIn === true) {
      initializeAnalytics()
    } else {
      // sanity check: there shouldn't be an analytics session, but shutdown just in case if user opted out
      shutdownAnalytics()
    }
    this.state = initialState
  }
  handleCloseAnalyticsModal = () => {
    this.setState({isAnalyticsModalOpen: false})
  }
  render () {
    if (!this.state.isAnalyticsModalOpen) return null
    return (
      <AlertModal
        className={cx(modalStyles.modal)}
        buttons={[
          {
            onClick: () => {
              this.handleCloseAnalyticsModal()
              optOut()
              shutdownAnalytics() // sanity check, there shouldn't be an analytics instance yet
            },
            children: i18n.t('button.no')
          },
          {
            onClick: () => {
              this.handleCloseAnalyticsModal()
              optIn()
              initializeAnalytics()
            },
            children: i18n.t('button.yes')
          }
        ]}>
        <h3>{i18n.t('card.toggle.share_session')}</h3>
        <div className={settingsStyles.body_wrapper}>
          <p className={settingsStyles.card_body}>{i18n.t('card.body.reason_for_collecting_data')}</p>
          <ul className={settingsStyles.card_point_list}>
            <li>{i18n.t('card.body.data_collected_is_internal')}</li>
            <li>{i18n.t('card.body.data_only_from_pd')}</li>
            <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
          </ul>
        </div>
      </AlertModal>

    )
  }
}

export default AnalyticsModal
