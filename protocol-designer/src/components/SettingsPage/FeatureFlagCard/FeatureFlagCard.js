// @flow
import * as React from 'react'
import i18n from '../../../localization'
import { Card, ToggleButton } from '@opentrons/components'
import styles from '../SettingsPage.css'
import type { Flags } from '../../../feature-flags'

type Props = {
  flags: Flags,
  setFeatureFlags: (flags: Flags) => mixed,
}

const FeatureFlagCard = (props: Props) => {
  const featureFlagRows = Object.keys(props.flags)
    .sort()
    .map(flagName => (
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
    ))
  return (
    <Card title={i18n.t('card.title.feature_flags')}>
      <div>{featureFlagRows}</div>
    </Card>
  )
}

export default FeatureFlagCard
