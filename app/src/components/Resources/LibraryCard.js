// @flow
// resources page layout
import * as React from 'react'
import {Card, OutlineButton} from '@opentrons/components'

const TITLE = 'Protocol Library'

export default function LibraryCard () {
  return (
    <Card
      title={TITLE}
    >
      <p>Download a protocol to run on your robot</p>
      <OutlineButton
        Component="a"
        href="http://protocols.opentrons.com/"
        target="_blank"
      >
        View in Browser
      </OutlineButton>
    </Card>
  )
}
