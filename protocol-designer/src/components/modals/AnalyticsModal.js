// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import cx from 'classnames'
import { AlertModal } from '@opentrons/components'
import i18n from '../../localization'
import modalStyles from './modal.css'
import settingsStyles from '../SettingsPage/SettingsPage.css'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'
import type {BaseState} from '../../types'

type Props = {
  hasOptedIn: boolean | null,
  optIn: () => mixed,
  optOut: () => mixed,
}

type SP = {
  hasOptedIn: $PropertyType<Props, 'hasOptedIn'>,
}

type DP = $Diff<Props, SP>

function AnalyticsModal (props: Props) {
  const {hasOptedIn, optIn, optOut} = props
  if (hasOptedIn !== null) return null
  return (
    <AlertModal
      className={cx(modalStyles.modal)}
      buttons={[
        {
          onClick: optOut,
          children: i18n.t('button.no'),
        },
        {
          onClick: optIn,
          children: i18n.t('button.yes'),
        },
      ]}>
      <h3>{i18n.t('card.toggle.share_session')}</h3>
      <div className={settingsStyles.body_wrapper}>
        <p className={settingsStyles.card_body}>{i18n.t('card.body.reason_for_collecting_data')}</p>
        <ul className={settingsStyles.card_point_list}>
          <li>{i18n.t('card.body.data_collected_is_internal')}</li>
          {/* TODO: BC 2018-09-26 uncomment when only using fullstory <li>{i18n.t('card.body.data_only_from_pd')}</li> */}
          <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
        </ul>
      </div>
    </AlertModal>
  )
}

function mapStateToProps (state: BaseState): SP {
  return {hasOptedIn: analyticsSelectors.getHasOptedIn(state)}
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    optIn: () => dispatch(analyticsActions.optIn()),
    optOut: () => dispatch(analyticsActions.optOut()),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AnalyticsModal)
