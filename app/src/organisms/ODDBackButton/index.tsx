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
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing4}
      fontSize={TYPOGRAPHY.fontSize38}
      fontWeight={TYPOGRAPHY.fontWeightLevel2_bold}
      lineHeight={TYPOGRAPHY.lineHeight48}
    >
      <Btn
        paddingLeft="0rem"
        paddingRight={SPACING.spacing5}
        onClick={props.onClick}
        width="3rem"
      >
        <Icon
          name="back"
          width={SPACING.spacing5}
          color={COLORS.darkBlack_hundred}
        />
      </Btn>
      {props.label}
    </Flex>
  )
}
