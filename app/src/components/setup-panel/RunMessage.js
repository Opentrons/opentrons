// @flow
import React from 'react'
import InfoBox from '../InfoBox'

import styles from './styles.css'

export default function RunMessage () {
  return (
    <InfoBox className={styles.run_message}>
      <p className={styles.run_message_item}>
        Hurray, your robot is now ready! Click [RUN PROTOCOL] to start your run.
      </p>
      <p className={styles.run_message_item}>
        Tip: Try a dry run prior to adding your samples and re-agents to avoid
        wasting materials.
      </p>
    </InfoBox>
  )
}
