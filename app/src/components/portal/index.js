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

// // the children of Portal are rendered into the PortalRoot if it exists in DOM
// export class Portal extends React.Component<Props, State> {
//   $root: ?Element

//   constructor(props: Props) {
//     super(props)
//     this.$root = getPortalRoot()
//     this.state = { hasRoot: !!this.$root }
//   }

//   // on first launch, $portalRoot isn't in DOM; double check once we're mounted
//   // TODO(mc, 2018-10-08): prerender UI instead
//   componentDidMount() {
//     if (!this.$root) {
//       this.$root = getPortalRoot()
//       this.setState({ hasRoot: !!this.$root })
//     }
//   }

//   render() {
//     if (!this.$root) return null
//     return ReactDom.createPortal(this.props.children, this.$root)
//   }
// }
