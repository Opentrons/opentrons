// @flow
import * as React from 'react'

export const KNOWLEDGEBASE_ROOT_URL =
  'https://intercom.help/opentrons-protocol-designer'

export const links = {
  multiDispense: `${KNOWLEDGEBASE_ROOT_URL}/building-a-protocol/steps/paths`,
  protocolSteps: `${KNOWLEDGEBASE_ROOT_URL}/en/collections/1606688-building-a-protocol#steps`,
  customLabware: `https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions`,
  recommendedLabware:
    'https://docs.google.com/document/d/1CrK-3uAQYDylb9h7EfJBv2Ri4FIF-XW92Uf0Zd4dWr4/edit?usp=sharing', // TODO - update before launch with intercom article
  pipetteGen1MultiModuleCollision:
    'https://docs.google.com/document/d/1kE8qwlx6jVoPmWe0AwNmHVbnDNa4RHnoLCcDTt0SA1s/edit?usp=sharing', // TODO - update before launch with intercom article
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
