import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, Text, DIRECTION_COLUMN, SPACING_2 } from '@opentrons/components'
import { CalibrationValues } from '../CalibrateLabware/CalibrationValues'
import type { LabwareCalibrationData } from '../../../redux/calibration/labware/types'

export function CalibrationData(props: {
  calibrationData: LabwareCalibrationData | null
  calibratedThisSession: boolean
  calDataAvailable: boolean
}): JSX.Element {
  const { calibrationData, calibratedThisSession, calDataAvailable } = props

  const { t } = useTranslation('protocol_calibration')

  if (!calDataAvailable) {
    return (
      <Text as="i" marginTop={SPACING_2}>
        {t('cal_data_legacy_definition')}
      </Text>
    )
  } else if (calibrationData === null) {
    return (
      <Text as="i" marginTop={SPACING_2}>
        {t('cal_data_not_calibrated')}
      </Text>
    )
  } else {
    return (
      <Flex flexDirection={DIRECTION_COLUMN} marginTop={SPACING_2}>
        {calibratedThisSession
          ? t('cal_data_updated_data')
          : t('cal_data_existing_data')}
        :
        <CalibrationValues {...calibrationData} />
      </Flex>
    )
  }
}
