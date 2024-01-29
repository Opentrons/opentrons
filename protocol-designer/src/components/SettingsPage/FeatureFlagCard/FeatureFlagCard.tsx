import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import sortBy from 'lodash/sortBy'
import { ContinueModal, Card, ToggleButton } from '@opentrons/components'
import { resetScrollElements } from '../../../ui/steps/utils'
import {
  userFacingFlags,
  FlagTypes,
  actions as featureFlagActions,
  selectors as featureFlagSelectors,
} from '../../../feature-flags'
import { Portal } from '../../portals/MainPageModalPortal'
import styles from '../SettingsPage.module.css'
import modalStyles from '../../modals/modal.module.css'

export function FeatureFlagCard(): JSX.Element {
  const flags = useSelector(featureFlagSelectors.getFeatureFlagData)
  const dispatch = useDispatch()

  const [modalFlagName, setModalFlagName] = React.useState<FlagTypes | null>(
    null
  )
  const { t } = useTranslation(['modal', 'card', 'feature_flags'])

  const setFeatureFlags = (
    flags: Partial<Record<FlagTypes, boolean | null | undefined>>
  ): void => {
    dispatch(featureFlagActions.setFeatureFlags(flags))
  }

  const prereleaseModeEnabled = flags.PRERELEASE_MODE === true

  // @ts-expect-error(sa, 2021-6-21): Object.keys not smart enough to take keys from props.flags
  const allFlags: FlagTypes[] = sortBy(Object.keys(flags))

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
          <p>{t(`feature_flags:${flag}.description`)} </p>
        </>
      ),
      OT_PD_DISABLE_MODULE_RESTRICTIONS: (
        <>
          <p>{t(`feature_flags:${flag}.description_1`)} </p>
          <p>{t(`feature_flags:${flag}.description_2`)} </p>
        </>
      ),
    }
    return (
      RICH_DESCRIPTIONS[flag] || <p>{t(`feature_flags:${flag}.description`)}</p>
    )
  }

  const toFlagRow = (flagName: FlagTypes): JSX.Element => (
    <div key={flagName}>
      <div className={styles.setting_row}>
        <p className={styles.toggle_label}>
          {t(`feature_flags:${flagName}.title`)}
        </p>
        <ToggleButton
          className={styles.toggle_button}
          toggledOn={Boolean(flags[flagName])}
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
    const isFlagOn: boolean | null | undefined = flags[modalFlagName]
    flagSwitchDirection = isFlagOn ? 'off' : 'on'
  }
  return (
    <>
      {modalFlagName && (
        <Portal>
          <ContinueModal
            alertOverlay
            className={modalStyles.modal}
            heading={t(
              `experimental_feature_warning.${flagSwitchDirection}.title`
            )}
            onCancelClick={() => setModalFlagName(null)}
            onContinueClick={() => {
              setFeatureFlags({
                [modalFlagName as string]: !flags[modalFlagName],
              })
              setModalFlagName(null)
            }}
          >
            <p>
              {t(`experimental_feature_warning.${flagSwitchDirection}.body1`)}
            </p>
            <p>
              {t(`experimental_feature_warning.${flagSwitchDirection}.body2`)}
            </p>
          </ContinueModal>
        </Portal>
      )}
      <Card title={t('card:title.feature_flags')}>
        <div className={styles.card_content}>
          {userFacingFlagRows.length > 0 ? userFacingFlagRows : noFlagsFallback}
        </div>
      </Card>
      {prereleaseModeEnabled && (
        <Card title={t('card:title.prerelease_mode_flags')}>
          <div className={styles.card_content}>{prereleaseFlagRows}</div>
        </Card>
      )}
    </>
  )
}
