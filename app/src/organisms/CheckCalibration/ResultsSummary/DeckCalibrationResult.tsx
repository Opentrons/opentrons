import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { RenderResult } from './RenderResult'
import { RESULT_SUMMARY_STYLE } from './Style'

interface DeckCalibrationResultProps {
  isBadCal: boolean
}

export const DeckCalibrationResult = ({
  isBadCal,
}: DeckCalibrationResultProps): JSX.Element => {
  const { t } = useTranslation('robot_calibration')
  return (
    <Flex
      padding="0.75rem"
      flexDirection={DIRECTION_ROW}
      css={RESULT_SUMMARY_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      width="100%"
    >
      <StyledText css={TYPOGRAPHY.pSemiBold}>
        {t('deck_calibration')}
      </StyledText>
      <RenderResult isBadCal={isBadCal} />
    </Flex>
  )
}
