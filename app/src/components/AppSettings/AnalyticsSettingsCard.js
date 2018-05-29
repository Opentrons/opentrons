// @flow
// info on analytic data collected and toggle to opt in/out
import * as React from 'react'
import ToggleButton from '../ToggleButton'
import {Card} from '@opentrons/components'
import styles from './styles.css'

type Props = {
  analyticsOptedIn: boolean,
  toggleAnalyticsOptedIn: () => mixed,
}

const TITLE = 'Privacy Settings'

export default function AnalyticsSettingsCard (props: Props) {
  const {analyticsOptedIn, toggleAnalyticsOptedIn} = props

  return (
    <Card title={TITLE} column>
      <div className={styles.analytics_toggle}>
        <p className={styles.analytics_label}>Share Robot & App analytics with Opentrons</p>

        <ToggleButton
          className={styles.analytics_icon}
          toggledOn={analyticsOptedIn}
          onClick={toggleAnalyticsOptedIn}
        />
      </div>
      <div className={styles.analytics_info}>
        <p>Help Opentrons improve its products and services by automatically sending anonymous diagnostic and usage data.</p>
        <p>This will allow us to learn things such as which features get used the most, which parts of the process are taking longest to complete, and how errors are generated.</p>
      </div>
    </Card>
  )
}
