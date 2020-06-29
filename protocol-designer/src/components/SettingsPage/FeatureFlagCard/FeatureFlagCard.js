// @flow
import { Card, ContinueModal, ToggleButton } from '@opentrons/components'
import sortBy from 'lodash/sortBy'
import * as React from 'react'

import {
  type Flags,
  type FlagTypes,
  userFacingFlags,
} from '../../../feature-flags'
import { i18n } from '../../../localization'
import modalStyles from '../../modals/modal.css'
import { Portal } from '../../portals/MainPageModalPortal'
import styles from '../SettingsPage.css'

type Props = {|
  flags: Flags,
  setFeatureFlags: (flags: Flags) => mixed,
|}

// TODO (ka 2019-10-28): This is a workaround, see #4446
// but it solves the modal positioning problem caused by main page wrapper
// being positioned absolute until we can figure out something better
const scrollToTop = () => {
  const editPage = document.getElementById('main-page')
  if (editPage) editPage.scrollTop = 0
}

export const FeatureFlagCard = (props: Props): React.Node => {
  const [modalFlagName, setModalFlagName] = React.useState<FlagTypes | null>(
    null
  )

  const prereleaseModeEnabled = props.flags.PRERELEASE_MODE === true

  const allFlags = sortBy(Object.keys(props.flags))

  const userFacingFlagNames = allFlags.filter(flagName =>
    userFacingFlags.includes(flagName)
  )

  const prereleaseFlagNames = allFlags.filter(
    flagName => !userFacingFlags.includes(flagName)
  )

  const getDescription = (flag: FlagTypes): React.Node => {
    const RICH_DESCRIPTIONS: { [FlagTypes]: React.Node } = {
      OT_PD_DISABLE_MODULE_RESTRICTIONS: (
        <>
          <p>{i18n.t(`feature_flags.${flag}.description_1`)} </p>
          <p>{i18n.t(`feature_flags.${flag}.description_2`)} </p>
        </>
      ),
    }
    return (
      RICH_DESCRIPTIONS[flag] || (
        <p>{i18n.t(`feature_flags.${flag}.description`)}</p>
      )
    )
  }

  const toFlagRow = flagName => (
    <div key={flagName}>
      <div className={styles.setting_row}>
        <p className={styles.toggle_label}>
          {i18n.t(`feature_flags.${flagName}.title`)}
        </p>
        <ToggleButton
          className={styles.toggle_button}
          toggledOn={Boolean(props.flags[flagName])}
          onClick={() => {
            scrollToTop()
            setModalFlagName(flagName)
          }}
        />
      </div>
      <div className={styles.feature_flag_description}>
        {getDescription(flagName)}
      </div>
    </div>
  )

  const noFlagsFallback = (
    <p className={styles.setting_row}>
      No experimental settings are available in this version of Protocol
      Designer.
    </p>
  )

  const userFacingFlagRows = userFacingFlagNames.map(toFlagRow)
  const prereleaseFlagRows = prereleaseFlagNames.map(toFlagRow)

  let flagSwitchDirection: string = 'on'

  if (modalFlagName) {
    const isFlagOn: ?boolean = props.flags[modalFlagName]
    flagSwitchDirection = isFlagOn ? 'off' : 'on'
  }
  return (
    <>
      {modalFlagName && (
        <Portal>
          <ContinueModal
            alertOverlay
            className={modalStyles.modal}
            heading={i18n.t(
              `modal.experimental_feature_warning.${flagSwitchDirection}.title`
            )}
            onCancelClick={() => setModalFlagName(null)}
            onContinueClick={() => {
              props.setFeatureFlags({
                [(modalFlagName: string)]: !props.flags[modalFlagName],
              })
              setModalFlagName(null)
            }}
          >
            <p>
              {i18n.t(
                `modal.experimental_feature_warning.${flagSwitchDirection}.body1`
              )}
            </p>
            <p>
              {i18n.t(
                `modal.experimental_feature_warning.${flagSwitchDirection}.body2`
              )}
            </p>
          </ContinueModal>
        </Portal>
      )}
      <Card title={i18n.t('card.title.feature_flags')}>
        <div className={styles.card_content}>
          {userFacingFlagRows.length > 0 ? userFacingFlagRows : noFlagsFallback}
        </div>
      </Card>
      {prereleaseModeEnabled && (
        <Card title={i18n.t('card.title.prerelease_mode_flags')}>
          <div className={styles.card_content}>{prereleaseFlagRows}</div>
        </Card>
      )}
    </>
  )
}
