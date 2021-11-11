import * as React from 'react'
import every from 'lodash/every'
import { NavLink } from 'react-router-dom'
import { useMissingModuleIds } from './hooks'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  PrimaryBtn,
  Tooltip,
  useHoverTooltip,
  JUSTIFY_CENTER,
  C_BLUE,
} from '@opentrons/components'
import { useCurrentRunPipetteInfoByMount } from './hooks'

interface ProceedToRunProps {
  robotName: string
}

export const ProceedToRunCta = (
  props: ProceedToRunProps
): JSX.Element | null => {
  const { robotName } = props
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const missingModuleIds = useMissingModuleIds()
  const pipetteInfoByMount = useCurrentRunPipetteInfoByMount()
  const isEverythingCalibrated = every(
    pipetteInfoByMount,
    pipetteInfo => {
      if (pipetteInfo != null) {
        return (
          pipetteInfo.pipetteCalDate != null &&
          pipetteInfo.tipRacksForPipette.every(
            tipRackInfo => tipRackInfo.lastModifiedDate != null
          )
        )
      } else {
        // if no pipette requested on mount
        return true
      }
    }
  )
  const calibrationIncomplete =
    missingModuleIds.length === 0 && !isEverythingCalibrated
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && isEverythingCalibrated
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && !isEverythingCalibrated

  let proceedToRunDisabledReason = null
  if (moduleAndCalibrationIncomplete) {
    proceedToRunDisabledReason = t(
      'run_disabled_modules_and_calibration_not_complete'
    )
  } else if (calibrationIncomplete) {
    proceedToRunDisabledReason = t('run_disabled_calibration_not_complete')
  } else if (moduleSetupIncomplete) {
    proceedToRunDisabledReason = t('run_disabled_modules_not_connected')
  }

  const LinkComponent = proceedToRunDisabledReason != null ? 'button' : NavLink
  const linkProps = proceedToRunDisabledReason != null ? {} : { to: '/run' }
  return (
    <Flex justifyContent={JUSTIFY_CENTER}>
      <PrimaryBtn
        role="button"
        title={t('proceed_to_run')}
        disabled={proceedToRunDisabledReason != null}
        as={LinkComponent}
        backgroundColor={C_BLUE}
        id={'LabwareSetup_proceedToRunButton'}
        {...linkProps}
        {...targetProps}
      >
        {t('proceed_to_run')}
      </PrimaryBtn>
      {proceedToRunDisabledReason != null && (
        <Tooltip {...tooltipProps}>{proceedToRunDisabledReason}</Tooltip>
      )}
    </Flex>
  )
}
