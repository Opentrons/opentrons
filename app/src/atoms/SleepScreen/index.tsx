import * as React from 'react'

import { Flex, LEGACY_COLORS } from '@opentrons/components'

export function SleepScreen(): JSX.Element {
  return (
    <Flex
      width="100vw"
      height="100vh"
      backgroundColor={COLORS.black90}
      data-testid="Touchscreen_SleepScreen"
    ></Flex>
  )
}
