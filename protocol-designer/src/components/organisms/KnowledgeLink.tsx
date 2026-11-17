import { Link } from '@opentrons/components'

import { LINK_BUTTON_STYLE } from '../atoms'

import type { ReactNode } from 'react'

interface KnowledgeLinkProps {
  children: ReactNode
}

export const RELEASE_NOTES_URL =
  'https://github.com/Opentrons/opentrons/blob/edge/protocol-designer/release-notes.md'

export const DOC_URL = 'https://docs.opentrons.com/protocol-designer/'

export function KnowledgeLink(props: KnowledgeLinkProps): ReactNode {
  const { children } = props
  return (
    <Link external href={DOC_URL} css={LINK_BUTTON_STYLE}>
      {children}
    </Link>
  )
}
