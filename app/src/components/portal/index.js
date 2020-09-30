// @flow
import * as React from 'react'
import ReactDom from 'react-dom'

type Props = {| children: React.Node |}

type State = {| hasRoot: boolean |}

const PORTAL_ROOT_ID = '__otAppModalPortalRoot'
const getPortalRoot = () => global.document.getElementById(PORTAL_ROOT_ID)

export function PortalRoot(): React.Node {
  return <div id={PORTAL_ROOT_ID} />
}

// the children of Portal are rendered into the PortalRoot if it exists in DOM
export class Portal extends React.Component<Props, State> {
  $root: ?Element

  constructor(props: Props) {
    super(props)
    this.$root = getPortalRoot()
    this.state = { hasRoot: !!this.$root }
  }

  // on first launch, $portalRoot isn't in DOM; double check once we're mounted
  // TODO(mc, 2018-10-08): prerender UI instead
  componentDidMount() {
    if (!this.$root) {
      this.$root = getPortalRoot()
      this.setState({ hasRoot: !!this.$root })
    }
  }

  render(): React.Portal | null {
    if (!this.$root) return null
    return ReactDom.createPortal(this.props.children, this.$root)
  }
}
