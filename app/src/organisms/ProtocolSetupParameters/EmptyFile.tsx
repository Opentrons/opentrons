import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export function EmptyFile(): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <Flex
      padding={SPACING.spacing24}
      borderRadius={BORDERS.borderRadius16}
      backgroundColor={COLORS.grey35}
      width="27.75rem"
      height="23rem"
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      data-testid="EmptyFile"
    >
      <StyledText
        fontSize={TYPOGRAPHY.fontSize28}
        lineHeight={TYPOGRAPHY.lineHeight36}
        color={COLORS.grey50}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {t('no_files_found')}
      </StyledText>
    </Flex>
  )
}
