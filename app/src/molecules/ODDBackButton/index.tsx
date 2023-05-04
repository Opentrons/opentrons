import * as React from 'react'

import {
  Btn,
  Flex,
  Icon,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

export function ODDBackButton(
  props: React.HTMLProps<HTMLButtonElement>
): JSX.Element {
  const { onClick, label } = props

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      fontSize={TYPOGRAPHY.fontSize38}
      fontWeight={TYPOGRAPHY.fontWeightBold}
      gridGap={SPACING.spacing4}
      lineHeight={TYPOGRAPHY.lineHeight48}
    >
      <Btn onClick={onClick} paddingLeft="0rem">
        <Icon
          color={COLORS.darkBlack_hundred}
          data-testid="back_icon"
          name="back"
          width="2.5rem"
        />
      </Btn>
      {label}
    </Flex>
  )
}
