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
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export function EmptyFile(): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  return (
    <Flex
      padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
      borderRadius={BORDERS.borderRadius16}
      backgroundColor={COLORS.grey35}
      width="28rem"
      height="24rem"
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      data-testid="EmptyFile"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing32}
    >
      <Icon name="ot-alert" size="3rem" data-testid="EmptyFile_icon" />
      <LegacyStyledText
        fontSize={TYPOGRAPHY.fontSize28}
        lineHeight={TYPOGRAPHY.lineHeight36}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        {t('no_files_found')}
      </LegacyStyledText>
    </Flex>
  )
}
