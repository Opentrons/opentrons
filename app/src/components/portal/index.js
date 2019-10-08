// @flow
import * as React from 'react'
import ReactDom from 'react-dom'

type PortalLevel = 'global' | 'modal'
const LevelRootIdMap: { [PortalLevel]: string } = {
  modal: '__otAppModalPortalRoot',
  global: '__otAppGlobalPortalRoot',
}

type PortalRootProps = {| level: PortalLevel |}
export function PortalRoot(props: PortalRootProps) {
  return <div id={LevelRootIdMap[props.level]} />
}

type PortalProps = {| children: React.Node, level: PortalLevel |}
export function Portal(props: PortalProps) {
  const { children, level } = props
  const portalRoot = React.useRef<?Element>(null)

  React.useEffect(() => {
    portalRoot.current = global.document.getElementById(LevelRootIdMap[level])
  }, [level])

  if (portalRoot.current == null) return null
  return ReactDom.createPortal(children, portalRoot.current)
}
