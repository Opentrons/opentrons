import * as React from 'react'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_AROUND,
} from '@opentrons/components'
import { IrregularLabwareSandbox } from './organisms/IrregularLabwareSandbox'

export function App() {
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_AROUND}
      height="100%"
      width="100%"
    >
      <IrregularLabwareSandbox />
    </Flex>
  )
}
