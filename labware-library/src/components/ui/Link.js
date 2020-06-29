// @flow
// internal link that preserves query parameters
import * as React from 'react'
import type { ContextRouter } from 'react-router-dom'
import { Link as BaseLink, withRouter } from 'react-router-dom'

export type LinkProps = {|
  ...ContextRouter,
  to: string,
  children?: React.Node,
  className?: string,
|}

export function WrappedLink(props: LinkProps): React.Node {
  const { to, children, className, location } = props

  return (
    <BaseLink
      to={{ pathname: to, search: location.search }}
      className={className}
    >
      {children}
    </BaseLink>
  )
}

export const Link: React.AbstractComponent<
  $Diff<LinkProps, ContextRouter>
> = withRouter(WrappedLink)
