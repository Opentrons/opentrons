// @flow
import * as React from 'react'

export const KNOWLEDGEBASE_ROOT_URL =
  'https://support.opentrons.com/en/collections/493886-protocol-designer'

export const links = {
  multiDispense: `https://support.opentrons.com/en/articles/4170341-paths`,
  protocolSteps: `https://support.opentrons.com/en/collections/493886-protocol-designer#building-a-protocol-steps`,
  customLabware: `https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions`,
  recommendedLabware:
    'https://support.opentrons.com/en/articles/4168748-labware-and-module-compatibility',
  pipetteGen1MultiModuleCollision:
    'https://support.opentrons.com/en/articles/4168741-module-placement',
  betaReleases: `https://support.opentrons.com/en/articles/3854833-opentrons-beta-software-releases`,
  magneticModuleGenerations:
    'http://support.opentrons.com/en/articles/1820112-magnetic-module',
}

type Link = $Keys<typeof links>

type Props = {|
  to: Link,
  children: React.Node,
  className?: ?string,
|}

/** Link which opens a page on the knowledge base to a new tab/window */
export function KnowledgeBaseLink(props: Props): React.Node {
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
