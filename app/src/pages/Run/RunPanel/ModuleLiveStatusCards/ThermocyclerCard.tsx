// @flow
import * as React from 'react'
import cx from 'classnames'
import { Box, LabeledValue, SPACING_3 } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type {
  ThermocyclerModule,
  ModuleCommand,
} from '../../../../redux/modules/types'
import { formatSeconds } from '../../../../redux/robot/selectors' // TODO: move helper from robot selector to helper file
import {
  TemperatureControl,
  TemperatureData,
} from '../../../../molecules/ModuleControls'

import { StatusCard } from './StatusCard'
import styles from './styles.css'

const CYCLE_NUMBER = 'Cycle #'
const HOLD_TIME_REMAINING = 'Hold time remaining:'
const STEP_NUMBER = 'Step #'
const TIME_REMAINING_FOR_STEP = 'Time remaining for step:'

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
    <p className={styles.time_remaining_label}>{TIME_REMAINING_FOR_STEP}</p>
    <p>{formatSeconds(holdTime ?? 0)}</p>
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
    <>
      <div className={styles.card_row}>
        <div className={styles.cycle_info_wrapper}>
          <div className={styles.cycle_info_counts}>
            <LabeledValue
              label={CYCLE_NUMBER}
              className={cx(
                styles.compact_labeled_value,
                styles.cycle_data_item
              )}
              value={`${currentCycleIndex} / ${totalCycleCount}`}
            />
            <LabeledValue
              label={STEP_NUMBER}
              className={cx(
                styles.compact_labeled_value,
                styles.cycle_data_item
              )}
              value={`${currentStepIndex} / ${totalStepCount}`}
            />
          </div>
          <TimeRemaining holdTime={holdTime} title={TIME_REMAINING_FOR_STEP} />
        </div>
      </div>
    </>
  )
}

type Props = {|
  module: ThermocyclerModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
  slot: string,
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
  slot,
}: Props): React.Node => {
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
      header={slot}
      title={getModuleDisplayName(module.model)}
      isCardExpanded={isCardExpanded}
      toggleCard={toggleCard}
    >
      <Box padding={SPACING_3}>
        <TemperatureData title="lid" current={lidTemp} target={lidTarget} />
        <TemperatureControl
          module={module}
          isSecondaryTemp={true}
          sendModuleCommand={sendModuleCommand}
          disabledReason={controlDisabledReason}
        />
      </Box>
      <Box padding={SPACING_3} paddingTop={0}>
        <TemperatureData
          status={module.status}
          title="block"
          current={currentTemp}
          target={targetTemp}
        />
        <TemperatureControl
          module={module}
          isSecondaryTemp={false}
          sendModuleCommand={sendModuleCommand}
          disabledReason={controlDisabledReason}
        />
      </Box>
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
          <TimeRemaining holdTime={holdTime} title={HOLD_TIME_REMAINING} />
        </div>
      )}
    </StatusCard>
  )
}
