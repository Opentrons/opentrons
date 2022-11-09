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
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { RenderResult } from './RenderResult'

export const RESULT_SUMMARY_STYLE = css`
  border: 1px solid ${COLORS.medGreyEnabled};
  border-radius: ${BORDERS.radiusSoftCorners};
`

interface CalibrationResultProps {
  calType: 'pipetteOffset' | 'tipLength'
  isBadCal: boolean
}

export function CalibrationResult({
  calType,
  isBadCal,
}: CalibrationResultProps): JSX.Element {
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
        {calType === 'pipetteOffset'
          ? t('pipette_offset_title')
          : t('tip_length')}
      </StyledText>
      <RenderResult isBadCal={isBadCal} />
    </Flex>
  )
}
