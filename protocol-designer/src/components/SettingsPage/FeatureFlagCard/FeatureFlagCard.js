// @flow
import sortBy from 'lodash/sortBy'
import React, { type Node, useState } from 'react'
import { i18n } from '../../../localization'
import { ContinueModal, Card, ToggleButton } from '@opentrons/components'
import { Portal } from '../../portals/MainPageModalPortal'
import styles from '../SettingsPage.css'
import modalStyles from '../../modals/modal.css'
import {
  userFacingFlags,
  type Flags,
  type FlagTypes,
} from '../../../feature-flags'

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

export const FeatureFlagCard = (props: Props) => {
  const [modalFlagName, setModalFlagName] = useState<FlagTypes | null>(null)

  const prereleaseModeEnabled = props.flags.PRERELEASE_MODE === true

  const allFlags = sortBy(Object.keys(props.flags))

  const userFacingFlagNames = allFlags.filter(flagName =>
    userFacingFlags.includes(flagName)
  )

  const prereleaseFlagNames = allFlags.filter(
    flagName => !userFacingFlags.includes(flagName)
  )

  const getDescription = (flag: FlagTypes): Node => {
    const RICH_DESCRIPTIONS: { [FlagTypes]: Node } = {
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

  return (
    <>
      {modalFlagName && (
        <Portal>
          <ContinueModal
            alertOverlay
            className={modalStyles.modal}
            heading={i18n.t('modal.experimental_feature_warning.title')}
            onCancelClick={() => setModalFlagName(null)}
            onContinueClick={() => {
              props.setFeatureFlags({
                [modalFlagName]: !props.flags[modalFlagName],
              })
              setModalFlagName(null)
            }}
          >
            <p>{i18n.t('modal.experimental_feature_warning.body1')}</p>
            <p>{i18n.t('modal.experimental_feature_warning.body2')}</p>
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
