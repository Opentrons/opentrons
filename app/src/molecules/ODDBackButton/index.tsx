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

import { StyledText } from '../../atoms/text'

export function ODDBackButton(
  props: React.HTMLProps<HTMLButtonElement>
): JSX.Element {
  const { onClick, label } = props

  return (
    <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing16}>
      <Btn onClick={onClick}>
        <Icon
          color={COLORS.darkBlack100}
          data-testid="back_icon"
          name="back"
          width="3rem"
        />
      </Btn>
      <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {label}
      </StyledText>
    </Flex>
  )
}
