import * as React from 'react'
import { useSelector } from 'react-redux'
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
import * as Pipettes from '../../../redux/pipettes'
import * as PipetteConstants from '../../../redux/pipettes/constants'
import type { State } from '../../../redux/types'

interface ProceedToRunProps {
  robotName: string
}

export const ProceedToRunCta = (props: ProceedToRunProps): JSX.Element | null => {
  const { robotName } = props
  const { t } = useTranslation('protocol_setup')
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { missingModuleIds } = useMissingModuleIds()
  const protocolPipetteTipRackData = useSelector((state: State) => {
    return Pipettes.getProtocolPipetteTipRackCalInfo(state, robotName)
  })
  const pipettesMountInfo = PipetteConstants.PIPETTE_MOUNTS.reduce(
    mount => mount
  )
  const pipetteCalibrationInfo = protocolPipetteTipRackData[pipettesMountInfo]
  if (pipetteCalibrationInfo == null) {
    return null
  }
  const pipettesCalibrated =
    pipetteCalibrationInfo.pipetteCalDate !== undefined &&
    pipetteCalibrationInfo.pipetteCalDate !== null
  const calibrationIncomplete =
    missingModuleIds.length === 0 && pipettesCalibrated === false
  const moduleSetupIncomplete =
    missingModuleIds.length > 0 && pipettesCalibrated === true
  const moduleAndCalibrationIncomplete =
    missingModuleIds.length > 0 && pipettesCalibrated === false

  const proceedToRunDisabledReason = calibrationIncomplete
    ? t('proceed_to_run_disabled_calibration_not_complete_tooltip')
    : moduleAndCalibrationIncomplete
    ? t(
        'proceed_to_run_disabled_modules_and_calibration_not_complete_tooltip',
        { count: missingModuleIds.length }
      )
    : moduleSetupIncomplete
    ? t('proceed_to_run_disabled_modules_not_connected_tooltip', {
        count: missingModuleIds.length,
      })
    : null

  const LinkComponent = proceedToRunDisabledReason != null ? 'button' : NavLink
  const linkProps = proceedToRunDisabledReason != null ? {} : { to: '/run' }
  return (
    <React.Fragment>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <PrimaryBtn
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
    </React.Fragment>
  )
}
