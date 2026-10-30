import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface ErrorUpdateSoftwareProps {
  errorMessage: string
  children: ReactNode
}
export function ErrorUpdateSoftware({
  errorMessage,
  children,
}: ErrorUpdateSoftwareProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'shared'])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing32}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.red35}
        height="26.625rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadius12}
      >
        <Icon name="ot-alert" size="3.75rem" color={COLORS.red50} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          alignItems={ALIGN_CENTER}
        >
          <StyledText
            forwardedAs="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            color={COLORS.black90}
          >
            {t('software_update_error')}
          </StyledText>
          <StyledText
            forwardedAs="h3"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {errorMessage}
          </StyledText>
        </Flex>
      </Flex>
      {children}
    </Flex>
  )
}
