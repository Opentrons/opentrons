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
      <p>{`${current != null ? current : '-'} °C`}</p>
    </div>
    <div className={styles.data_row}>
      <p className={styles.inline_labeled_value}>Target:</p>
      <p>{`${target != null ? target : '-'} °C`}</p>
    </div>
  </div>
)

const TimeRemaining = ({ holdTime }: {| holdTime: ?number |}) => (
  <span
    className={cx(styles.inline_labeled_value, styles.time_remaining_wrapper)}
  >
    <p className={styles.time_remaining_label}>Time remaining for step:</p>
    <p>
      {`${moment
        .utc(
          // NOTE: moment still doesn't allow duration formatting, hence fake moment creation
          moment.duration(holdTime || 0, 'seconds').asMilliseconds()
        )
        .format('HH:mm:ss')}`}
    </p>
  </span>
)

type CycleInfoProps = {|
  totalCycleCount: ?number,
  currentCycleIndex: ?number,
  totalStepCount: ?number,
  currentStepIndex: ?number,
  holdTime: ?number,
|}
const CycleInfo = ({
  totalCycleCount,
  currentCycleIndex,
  totalStepCount,
  currentStepIndex,
  holdTime,
}: CycleInfoProps) => {
  if (
    totalCycleCount == null &&
    currentCycleIndex == null &&
    totalStepCount == null &&
    currentStepIndex == null
  ) {
    return null
  }
  return (
    <CardContentRow>
      <LabeledValue
        label="Cycle #"
        className={styles.compact_labeled_value}
        value={`${currentCycleIndex} / ${totalCycleCount}`}
      />
      <LabeledValue
        label="Step #"
        className={styles.compact_labeled_value}
        value={`${currentStepIndex} / ${totalStepCount}`}
      />
      <TimeRemaining holdTime={holdTime} />
    </CardContentRow>
  )
}

type Props = {|
  module: ThermocyclerModule,
  sendModuleCommand: (serial: string, request: ModuleCommandRequest) => mixed,
  isProtocolActive: boolean,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

const ThermocyclerCard = ({
  module,
  sendModuleCommand,
  isProtocolActive,
  isCardExpanded,
  toggleCard,
}: Props) => {
  const {
    currentTemp,
    targetTemp,
    lidTemp,
    lidTarget,
    holdTime,
    totalCycleCount,
    currentCycleIndex,
    totalStepCount,
    currentStepIndex,
  } = module.data

  const executingProfile =
    totalCycleCount != null &&
    currentCycleIndex != null &&
    totalStepCount != null &&
    currentStepIndex != null
  return (
    <StatusCard
      title={getModuleDisplayName(module.name)}
      isCardExpanded={isCardExpanded}
      toggleCard={toggleCard}
    >
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
          current={currentTemp}
          target={targetTemp}
        />
        <TempsItem title="Lid Temp" current={lidTemp} target={lidTarget} />
      </CardContentRow>
      {executingProfile && (
        <CycleInfo
          holdTime={holdTime}
          totalCycleCount={totalCycleCount}
          currentCycleIndex={currentCycleIndex}
          totalStepCount={totalStepCount}
          currentStepIndex={currentStepIndex}
        />
      )}
      {holdTime != null && !executingProfile && (
        <CardContentRow>
          <TimeRemaining holdTime={holdTime} />
        </CardContentRow>
      )}
    </StatusCard>
  )
}

export default ThermocyclerCard
