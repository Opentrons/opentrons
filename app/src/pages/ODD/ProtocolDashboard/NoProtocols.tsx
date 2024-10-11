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

import imgSrc from '/app/assets/images/on-device-display/empty_protocol_dashboard.png'

export function NoProtocols(): JSX.Element {
  const { t } = useTranslation(['protocol_info', 'branded'])
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      height="27.25rem"
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadius12}
    >
      <img
        alt={t('nothing_here_yet')}
        src={imgSrc}
        width="284px"
        height="166px"
      />
      <LegacyStyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightBold}
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing8}
      >
        {t('nothing_here_yet')}
      </LegacyStyledText>
      <LegacyStyledText as="h4" color={COLORS.grey60}>
        {t('branded:send_a_protocol_to_store')}
      </LegacyStyledText>
    </Flex>
  )
}
