import * as React from 'react'
import ReactDom from 'react-dom'
import { Box } from '@opentrons/components'

// TODO(bc, 2021-02-23): this component should probably be named
// something else for clarity, and may belong better in a
// different directory than app/src/App/

type PortalLevel = 'page' | 'top'

interface Props {
  children: React.ReactNode
  level: PortalLevel
}

interface State {
  hasRoot: boolean
}

interface PortalLevelInfo {
  id: string
  zIndex: number | string
}

const PORTAL_ROOT_PROPS_BY_LEVEL: Record<PortalLevel, PortalLevelInfo> = {
  page: { id: '__otAppModalPortalRoot', zIndex: 1 },
  top: { id: '__otAppTopPortalRoot', zIndex: 10 },
}

const getPortalRoot = (level: PortalLevel): HTMLElement | null =>
  (global.document as HTMLDocument).getElementById(
    PORTAL_ROOT_PROPS_BY_LEVEL[level].id
  )

export function PortalRoot(): JSX.Element {
  return <Box {...PORTAL_ROOT_PROPS_BY_LEVEL.page} />
}

export function TopPortalRoot(): JSX.Element {
  return <Box {...PORTAL_ROOT_PROPS_BY_LEVEL.top} />
}

// the children of Portal are rendered into the PortalRoot if it exists in DOM
export class Portal extends React.Component<Props, State> {
  $root: Element | null | undefined

  static defaultProps: { level: PortalLevel } = {
    level: 'page',
  }

  constructor(props: Props) {
    super(props)
    this.$root = getPortalRoot(props.level)
    this.state = { hasRoot: !!this.$root }
  }

  // on first launch, $portalRoot isn't in DOM; double check once we're mounted
  // TODO(mc, 2018-10-08): prerender UI instead
  componentDidMount(): void {
    if (!this.$root) {
      this.$root = getPortalRoot(this.props.level)
      this.setState({ hasRoot: !!this.$root })
    }
  }

  render(): React.ReactPortal | null {
    if (!this.$root) return null
    return ReactDom.createPortal(this.props.children, this.$root)
  }
}
