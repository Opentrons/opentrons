import type * as React from 'react'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export function ODDBackButton(
  props: React.HTMLProps<HTMLButtonElement>
): JSX.Element {
  const { onClick, label } = props

  return (
    <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing16}>
      <Btn onClick={onClick}>
        <Icon
          color={COLORS.black90}
          data-testid="back_icon"
          name="back"
          width="3rem"
        />
      </Btn>
      <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {label}
      </LegacyStyledText>
    </Flex>
  )
}
