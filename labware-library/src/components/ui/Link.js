// @flow
// internal link that preserves query parameters
import * as React from 'react'
import { withRouter, Link as BaseLink } from 'react-router-dom'
import type { ContextRouter } from 'react-router-dom'

export type LinkProps = {|
  to: string,
  children?: React.Node,
  className?: string,
|}

export function WrappedLink(props: {| ...ContextRouter, ...LinkProps |}) {
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

export const Link = withRouter(WrappedLink)
