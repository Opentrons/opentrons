import sortBy from 'lodash/sortBy'
import * as React from 'react'
import { ContinueModal, Card, ToggleButton } from '@opentrons/components'
import { i18n } from '../../../localization'
import { resetScrollElements } from '../../../ui/steps/utils'
import { Portal } from '../../portals/MainPageModalPortal'
import styles from '../SettingsPage.css'
import modalStyles from '../../modals/modal.css'
import { userFacingFlags, Flags, FlagTypes } from '../../../feature-flags'

export interface Props {
  flags: Flags
  setFeatureFlags: (flags: Flags) => unknown
}

export const FeatureFlagCard = (props: Props): JSX.Element => {
  const [modalFlagName, setModalFlagName] = React.useState<FlagTypes | null>(
    null
  )

  const prereleaseModeEnabled = props.flags.PRERELEASE_MODE === true

  // @ts-expect-error(sa, 2021-6-21): Object.keys not smart enough to take keys from props.flags
  const allFlags: FlagTypes[] = sortBy(Object.keys(props.flags))

  const userFacingFlagNames = allFlags.filter(flagName =>
    userFacingFlags.includes(flagName)
  )

  const prereleaseFlagNames = allFlags.filter(
    flagName => !userFacingFlags.includes(flagName)
  )

  const getDescription = (flag: FlagTypes): JSX.Element => {
    const RICH_DESCRIPTIONS: Partial<Record<FlagTypes, JSX.Element>> = {
      OT_PD_ALLOW_ALL_TIPRACKS: (
        <>
          <p>{i18n.t(`feature_flags.${flag}.description`)} </p>
        </>
      ),
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

  const toFlagRow = (flagName: FlagTypes): JSX.Element => (
    <div key={flagName}>
      <div className={styles.setting_row}>
        <p className={styles.toggle_label}>
          {i18n.t(`feature_flags.${flagName}.title`)}
        </p>
        <ToggleButton
          className={styles.toggle_button}
          toggledOn={Boolean(props.flags[flagName])}
          onClick={() => {
            resetScrollElements()
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
    const isFlagOn: boolean | null | undefined = props.flags[modalFlagName]
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
                [modalFlagName as string]: !props.flags[modalFlagName],
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
