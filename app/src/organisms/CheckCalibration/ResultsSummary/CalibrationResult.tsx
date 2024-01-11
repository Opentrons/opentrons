import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  COLORS,
  BORDERS,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { RenderResult } from './RenderResult'

export const RESULT_SUMMARY_STYLE = css`
  border: 1px solid ${COLORS.grey35};
  border-radius: ${BORDERS.radiusSoftCorners};
`

type CalibrationType = 'deck' | 'pipetteOffset' | 'tipLength'

interface CalibrationResultProps {
  calType: CalibrationType
  isBadCal: boolean
}

export function CalibrationResult({
  calType,
  isBadCal,
}: CalibrationResultProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')

  const switchText = (calType: CalibrationType): string => {
    return calType === 'deck'
      ? 'deck_calibration'
      : calType === 'pipetteOffset'
      ? 'pipette_offset_title'
      : 'tip_length'
  }
  return (
    <Flex
      padding={SPACING.spacing12}
      flexDirection={DIRECTION_ROW}
      css={RESULT_SUMMARY_STYLE}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      width="100%"
    >
      <StyledText
        css={TYPOGRAPHY.pSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {t(switchText(calType))}
      </StyledText>
      <RenderResult isBadCal={isBadCal} />
    </Flex>
  )
}
