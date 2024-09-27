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
import { useTranslation } from 'react-i18next'

interface EmptySectionProps {
  section: 'hardware' | 'labware' | 'liquids' | 'parameters'
}

export const EmptySection = (props: EmptySectionProps): JSX.Element => {
  const { section } = props
  const { t, i18n } = useTranslation('protocol_details')

  let sectionText: string = t('not_in_protocol', { section: section })
  if (section === 'liquids') {
    sectionText = t('liquids_not_in_protocol')
  } else if (section === 'parameters') {
    sectionText = t('no_parameters')
  }
  return (
    <Flex
      backgroundColor={COLORS.grey35}
      borderRadius={BORDERS.borderRadius12}
      width="100%"
      height="12.625rem"
      padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
    >
      <Icon
        name="ot-alert"
        size="3rem"
        color={COLORS.grey60}
        marginBottom={SPACING.spacing32}
        aria-label="EmptySection_ot-alert"
      />
      <LegacyStyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(sectionText, 'capitalize')}
      </LegacyStyledText>
    </Flex>
  )
}
