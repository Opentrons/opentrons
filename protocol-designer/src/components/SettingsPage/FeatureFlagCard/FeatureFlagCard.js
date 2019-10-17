// @flow
import sortBy from 'lodash/sortBy'
import * as React from 'react'
import i18n from '../../../localization'
import { Card, ToggleButton } from '@opentrons/components'
import styles from '../SettingsPage.css'
import { userFacingFlags, type Flags } from '../../../feature-flags'

type Props = {|
  flags: Flags,
  setFeatureFlags: (flags: Flags) => mixed,
|}

const FeatureFlagCard = (props: Props) => {
  const prereleaseModeEnabled = props.flags.PRERELEASE_MODE === true

  const allFlags = sortBy(Object.keys(props.flags))

  const userFacingFlagNames = allFlags.filter(flagName =>
    userFacingFlags.includes(flagName)
  )

  const prereleaseFlagNames = allFlags.filter(
    flagName => !userFacingFlags.includes(flagName)
  )

  const toFlagRow = flagName => (
    <div key={flagName}>
      <div className={styles.setting_row}>
        <p className={styles.toggle_label}>
          {i18n.t(`feature_flags.${flagName}.title`)}
        </p>
        <ToggleButton
          className={styles.toggle_button}
          toggledOn={Boolean(props.flags[flagName])}
          onClick={() =>
            props.setFeatureFlags({
              [flagName]: !props.flags[flagName],
            })
          }
        />
      </div>
      <p className={styles.feature_flag_description}>
        {i18n.t(`feature_flags.${flagName}.description`)}
      </p>
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
      <Card title={i18n.t('card.title.feature_flags')}>
        <div>
          {userFacingFlagRows.length > 0 ? userFacingFlagRows : noFlagsFallback}
        </div>
      </Card>
      {prereleaseModeEnabled && (
        <Card title={i18n.t('card.title.prerelease_mode_flags')}>
          <div>{prereleaseFlagRows}</div>
        </Card>
      )}
    </>
  )
}

export default FeatureFlagCard
