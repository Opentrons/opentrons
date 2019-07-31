// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { ThermocyclerModule } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'
import styles from './styles.css'

type TempsItemProps = {
  title: string,
  current: number,
  target: ?number,
}
const TempsItem = ({ title, current, target }: TempsItemProps) => (
  <div>
    <h5 className={styles.label}>{title}</h5>
    <div className={styles.data_row}>
      <p>Current:</p>
      <p>{`${current} °C`}</p>
    </div>
    <div className={styles.data_row}>
      <p>Target:</p>
      <p>{target ? `${target} °C` : 'None'}</p>
    </div>
  </div>
)

type Props = {|
  module: ThermocyclerModule,
|}

const ThermocyclerCard = ({ module }: Props) => (
  <StatusCard title={getModuleDisplayName(module.name)}>
    <CardContentRow>
      <StatusItem status={module.status} />
    </CardContentRow>
    <CardContentRow>
      <TempsItem
        title="Base Temp"
        current={module.data.currentTemp}
        target={module.data.targetTemp}
      />
      <TempsItem
        title="Lid Temp"
        current={module.data.lidTemp}
        target={module.data.lidTarget}
      />
    </CardContentRow>
    {module.data.totalCycleCount != null && (
      <CardContentRow>
        <LabeledValue
          label="Cycle #"
          value={`${module.data.currentCycleIndex} / ${
            module.data.totalCycleCount
          }`}
        />
        <LabeledValue
          label="Step #"
          value={`${module.data.currentStepIndex} / ${
            module.data.totalStepCount
          }`}
        />
      </CardContentRow>
    )}
  </StatusCard>
)

export default ThermocyclerCard
