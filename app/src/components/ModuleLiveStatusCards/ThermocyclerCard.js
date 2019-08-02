// @flow
import * as React from 'react'
import moment from 'moment'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { ThermocyclerModule, ModuleCommandRequest } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'
import styles from './styles.css'
import TemperatureControl from './TemperatureControl'

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
  sendModuleCommand: (serial: string, request: ModuleCommandRequest) => mixed,
|}

const ThermocyclerCard = ({ module, sendModuleCommand }: Props) => (
  <StatusCard title={getModuleDisplayName(module.name)}>
    <CardContentRow>
      <StatusItem status={module.status} />
      <TemperatureControl
        module={module}
        sendModuleCommand={sendModuleCommand}
      />
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
        <LabeledValue
          label="Time remaining for step"
          value={`${moment
            .utc(
              // NOTE: moment still doesn't allow duration formatting, hence fake moment creation
              moment.duration(module.data.holdTime, 'seconds').asMilliseconds()
            )
            .format('HH:mm:ss')}`}
        />
      </CardContentRow>
    )}
  </StatusCard>
)

export default ThermocyclerCard
