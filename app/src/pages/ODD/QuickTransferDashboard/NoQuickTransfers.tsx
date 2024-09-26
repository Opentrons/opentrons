import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  StyledText,
} from '@opentrons/components'

import imgSrc from '/app/assets/images/on-device-display/empty_quick_transfer_dashboard.png'

export function NoQuickTransfers(): JSX.Element {
  const { t } = useTranslation('quick_transfer')
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      height="27.25rem"
      justifyContent={JUSTIFY_CENTER}
      borderRadius={BORDERS.borderRadius12}
    >
      <img alt={t('none_to_show')} src={imgSrc} width="284px" height="166px" />
      <StyledText
        oddStyle="level3HeaderBold"
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing8}
      >
        {t('none_to_show')}
      </StyledText>
      <StyledText
        oddStyle="level4HeaderRegular"
        color={`${COLORS.black70}${COLORS.opacity60HexCode}`}
      >
        {t('create_to_get_started')}
      </StyledText>
    </Flex>
  )
}
