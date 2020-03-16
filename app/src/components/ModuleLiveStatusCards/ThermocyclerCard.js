// @flow
import * as React from 'react'
import { addSeconds, format } from 'date-fns'
import cx from 'classnames'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { TemperatureControl, TemperatureData } from '../ModuleControls'
import { StatusCard } from './StatusCard'
import { StatusItem } from './StatusItem'
import styles from './styles.css'

import type { ThermocyclerModule, ModuleCommand } from '../../modules/types'

const TimeRemaining = ({
  holdTime,
  title,
}: {|
  holdTime: ?number,
  title: string,
|}) => (
  <span
    className={cx(styles.inline_labeled_value, styles.time_remaining_wrapper)}
  >
    <p className={styles.time_remaining_label}>Time remaining for step:</p>
    <p>
      {// convert duration to seconds from epoch (midnight), then format
      format(addSeconds(0, holdTime ?? 0), 'HH:mm:ss')}
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
    totalCycleCount == null ||
    currentCycleIndex == null ||
    totalStepCount == null ||
    currentStepIndex == null
  ) {
    return null
  }
  return (
    <div className={styles.card_row}>
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
      <TimeRemaining holdTime={holdTime} title="Time remaining for step:" />
    </div>
  )
}

type Props = {|
  module: ThermocyclerModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
  controlDisabledReason: string | null,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

export const ThermocyclerCard = ({
  module,
  sendModuleCommand,
  controlDisabledReason,
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
      title={getModuleDisplayName(module.model)}
      isCardExpanded={isCardExpanded}
      toggleCard={toggleCard}
    >
      <div className={styles.card_row}>
        <StatusItem status={module.status} />
        <TemperatureControl
          module={module}
          sendModuleCommand={sendModuleCommand}
          disabledReason={controlDisabledReason}
        />
      </div>
      <div className={styles.card_row}>
        <TemperatureData
          className={styles.temp_data_item}
          title="Base Temp"
          current={currentTemp}
          target={targetTemp}
        />
        <TemperatureData
          className={styles.temp_data_item}
          title="Lid Temp"
          current={lidTemp}
          target={lidTarget}
        />
      </div>
      {executingProfile && (
        <CycleInfo
          holdTime={holdTime}
          totalCycleCount={totalCycleCount}
          currentCycleIndex={currentCycleIndex}
          totalStepCount={totalStepCount}
          currentStepIndex={currentStepIndex}
        />
      )}
      {holdTime != null && holdTime > 0 && !executingProfile && (
        <div className={styles.card_row}>
          <TimeRemaining holdTime={holdTime} title="Hold time remaining:" />
        </div>
      )}
    </StatusCard>
  )
}
