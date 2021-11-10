import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import { Box, LabeledValue, SPACING_3 } from '@opentrons/components'
import { getModuleDisplayName, getModuleType } from '@opentrons/shared-data'
import { useFeatureFlag } from '../../../../redux/config'

import type {
  ThermocyclerModule,
  ModuleCommand,
} from '../../../../redux/modules/types'
import {
  TemperatureControl,
  TemperatureData,
} from '../../../../molecules/ModuleControls'

import { StatusCard } from './StatusCard'
import styles from './styles.css'
import { formatSeconds } from '../utils'

const CYCLE_NUMBER = 'Cycle #'
const HOLD_TIME_REMAINING = 'Hold time remaining:'
const STEP_NUMBER = 'Step #'
const TIME_REMAINING_FOR_STEP = 'Time remaining for step:'

const TimeRemaining = ({
  holdTime,
  title,
}: {
  holdTime: number | null | undefined
  title: string
}): JSX.Element => (
  <span
    className={cx(styles.inline_labeled_value, styles.time_remaining_wrapper)}
  >
    <p className={styles.time_remaining_label}>{TIME_REMAINING_FOR_STEP}</p>
    <p>{formatSeconds(holdTime ?? 0)}</p>
  </span>
)

interface CycleInfoProps {
  totalCycleCount: number | null | undefined
  currentCycleIndex: number | null | undefined
  totalStepCount: number | null | undefined
  currentStepIndex: number | null | undefined
  holdTime: number | null | undefined
}
const CycleInfo = ({
  totalCycleCount,
  currentCycleIndex,
  totalStepCount,
  currentStepIndex,
  holdTime,
}: CycleInfoProps): JSX.Element | null => {
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

interface Props {
  module: ThermocyclerModule
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: unknown[]
  ) => unknown
  slot: string
  controlDisabledReason: string | null
  isCardExpanded: boolean
  toggleCard: () => unknown
}

export const ThermocyclerCard = ({
  module,
  sendModuleCommand,
  controlDisabledReason,
  isCardExpanded,
  toggleCard,
  slot,
}: Props): JSX.Element => {
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
  const { t } = useTranslation('run_details')
  const isNewProtocolRunPanel = useFeatureFlag('preProtocolFlowWithoutRPC')

  const executingProfile =
    totalCycleCount != null &&
    currentCycleIndex != null &&
    totalStepCount != null &&
    currentStepIndex != null

  if (module.status === 'error' && isNewProtocolRunPanel) {
    controlDisabledReason = t('thermocycler_error_tooltip')
  }

  return (
    <StatusCard
      moduleType={getModuleType(module.model)}
      moduleStatus={module.status}
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
