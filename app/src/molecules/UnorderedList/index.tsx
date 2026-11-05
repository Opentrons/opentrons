import styled from 'styled-components'

import { LegacyStyledText, SPACING } from '@opentrons/components'

import type { ReactNode } from 'react'

const ListItem = styled.li`
  margin-left: ${SPACING.spacing24};
`

interface UnorderedListProps {
  items: ReactNode[]
}

export function UnorderedList(props: UnorderedListProps): ReactNode {
  const { items } = props
  return (
    <ul>
      {items.map((item, index) => (
        <ListItem key={index}>
          <LegacyStyledText forwardedAs="p">{item}</LegacyStyledText>
        </ListItem>
      ))}
    </ul>
  )
}
