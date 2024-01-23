import * as React from 'react'
import { connect } from 'react-redux'
import { useTranslation } from 'react-i18next'
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
import { BaseState, ThunkDispatch } from '../../types'

interface Props {
  canClearHintDismissals: boolean
  hasOptedIn: boolean | null
  restoreHints: () => unknown
  toggleOptedIn: () => unknown
}

interface SP {
  canClearHintDismissals: Props['canClearHintDismissals']
  hasOptedIn: Props['hasOptedIn']
}

function SettingsAppComponent(props: Props): JSX.Element {
  const {
    canClearHintDismissals,
    hasOptedIn,
    restoreHints,
    toggleOptedIn,
  } = props
  const { t } = useTranslation(['card', 'application', 'button'])
  return (
    <>
      <div className={styles.page_row}>
        <Card title={t('title.information')}>
          <div className={styles.card_content}>
            <div className={styles.setting_row}>
              <LabeledValue
                className={styles.labeled_value}
                label={t('application:version')}
                value={process.env.OT_PD_VERSION || OLDEST_MIGRATEABLE_VERSION}
              />
              {/* TODO: BC 2019-02-26 add release notes link here, when there are release notes */}
            </div>
          </div>
        </Card>
      </div>
      <div className={styles.page_row}>
        <Card title={t('title.hints')}>
          <div className={styles.card_content}>
            <div className={styles.setting_row}>
              {t('body.restore_hints')}
              <OutlineButton
                className={styles.button}
                disabled={!canClearHintDismissals}
                onClick={restoreHints}
              >
                {canClearHintDismissals
                  ? t('button:restore')
                  : t('button:restored')}
              </OutlineButton>
            </div>
          </div>
        </Card>
      </div>
      <div className={styles.page_row}>
        <Card title={t('title.privacy')}>
          <div className={styles.card_content}>
            <div className={styles.setting_row}>
              <p className={styles.toggle_label}>{t('toggle.share_session')}</p>
              <ToggleButton
                className={styles.toggle_button}
                toggledOn={Boolean(hasOptedIn)}
                onClick={toggleOptedIn}
              />
            </div>

            <p className={styles.card_body}>
              {t('body.reason_for_collecting_data')}{' '}
              {t('body.data_collected_is_internal')}.
            </p>
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
  dispatchProps: { dispatch: ThunkDispatch<any> }
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

export const SettingsApp = connect(
  mapStateToProps,
  null,
  mergeProps
)(SettingsAppComponent)
