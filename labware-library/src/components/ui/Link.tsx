// internal link that preserves query parameters
import type { ReactNode } from 'react'
import { Link as BaseLink } from 'react-router-dom'

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
