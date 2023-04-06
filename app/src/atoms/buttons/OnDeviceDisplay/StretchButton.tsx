import * as React from 'react'

import {
  Btn,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
  BORDERS,
} from '@opentrons/components'

export type StretchButtonProps = React.ComponentProps<typeof Btn>

export function StretchButton(props: StretchButtonProps): JSX.Element {
  return (
    <Btn
      display="flex"
      width="100%"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_FLEX_START}
      padding={SPACING.spacing5}
      borderRadius={BORDERS.size_three}
      backgroundColor={COLORS.lightGreyPressed}
      {...props}
    />
  )
}
