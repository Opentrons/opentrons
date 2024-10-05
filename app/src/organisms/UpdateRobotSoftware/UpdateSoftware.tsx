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

interface UpdateSoftwareProps {
  updateType: 'downloading' | 'validating' | 'sendingFile' | 'installing' | null
}
export function UpdateSoftware({
  updateType,
}: UpdateSoftwareProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const renderText = (): string | null => {
    switch (updateType) {
      case 'downloading':
        return t('downloading_software')
      case 'validating':
        return t('validating_software')
      case 'sendingFile':
        return t('sending_software')
      case 'installing':
        return t('installing_software')
      default:
        console.warn('Update software has an issue')
        return null
    }
  }

  return (
    <Flex
      backgroundColor={COLORS.grey35}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="33rem"
      borderRadius={BORDERS.borderRadius12}
    >
      <Icon
        name="ot-spinner"
        size="5rem"
        spin={true}
        color={COLORS.grey60}
        data-testid="Icon_update"
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        alignItems={ALIGN_CENTER}
      >
        <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('update_found')}
        </LegacyStyledText>
        <LegacyStyledText
          as="h3"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.grey60}
        >
          {renderText()}
        </LegacyStyledText>
      </Flex>
    </Flex>
  )
}
