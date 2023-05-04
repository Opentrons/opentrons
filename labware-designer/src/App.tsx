import { GlobalStyle } from './atoms/GlobalStyle'
import { CreateLabwareSandbox } from './organisms/CreateLabwareSandbox'
import * as React from 'react'

export function App(): JSX.Element {
  return (
    <>
      <CreateLabwareSandbox />
      <GlobalStyle />
    </>
  )
}
