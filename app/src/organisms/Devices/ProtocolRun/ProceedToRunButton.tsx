import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useHoverTooltip } from '@opentrons/components'

import { PrimaryButton } from '../../../atoms/buttons'
import { Tooltip } from '../../../atoms/Tooltip'
import { useTrackEvent } from '../../../redux/analytics'
import {
  useUnmatchedModulesForProtocol,
  useRunCalibrationStatus,
  useRunHasStarted,
} from '../hooks'

interface ProceedToRunButtonProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function ProceedToRunButton({
  protocolRunHeaderRef,
  robotName,
  runId,
}: ProceedToRunButtonProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { missingModuleIds } = useUnmatchedModulesForProtocol(robotName, runId)
  const trackEvent = useTrackEvent()
  const { complete: isCalibrationComplete } = useRunCalibrationStatus(
    robotName,
    runId
  )
  const runHasStarted = useRunHasStarted(runId)

  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isCalibrationComplete
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isCalibrationComplete
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isCalibrationComplete

  let proceedToRunDisabledReason = null
  if (runHasStarted) {
    proceedToRunDisabledReason = t('protocol_run_started')
  } else if (moduleAndCalibrationIncomplete) {
    proceedToRunDisabledReason = t(
      'run_disabled_modules_and_calibration_not_complete'
    )
  } else if (calibrationIncomplete) {
    proceedToRunDisabledReason = t('run_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    proceedToRunDisabledReason = t('run_disabled_modules_not_connected')
  }

  return (
    <Link
      to={`/devices/${robotName}/protocol-runs/${runId}/run-log`}
      onClick={() => {
        trackEvent({ name: 'proceedToRun', properties: {} })
        protocolRunHeaderRef?.current?.scrollIntoView({
          behavior: 'smooth',
        })
      }}
    >
      <PrimaryButton
        disabled={proceedToRunDisabledReason != null}
        id="LabwareSetup_proceedToRunButton"
        {...targetProps}
      >
        {t('proceed_to_run')}
      </PrimaryButton>
      {proceedToRunDisabledReason != null && (
        <Tooltip tooltipProps={tooltipProps}>
          {proceedToRunDisabledReason}
        </Tooltip>
      )}
    </Link>
  )
}
