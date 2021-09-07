import * as React from 'react'

import {
  Flex,
  Text,
  SPACING_2,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  FONT_BODY_1_DARK,
  FONT_HEADER_DARK,
} from '@opentrons/components'

interface ControlContainerProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function ControlContainer(props: ControlContainerProps): JSX.Element {
  return (
    <Flex flex={1} alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
      <Text css={FONT_HEADER_DARK}>{props.title}</Text>
      <Text css={FONT_BODY_1_DARK} marginBottom={SPACING_2}>
        {props.subtitle}
      </Text>
      {props.children}
    </Flex>
  )
}
