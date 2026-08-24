import { useTranslation } from 'react-i18next'

import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'

import { useIsFlex } from '/app/redux-resources/robots'
import {
  ANALYTICS_PROCEED_TO_CAMERA_SETUP_STEP,
  ANALYTICS_PROCEED_TO_LABWARE_OFFSETS_SETUP_STEP,
  ANALYTICS_PROCEED_TO_LABWARE_SETUP_STEP,
  ANALYTICS_PROCEED_TO_MODULE_SETUP_STEP,
  ANALYTICS_PROTOCOL_PROCEED,
  useTrackEvent,
} from '/app/redux/analytics'
import {
  CAMERA_SETUP_STEP_KEY,
  LABWARE_SETUP_STEP_KEY,
  LPC_STEP_KEY,
  MODULE_SETUP_STEP_KEY,
} from '/app/redux/protocol-runs'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useNotifyRunQuery,
  useRunHasStarted,
} from '/app/resources/runs'

import { SetupDeckCalibration } from './SetupDeckCalibration'
import { SetupInstrumentCalibration } from './SetupInstrumentCalibration'
import { SetupTipLengthCalibration } from './SetupTipLengthCalibration'

import type { ReactNode } from 'react'
import type { AnalyticsProtocolProceedButtonText } from '/app/redux/analytics/constants'
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
}: SetupRobotCalibrationProps): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const nextStepButtonKey: AnalyticsProtocolProceedButtonText = (() => {
    switch (nextStep) {
      case MODULE_SETUP_STEP_KEY:
        return ANALYTICS_PROCEED_TO_MODULE_SETUP_STEP
      case LPC_STEP_KEY:
        return ANALYTICS_PROCEED_TO_LABWARE_OFFSETS_SETUP_STEP
      case LABWARE_SETUP_STEP_KEY:
        return ANALYTICS_PROCEED_TO_LABWARE_SETUP_STEP
      case CAMERA_SETUP_STEP_KEY:
        return ANALYTICS_PROCEED_TO_CAMERA_SETUP_STEP
      default:
        return ANALYTICS_PROTOCOL_PROCEED
    }
  })()

  const [targetProps, tooltipProps] = useHoverTooltip()
  const trackEvent = useTrackEvent()

  const runHasStarted = useRunHasStarted(runId)
  const { data: runRecord } = useNotifyRunQuery(runId, {
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const runStatus = runRecord?.data.status ?? null

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
      >
        {t(nextStepButtonKey)}
      </PrimaryButton>
      {tooltipText != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tooltipText}</Tooltip>
      ) : null}
    </Flex>
  )
}
