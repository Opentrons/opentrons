// @flow
import * as React from 'react'

export const KNOWLEDGEBASE_ROOT_URL =
  'https://intercom.help/opentrons-protocol-designer'

export const links = {
  multiDispense: `${KNOWLEDGEBASE_ROOT_URL}/building-a-protocol/steps/paths`,
  protocolSteps: `${KNOWLEDGEBASE_ROOT_URL}/en/collections/1606688-building-a-protocol#steps`,
  customLabware: `https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions`,
}

type Link = $Keys<typeof links>

type Props = {|
  to: Link,
  children: React.Node,
  className?: ?string,
|}

/** Link which opens a page on the knowledge base to a new tab/window */
function KnowledgeBaseLink(props: Props) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={links[props.to]}
      className={props.className}
    >
      {props.children}
    </a>
  )
}

export default KnowledgeBaseLink
