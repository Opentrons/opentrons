import React from 'react'

import {
  DIRECTION_ROW,
  Flex,
  SPACING,
  COLORS,
  BORDERS,
} from '@opentrons/components'

// ToDo (kk:04/17/2024) app has InputField component but it doesn't support flexible height and it still stays in app.
// Needs more modification for the unification for web usage.

interface InputFieldProps {}

export function InputField(props: InputFieldProps): JSX.Element {
  return (
    <Flex
      padding={SPACING.spacing40}
      gridGap={SPACING.spacing40}
      flexDirection={DIRECTION_ROW}
      backgroundColor={COLORS.white}
      borderRadisu={BORDERS.borderRadius4}
    >
      {/* input textbox */}
      {/* button: play button/stop button */}
    </Flex>
  )
}
