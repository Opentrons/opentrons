import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { HTMLProps, ReactNode } from 'react'

export function ODDBackButton(props: HTMLProps<HTMLButtonElement>): ReactNode {
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
      <LegacyStyledText forwardedAs="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {label}
      </LegacyStyledText>
    </Flex>
  )
}
