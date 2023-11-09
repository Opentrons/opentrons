import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  COLORS,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

interface ErrorUpdateSoftwareProps {
  errorMessage: string
  children: React.ReactNode
}
export function ErrorUpdateSoftware({
  errorMessage,
  children,
}: ErrorUpdateSoftwareProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing32}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.red3}
        height="26.625rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadiusSize3}
      >
        <Icon name="ot-alert" size="3.75rem" color={COLORS.errorEnabled} />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          alignItems={ALIGN_CENTER}
        >
          <StyledText
            as="h2"
            fontWeight={TYPOGRAPHY.fontWeightBold}
            color={COLORS.black}
          >
            {t('software_update_error')}
          </StyledText>
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightRegular}>
            {errorMessage}
          </StyledText>
        </Flex>
      </Flex>
      {children}
    </Flex>
  )
}
