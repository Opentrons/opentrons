import * as React from 'react'
import { Command } from '@opentrons/shared-data/protocol/types/schemaV6/command'
import {
  ALIGN_CENTER,
  DIRECTION_ROW,
  Flex,
  SPACING_1,
  SPACING_3,
} from '@opentrons/components'

interface Props {
  command: Command
  commandText: string
}
export function CommandText(props: Props): JSX.Element {
  return (
    <Flex
      marginLeft={SPACING_3}
      flex={'auto'}
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_ROW}
    >
      <Flex>{props.command.commandType} </Flex>
      <Flex marginLeft={SPACING_1}>{props.commandText}</Flex>
    </Flex>
  )
}
