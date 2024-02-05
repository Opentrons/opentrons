// internal link that preserves query parameters
import * as React from 'react'
import { withRouter, Link as BaseLink } from 'react-router-dom'
import type { RouteComponentProps } from 'react-router-dom'

export interface LinkProps extends RouteComponentProps {
  to: string
  children?: React.ReactNode
  className?: string
}

export function WrappedLink(props: LinkProps): JSX.Element {
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

// @ts-expect-error react router type not portable
export const Link: (props: {
  to: string
  children?: React.ReactNode
  className?: string
}) => JSX.Element = withRouter(WrappedLink)
