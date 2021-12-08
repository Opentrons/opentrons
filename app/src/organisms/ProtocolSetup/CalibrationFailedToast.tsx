import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { ProtocolCalibrationStatus } from './RunSetupCard/hooks'

interface Props {
  calibrationStatus: ProtocolCalibrationStatus
}
export function CalibrationFailedToast(props: Props): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  if (props.calibrationStatus.complete === true) return null
  const calibrationStatusReason = props.calibrationStatus.reason
  let calibrationType
  if (calibrationStatusReason === 'calibrate_tiprack_failure_reason') {
    calibrationType = t('tip_length_calibration')
  } else if (calibrationStatusReason === 'calibrate_pipette_failure_reason') {
    calibrationType = t('pipette_offset_calibration')
  }
  return (
    <AlertItem
      type="error"
      title={t('calibration_failed_toast', {
        type_of_calibration: calibrationType,
        error_reason: calibrationStatusReason,
      })}
    />
  )
}
