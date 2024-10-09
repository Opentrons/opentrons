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

import abstractImage from '/app/assets/images/on-device-display/empty_protocol_dashboard.png'

export function EmptyRecentRun(): JSX.Element {
  const { t } = useTranslation('device_details')
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
        src={abstractImage}
        alt={t('no_recent_runs')}
        width="284px"
        height="166px"
      />
      <LegacyStyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightBold}
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing8}
      >
        {t('no_recent_runs')}
      </LegacyStyledText>
      <LegacyStyledText
        as="h4"
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        color={COLORS.grey60}
      >
        {t('no_recent_runs_description')}
      </LegacyStyledText>
    </Flex>
  )
}
