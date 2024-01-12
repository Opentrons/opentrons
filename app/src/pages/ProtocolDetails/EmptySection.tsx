import * as React from 'react'
import {
  JUSTIFY_CENTER,
  LEGACY_COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  TYPOGRAPHY,
  BORDERS,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'

interface EmptySectionProps {
  section: 'hardware' | 'labware' | 'liquids'
}

export const EmptySection = (props: EmptySectionProps): JSX.Element => {
  const { section } = props
  const { t, i18n } = useTranslation('protocol_details')

  return (
    <Flex
      backgroundColor={COLORS.grey35}
      borderRadius={BORDERS.borderRadiusSize3}
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
      <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
        {i18n.format(
          section === 'liquids'
            ? t('liquids_not_in_protocol')
            : t('not_in_protocol', { section: section }),
          'capitalize'
        )}
      </StyledText>
    </Flex>
  )
}
