// @flow
import * as React from 'react'
import moment from 'moment'
import cx from 'classnames'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { ThermocyclerModule, ModuleCommandRequest } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'
import styles from './styles.css'
import TemperatureControl from './TemperatureControl'

type TempsItemProps = {|
  title: string,
  current: number,
  target: ?number,
|}
const TempsItem = ({ title, current, target }: TempsItemProps) => (
  <div className={styles.temps_item}>
    <p className={styles.label}>{title}</p>
    <div className={styles.data_row}>
      <p className={styles.inline_labeled_value}>Current:</p>
      <p>{`${current} °C`}</p>
    </div>
    <div className={styles.data_row}>
      <p className={styles.inline_labeled_value}>Target:</p>
      <p>{target ? `${target} °C` : 'None'}</p>
    </div>
  </div>
)

type Props = {|
  module: ThermocyclerModule,
  sendModuleCommand: (serial: string, request: ModuleCommandRequest) => mixed,
  isProtocolActive: boolean,
|}

const ThermocyclerCard = ({
  module,
  sendModuleCommand,
  isProtocolActive,
}: Props) => (
  <StatusCard title={getModuleDisplayName(module.name)}>
    <CardContentRow>
      <StatusItem status={module.status} />
      {!isProtocolActive && (
        <TemperatureControl
          module={module}
          sendModuleCommand={sendModuleCommand}
        />
      )}
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
    {module.data.totalCycleCount != null &&
      module.data.currentCycleIndex != null &&
      module.data.totalStepCount != null &&
      module.data.currentStepIndex != null && (
        <CardContentRow>
          <LabeledValue
            label="Cycle #"
            className={styles.compact_labeled_value}
            value={`${module.data.currentCycleIndex} / ${module.data.totalCycleCount}`}
          />
          <LabeledValue
            label="Step #"
            className={styles.compact_labeled_value}
            value={`${module.data.currentStepIndex} / ${module.data.totalStepCount}`}
          />
          <span
            className={cx(
              styles.inline_labeled_value,
              styles.time_remaining_wrapper
            )}
          >
            <p className={styles.time_remaining_label}>
              Time remaining for step:
            </p>
            <p>
              {`${moment
                .utc(
                  // NOTE: moment still doesn't allow duration formatting, hence fake moment creation
                  moment
                    .duration(module.data.holdTime || 0, 'seconds')
                    .asMilliseconds()
                )
                .format('HH:mm:ss')}`}
            </p>
          </span>
        </CardContentRow>
      )}
  </StatusCard>
)

export default ThermocyclerCard
