import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import {
  useTrackEvent,
  ANALYTICS_PROCEED_TO_MODULE_SETUP_STEP,
  ANALYTICS_PROCEED_TO_LABWARE_SETUP_STEP,
} from '/app/redux/analytics'
import { SetupDeckCalibration } from './SetupDeckCalibration'
import { SetupInstrumentCalibration } from './SetupInstrumentCalibration'
import { SetupTipLengthCalibration } from './SetupTipLengthCalibration'
import { useRunStatus, useRunHasStarted } from '/app/resources/runs'
import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { useIsFlex } from '/app/redux-resources/robots'

import type { ProtocolCalibrationStatus } from '/app/redux/calibration/types'
import type { StepKey } from '/app/redux/protocol-runs'

interface SetupRobotCalibrationProps {
  robotName: string
  runId: string
  nextStep: StepKey
  expandStep: (step: StepKey) => void
  calibrationStatus: ProtocolCalibrationStatus
}

export function SetupRobotCalibration({
  robotName,
  runId,
  nextStep,
  expandStep,
  calibrationStatus,
}: SetupRobotCalibrationProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const nextStepButtonKey =
    nextStep === 'module_setup_step'
      ? ANALYTICS_PROCEED_TO_MODULE_SETUP_STEP
      : ANALYTICS_PROCEED_TO_LABWARE_SETUP_STEP
  const [targetProps, tooltipProps] = useHoverTooltip()
  const trackEvent = useTrackEvent()

  const runHasStarted = useRunHasStarted(runId)
  const runStatus = useRunStatus(runId)
  const isFlex = useIsFlex(robotName)

  let tooltipText: string | null = null
  if (runStatus === RUN_STATUS_STOPPED) {
    tooltipText = t('protocol_run_stopped')
  } else if (runHasStarted) {
    tooltipText = t('protocol_run_started')
  } else if (calibrationStatus.reason != null) {
    tooltipText = t(calibrationStatus.reason)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        width="100%"
        gridGap={SPACING.spacing16}
        marginY={SPACING.spacing16}
      >
        {!isFlex ? (
          <SetupDeckCalibration robotName={robotName} runId={runId} />
        ) : null}
        <SetupInstrumentCalibration robotName={robotName} runId={runId} />
        {!isFlex ? (
          <SetupTipLengthCalibration robotName={robotName} runId={runId} />
        ) : null}
      </Flex>
      <PrimaryButton
        disabled={!calibrationStatus.complete || runHasStarted}
        onClick={() => {
          expandStep(nextStep)
          trackEvent({
            name: nextStepButtonKey,
            properties: {},
          })
        }}
        {...targetProps}
        id="RobotCalStep_proceedButton"
      >
        {t(nextStepButtonKey)}
      </PrimaryButton>
      {tooltipText != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
      ) : null}
    </Flex>
  )
}
