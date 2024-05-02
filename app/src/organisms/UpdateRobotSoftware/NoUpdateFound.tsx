import * as React from 'react'
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

import { MediumButton } from '../../atoms/buttons'

export interface NoUpdateFoundProps {
  onContinue: () => void
}

export function NoUpdateFound(props: NoUpdateFoundProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const { onContinue } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      gridGap={SPACING.spacing32}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.green35}
        height="25.75rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadius12}
        padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
      >
        <Icon
          name="ot-check"
          size="3.75rem"
          color={COLORS.green50}
          data-testid="NoUpdateFound_check_circle_icon"
        />
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('software_is_up_to_date')}
        </StyledText>
      </Flex>
      <MediumButton
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClick={onContinue}
      />
    </Flex>
  )
}
