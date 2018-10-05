// @flow
import React from 'react'
import {connect} from 'react-redux'
import i18n from '../../localization'
import {Card, ToggleButton} from '@opentrons/components'
import styles from './SettingsPage.css'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'
import type {BaseState} from '../../types'

type Props = {
  hasOptedIn: boolean | null,
  toggleOptedIn: () => mixed,
}

type SP = {
  hasOptedIn: $PropertyType<Props, 'hasOptedIn'>,
}

function Privacy (props: Props) {
  const {hasOptedIn, toggleOptedIn} = props
  return (
    <div className={styles.card_wrapper}>
      <Card title={i18n.t('card.title.privacy')}>
        <div className={styles.toggle_row}>
          <p className={styles.toggle_label}>{i18n.t('card.toggle.share_session')}</p>
          <ToggleButton
            className={styles.toggle_button}
            toggledOn={Boolean(hasOptedIn)}
            onClick={toggleOptedIn} />
        </div>
        <div className={styles.body_wrapper}>
          <p className={styles.card_body}>{i18n.t('card.body.reason_for_collecting_data')}</p>
          <ul className={styles.card_point_list}>
            <li>{i18n.t('card.body.data_collected_is_internal')}</li>
            {/* TODO: BC 2018-09-26 uncomment when only using fullstory <li>{i18n.t('card.body.data_only_from_pd')}</li> */}
            <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

function mapStateToProps (state: BaseState): SP {
  return {
    hasOptedIn: analyticsSelectors.getHasOptedIn(state),
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {dispatch} = dispatchProps
  const {hasOptedIn} = stateProps

  const _toggleOptedIn = hasOptedIn
    ? analyticsActions.optOut
    : analyticsActions.optIn
  return {
    ...stateProps,
    toggleOptedIn: () => dispatch(_toggleOptedIn()),
  }
}

export default connect(mapStateToProps, null, mergeProps)(Privacy)
