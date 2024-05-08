import * as React from 'react'
import { COLORS, BORDERS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { Icon } from '../../icons'
import { DIRECTION_ROW, JUSTIFY_SPACE_BETWEEN } from '../../styles'
import { StyledText } from '../StyledText'

export interface CheckboxProps {
  /** checkbox is checked if value is true */
  isChecked: boolean
}

export function Checkbox(props: CheckboxProps): JSX.Element {
  const { isChecked } = props

  return (
    <Flex flexDirection={DIRECTION_ROW} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <StyledText>

      </StyledText>
      <Check isChecked={isChecked} />
    </Flex>
  )
}

interface CheckProps {
  isChecked: boolean
}
function Check(props: CheckProps): JSX.Element {
  return props.isChecked ? (
    <Icon name="ot-checkbox" size="1.75rem" />
  ) : (
    <Flex
      size="1.75rem"
      border={`2px solid ${COLORS.black90}`}
      borderRadius={BORDERS.borderRadius4} />
  )
}
