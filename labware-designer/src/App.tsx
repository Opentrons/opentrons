import * as React from 'react'
import { GlobalStyle } from './atoms/GlobalStyle'
import { CreateLabwareSandbox } from './organisms/CreateLabwareSandbox'

export function App(): JSX.Element {
  return (
    <>
      <CreateLabwareSandbox />
      <GlobalStyle />
    </>
  )
}
