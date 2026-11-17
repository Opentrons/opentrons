import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface WellCountProps {
  count: number
  wellLabel: string
}

export function WellCount(props: WellCountProps): ReactNode {
  const { t } = useTranslation('labware_details')
  const { count, wellLabel } = props

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING.spacing16}
    >
      <StyledText forwardedAs="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {t(wellLabel)} {t('count')}
      </StyledText>
      <StyledText forwardedAs="p">{count}</StyledText>
    </Flex>
  )
}
