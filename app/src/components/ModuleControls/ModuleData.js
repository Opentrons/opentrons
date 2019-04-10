// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'
import styles from './styles.css'

type Props = {
  currentTemp: ?number,
  targetTemp: ?number,
}

export default function ModuleData(props: Props) {
  const { currentTemp, targetTemp } = props
  return (
    <div className={styles.module_data}>
      <LabeledValue
        label="Current Temp"
        value={currentTemp ? `${currentTemp} °C` : 'None'}
        className={styles.span_50}
      />
      <LabeledValue
        label="Target Temp"
        value={targetTemp ? `${targetTemp} °C` : 'None'}
        className={styles.span_50}
      />
    </div>
  )
}
