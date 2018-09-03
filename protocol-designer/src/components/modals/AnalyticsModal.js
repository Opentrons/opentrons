// @flow
import * as React from 'react'
import cx from 'classnames'
import { AlertModal } from '@opentrons/components'
import i18n from '../../localization'
import modalStyles from './modal.css'
import settingsStyles from '../SettingsPage/SettingsPage.css'

const AnalyticsModal = () => {
  return (
    <AlertModal
      className={cx(modalStyles.modal)}
      buttons={[
        {onClick: () => { console.log('no') }, children: i18n.t('button.no')},
        {onClick: () => { console.log('yes') }, children: i18n.t('button.yes')}
      ]}>
      <div>
        <p className={settingsStyles.toggle_label}>{i18n.t('card.toggle.share_session')}</p>
      </div>
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

export default AnalyticsModal
