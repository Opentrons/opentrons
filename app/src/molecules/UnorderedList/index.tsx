import * as React from 'react'
import { css } from 'styled-components'
import { SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'

interface UnorderedListProps {
  items: Array<React.ReactNode>
}
export function UnorderedList(props: UnorderedListProps): JSX.Element {
  const { items } = props
  return (
    <ul>
      {items.map(item => (
        <li css={css`margin-left: ${SPACING.spacing5};`}>
          <StyledText as="p">{item}</StyledText>
        </li>
      ))}
    </ul>
  )
}

