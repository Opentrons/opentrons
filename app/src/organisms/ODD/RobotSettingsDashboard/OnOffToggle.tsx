import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_ROW,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

export function OnOffToggle(props: { isOn: boolean }): JSX.Element {
  const { t } = useTranslation('shared')
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing12}
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.transparent}
      padding={`${SPACING.spacing12} ${SPACING.spacing4}`}
      borderRadius={BORDERS.borderRadius16}
    >
      <LegacyStyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
        {props.isOn ? t('on') : t('off')}
      </LegacyStyledText>
    </Flex>
  )
}
