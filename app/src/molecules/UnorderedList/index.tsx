import { StyledText } from '../../atoms/text'
import { SPACING } from '@opentrons/components'
import * as React from 'react'
import { css } from 'styled-components'

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
            margin-left: ${SPACING.spacing24};
          `}
        >
          <StyledText as="p">{item}</StyledText>
        </li>
      ))}
    </ul>
  )
}
