import * as React from 'react'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  Flex,
  SPACING_1,
  SPACING_3,
} from '@opentrons/components'

interface Props {
  commandText?: JSX.Element
}
export function CommandText(props: Props): JSX.Element | null {
  return (
    <Flex
      marginLeft={SPACING_3}
      flex={'auto'}
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_ROW}
    >
      <Flex marginLeft={SPACING_1}>{props.commandText}</Flex>
    </Flex>
  )
}
