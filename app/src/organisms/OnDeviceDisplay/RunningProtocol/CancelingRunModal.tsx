import * as React from 'react'
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
  TYPOGRAPHY,
} from '@opentrons/components'
import { Modal } from '../../../molecules/Modal'
import { StyledText } from '../../../atoms/text'

export function CancelingRunModal(): JSX.Element {
  const { t, i18n } = useTranslation('run_details')

  return (
    <Modal>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        backgroundColor={COLORS.darkBlack20}
        borderRadius={BORDERS.borderRadiusSize3}
        width="41.625rem"
        height="17.25rem"
        gridGap={SPACING.spacing24}
      >
        <Icon
          name="ot-spinner"
          spin
          size="3.75rem"
          color={COLORS.darkBlack70}
          aria-label="CancelingRunModal_icon"
        />
        <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {i18n.format(t('canceling_run_dot'), 'capitalize')}
        </StyledText>
      </Flex>
    </Modal>
  )
}
