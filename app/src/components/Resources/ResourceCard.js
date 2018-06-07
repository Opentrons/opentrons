// @flow
// resources page layout
import * as React from 'react'
import {Card, OutlineButton} from '@opentrons/components'

type Props = {
  title: React.Node,
  description: React.Node,
  url: string,
}

export default function ResourceCard (props: Props) {
  return (
    <Card
      title={props.title}
    >
      <p>{props.description}</p>
      <OutlineButton
        Component="a"
        href={props.url}
        target="_blank"
      >
        View in Browser
      </OutlineButton>
    </Card>
  )
}
