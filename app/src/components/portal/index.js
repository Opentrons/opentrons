// @flow
import * as React from 'react'
import ReactDom from 'react-dom'

type PortalLevel = 'page' | 'top'

type Props = {| children: React.Node, level: PortalLevel |}

type State = {| hasRoot: boolean |}

const PORTAL_ROOT_ID_BY_LEVEL: { [PortalLevel]: string } = {
  page: '__otAppModalPortalRoot',
  top: '__otAppTopPortalRoot',
}

const getPortalRoot = level =>
  global.document.getElementById(PORTAL_ROOT_ID_BY_LEVEL[level])

export function PortalRoot(): React.Node {
  return <div id={PORTAL_ROOT_ID_BY_LEVEL.page} />
}

export function TopPortalRoot(): React.Node {
  return <div id={PORTAL_ROOT_ID_BY_LEVEL.top} />
}

// the children of Portal are rendered into the PortalRoot if it exists in DOM
export class Portal extends React.Component<Props, State> {
  $root: ?Element

  static defaultProps: {| level: PortalLevel |} = {
    level: 'page',
  }

  constructor(props: Props) {
    super(props)
    this.$root = getPortalRoot(props.level)
    this.state = { hasRoot: !!this.$root }
  }

  // on first launch, $portalRoot isn't in DOM; double check once we're mounted
  // TODO(mc, 2018-10-08): prerender UI instead
  componentDidMount() {
    if (!this.$root) {
      this.$root = getPortalRoot(this.props.level)
      this.setState({ hasRoot: !!this.$root })
    }
  }

  render(): React.Portal | null {
    if (!this.$root) return null
    return ReactDom.createPortal(this.props.children, this.$root)
  }
}
