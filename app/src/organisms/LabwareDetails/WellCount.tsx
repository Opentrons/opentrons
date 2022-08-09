import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  TYPOGRAPHY,
  SPACING,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'

export interface WellCountProps {
  count: number
  wellLabel: string
}

export function WellCount(props: WellCountProps): JSX.Element {
  const { t } = useTranslation('labware_details')
  const { count, wellLabel } = props

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING.spacing4}
    >
      <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {wellLabel} {t('count')}
      </StyledText>
      <StyledText as="p">{count}</StyledText>
    </Flex>
  )
}
