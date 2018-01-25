// @flow
import React from 'react'
import InfoBox from '../InfoBox'
import styles from './run-panel.css'

type Props = {
  labwareConfirmed: boolean
}

export default function RunMessage (props: Props) {
  const {labwareConfirmed} = props
  if (labwareConfirmed) {
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
  } else {
    return (
      <InfoBox className={styles.run_message}>
        <p className={styles.run_message_item}>
          Click [RUN PROTOCOL] to start your run.
        </p>
        <p className={styles.run_message_item}>
          Tip: Calibrating labware is recomended, but not required.
        </p>
      </InfoBox>
    )
  }
}
