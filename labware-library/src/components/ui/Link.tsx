// internal link that preserves query parameters
import type * as React from 'react'
import { Link as BaseLink, useLocation } from 'react-router-dom'

export interface LinkProps {
  to: string
  children?: React.ReactNode
  className?: string
}

export function Link({ to, children, className }: LinkProps): JSX.Element {
  const location = useLocation()

  return (
    <BaseLink
      to={{ pathname: to, search: location.search }}
      className={className}
    >
      {children}
    </BaseLink>
  )
}
