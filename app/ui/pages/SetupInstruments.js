// setup instruments component
import React from 'react'

import Page from '../components/Page'

const DEFAULT_SIDE = 'left'

export default function SetupInstrumentsPage (props) {
  const {match} = props
  const side = match.params.side || DEFAULT_SIDE

  return (
    <Page>
      <h1>hello instruments</h1>
      <h2>setup {side} pipette</h2>
    </Page>
  )
}
