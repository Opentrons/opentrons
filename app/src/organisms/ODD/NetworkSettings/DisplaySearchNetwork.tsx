import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export function DisplaySearchNetwork(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  return (
    <Flex
      height="17.5rem"
      backgroundColor={COLORS.white}
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadius12}
      width="100%"
      data-testid="Display-Search-Network-text"
    >
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        flexDirection={DIRECTION_COLUMN}
      >
        <LegacyStyledText
          as="h3"
          color={COLORS.grey60}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginTop={SPACING.spacing40}
        >
          {t('searching_for_networks')}
        </LegacyStyledText>
      </Flex>
    </Flex>
  )
}
