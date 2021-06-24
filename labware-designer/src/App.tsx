import * as React from 'react'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_AROUND,
} from '@opentrons/components'
import { GlobalStyle } from './atoms/GlobalStyle'
import { CreateLabwareSandbox } from './organisms/CreateLabwareSandbox'


export function App() {
  return (
    <>
      <CreateLabwareSandbox />
      <GlobalStyle />
    </>
  )
}
