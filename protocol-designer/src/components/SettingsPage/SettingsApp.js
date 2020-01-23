// @flow
import React from 'react'
import { connect } from 'react-redux'
import i18n from '../../localization'
import {
  Card,
  OutlineButton,
  ToggleButton,
  LabeledValue,
} from '@opentrons/components'
import {
  actions as analyticsActions,
  selectors as analyticsSelectors,
} from '../../analytics'
import {
  actions as tutorialActions,
  selectors as tutorialSelectors,
} from '../../tutorial'
import { OLDEST_MIGRATEABLE_VERSION } from '../../load-file/migration'
import { FeatureFlagCard } from './FeatureFlagCard'
import styles from './SettingsPage.css'
import type { BaseState, ThunkDispatch } from '../../types'

type Props = {
  canClearHintDismissals: boolean,
  hasOptedIn: boolean | null,
  restoreHints: () => mixed,
  toggleOptedIn: () => mixed,
}

type SP = {|
  canClearHintDismissals: $PropertyType<Props, 'canClearHintDismissals'>,
  hasOptedIn: $PropertyType<Props, 'hasOptedIn'>,
|}

function SettingsAppComponent(props: Props) {
  const {
    canClearHintDismissals,
    hasOptedIn,
    restoreHints,
    toggleOptedIn,
  } = props
  return (
    <>
      <div className={styles.page_row}>
        <Card title={i18n.t('card.title.information')}>
          <div className={styles.card_content}>
            <div className={styles.setting_row}>
              <LabeledValue
                className={styles.labeled_value}
                label={i18n.t('application.version')}
                value={process.env.OT_PD_VERSION || OLDEST_MIGRATEABLE_VERSION}
              />
              {/* TODO: BC 2019-02-26 add release notes link here, when there are release notes */}
            </div>
          </div>
        </Card>
      </div>
      <div className={styles.page_row}>
        <Card title={i18n.t('card.title.hints')}>
          <div className={styles.card_content}>
            <div className={styles.setting_row}>
              {i18n.t('card.body.restore_hints')}
              <OutlineButton
                className={styles.button}
                disabled={!canClearHintDismissals}
                onClick={restoreHints}
              >
                {canClearHintDismissals
                  ? i18n.t('button.restore')
                  : i18n.t('button.restored')}
              </OutlineButton>
            </div>
          </div>
        </Card>
      </div>
      <div className={styles.page_row}>
        <Card title={i18n.t('card.title.privacy')}>
          <div className={styles.card_content}>
            <div className={styles.setting_row}>
              <p className={styles.toggle_label}>
                {i18n.t('card.toggle.share_session')}
              </p>
              <ToggleButton
                className={styles.toggle_button}
                toggledOn={Boolean(hasOptedIn)}
                onClick={toggleOptedIn}
              />
            </div>

            <p className={styles.card_body}>
              {i18n.t('card.body.reason_for_collecting_data')}
            </p>
            <ul className={styles.card_point_list}>
              <li>{i18n.t('card.body.data_collected_is_internal')}</li>
              {/* TODO: BC 2018-09-26 uncomment when only using fullstory <li>{i18n.t('card.body.data_only_from_pd')}</li> */}
              <li>{i18n.t('card.body.opt_out_of_data_collection')}</li>
            </ul>
          </div>
        </Card>
      </div>
      <div className={styles.page_row}>
        <FeatureFlagCard />
      </div>
    </>
  )
}

function mapStateToProps(state: BaseState): SP {
  return {
    hasOptedIn: analyticsSelectors.getHasOptedIn(state),
    canClearHintDismissals: tutorialSelectors.getCanClearHintDismissals(state),
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> }
): Props {
  const { dispatch } = dispatchProps
  const { hasOptedIn } = stateProps

  const _toggleOptedIn = hasOptedIn
    ? analyticsActions.optOut
    : analyticsActions.optIn
  return {
    ...stateProps,
    toggleOptedIn: () => dispatch(_toggleOptedIn()),
    restoreHints: () => dispatch(tutorialActions.clearAllHintDismissals()),
  }
}

export const SettingsApp = connect<Props, {||}, SP, {||}, BaseState, _>(
  mapStateToProps,
  null,
  mergeProps
)(SettingsAppComponent)
