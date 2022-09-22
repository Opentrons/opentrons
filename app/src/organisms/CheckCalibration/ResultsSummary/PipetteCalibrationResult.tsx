import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { RESULT_SUMMARY_STYLE } from './Style'
import { RenderResult } from './RenderResult'

interface PipetteCalibrationResultProps {
  isBadCal: boolean
}

export const PipetteCalibrationResult = ({
  isBadCal,
}: PipetteCalibrationResultProps): JSX.Element => {
  const { t } = useTranslation(['robot_calibration', 'shared'])

  return (
    <Flex
      padding="0.75rem"
      flexDirection={DIRECTION_ROW}
      css={RESULT_SUMMARY_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      width="100%"
    >
      <StyledText
        css={TYPOGRAPHY.pSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {t('pipette_offset_title')}
      </StyledText>
      <RenderResult isBadCal={isBadCal} />
    </Flex>
  )
}
