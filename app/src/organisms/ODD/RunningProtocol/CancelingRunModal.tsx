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
import { OddModal } from '/app/molecules/OddModal'

export function CancelingRunModal(): JSX.Element {
  const { t, i18n } = useTranslation('run_details')

  return (
    <OddModal>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        backgroundColor={COLORS.grey35}
        borderRadius={BORDERS.borderRadius12}
        width="41.625rem"
        height="17.25rem"
        gridGap={SPACING.spacing24}
      >
        <Icon
          name="ot-spinner"
          spin
          size="3.75rem"
          color={COLORS.grey60}
          aria-label="CancelingRunModal_icon"
        />
        <LegacyStyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {i18n.format(t('canceling_run_dot'), 'capitalize')}
        </LegacyStyledText>
      </Flex>
    </OddModal>
  )
}
