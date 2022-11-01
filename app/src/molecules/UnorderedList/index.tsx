import * as React from 'react'
import { css } from 'styled-components'
import { SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'

interface UnorderedListProps {
  items: React.ReactNode[]
}
export function UnorderedList(props: UnorderedListProps): JSX.Element {
  const { items } = props
  return (
    <ul>
      {items.map((item, index) => (
        <li
          key={index}
          css={css`
            margin-left: ${SPACING.spacing5};
          `}
        >
          <StyledText as="p">{item}</StyledText>
        </li>
      ))}
    </ul>
  )
}
