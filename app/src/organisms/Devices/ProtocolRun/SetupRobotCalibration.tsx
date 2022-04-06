import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Tooltip,
  useHoverTooltip,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'

import { PrimaryButton } from '../../../atoms/Buttons'
import { useTrackEvent } from '../../../redux/analytics'
import { useDeckCalibrationData } from '../hooks'
import { SetupDeckCalibration } from './SetupDeckCalibration'
import { SetupPipetteCalibration } from './SetupPipetteCalibration'
import { SetupTipLengthCalibration } from './SetupTipLengthCalibration'

import type { ProtocolCalibrationStatus } from '../../../redux/calibration/types'
import type { StepKey } from './ProtocolRunSetup'

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
  const { t } = useTranslation(['protocol_setup'])
  const nextStepButtonKey =
    nextStep === 'module_setup_step'
      ? 'proceed_to_module_setup_step'
      : 'proceed_to_labware_setup_step'
  const [targetProps, tooltipProps] = useHoverTooltip()
  const trackEvent = useTrackEvent()

  const { isDeckCalibrated } = useDeckCalibrationData(robotName)

  const toolTipCalibrationStatusReasonText =
    calibrationStatus.reason != null ? t(calibrationStatus.reason) : null

  return (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        width="100%"
        gridGap={SPACING.spacing4}
        marginY={SPACING.spacing4}
      >
        <SetupDeckCalibration robotName={robotName} />
        <SetupPipetteCalibration robotName={robotName} runId={runId} />
        <SetupTipLengthCalibration robotName={robotName} runId={runId} />
      </Flex>
      <PrimaryButton
        disabled={!calibrationStatus.complete || !isDeckCalibrated}
        onClick={() => {
          expandStep(nextStep)
          trackEvent({
            name: nextStepButtonKey,
            properties: {},
          })
        }}
        {...targetProps}
        id={'RobotCalStep_proceedButton'}
      >
        {t(nextStepButtonKey)}
      </PrimaryButton>
      {calibrationStatus.reason != null || !isDeckCalibrated ? (
        <Tooltip {...tooltipProps}>
          {!isDeckCalibrated
            ? t('calibrate_deck_to_proceed_to_next_step')
            : toolTipCalibrationStatusReasonText}
        </Tooltip>
      ) : null}
    </Flex>
  )
}
