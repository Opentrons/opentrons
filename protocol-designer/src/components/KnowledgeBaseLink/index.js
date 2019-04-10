// @flow
import * as React from 'react'

export const KNOWLEDGEBASE_ROOT_URL =
  'https://intercom.help/opentrons-protocol-designer'

export const links = {
  multiDispense: `${KNOWLEDGEBASE_ROOT_URL}/building-a-protocol/steps/paths`,
}

type Link = $Keys<typeof links>

type Props = {
  to: Link,
  children: React.Node,
}

/** Link which opens a page on the knowledge base to a new tab/window */
function KnowledgeBaseLink(props: Props) {
  return (
    <a target="_blank" rel="noopener noreferrer" href={links[props.to]}>
      {props.children}
    </a>
  )
}

export default KnowledgeBaseLink
