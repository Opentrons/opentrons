import type * as React from 'react'
import { Link } from '@opentrons/components'
import { links } from './linkConstants'

interface KnowledgeLinkProps {
  to: keyof typeof links
  children: React.ReactNode
}

export function KnowledgeLink(props: KnowledgeLinkProps): JSX.Element {
  const { to, children } = props
  return (
    <Link target="_blank" rel="noopener noreferrer" href={links[to]}>
      {children}
    </Link>
  )
}
