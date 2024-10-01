// internal link that preserves query parameters
import { Link as BaseLink } from 'react-router-dom'

import type { ReactNode } from 'react'

export interface LinkProps {
  to: string
  search?: string
  children?: ReactNode
  className?: string
}

export function Link({
  to,
  children,
  className,
  search,
}: LinkProps): JSX.Element {
  return (
    <BaseLink to={{ pathname: to, search }} className={className}>
      {children}
    </BaseLink>
  )
}
