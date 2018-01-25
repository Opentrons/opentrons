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
          Confirming labware calibration is recomended but not required.
        <p className={styles.run_message_item}>
          Click [RUN PROTOCOL] to start your run.
        </p>
        </p>
      </InfoBox>
    )
  } else {
    return (
      <InfoBox className={styles.run_message}>
        <p className={styles.run_message_item}>
          You can now proceed to labware calibration or
          click [RUN PROTOCOL] to start your run.
        </p>
        <p className={styles.run_message_item}>
          Tip: Calibrating labware is recomended, but not required.
        </p>
      </InfoBox>
    )
  }
}
