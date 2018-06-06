// @flow
// resources page layout
import * as React from 'react'
import {Card, OutlineButton} from '@opentrons/components'

const TITLE = 'Knowledge Base'

export default function KnowledgeCard () {
  return (
    <Card
      title={TITLE}
    >
      <p>Visit our walkthroughs and FAQs</p>
      <OutlineButton
        Component="a"
        href="https://support.opentrons.com"
        target="_blank"
      >
        View in Browser
      </OutlineButton>
    </Card>
  )
}
