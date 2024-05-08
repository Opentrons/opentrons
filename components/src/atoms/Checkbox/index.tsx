import * as React from 'react'
import { COLORS, BORDERS } from '../../helix-design-system'
import { Flex } from '../../primitives'
import { Icon } from '../../icons'
import { DIRECTION_ROW, JUSTIFY_SPACE_BETWEEN } from '../../styles'
import { SPACING } from '../../ui-style-constants'
import { StyledText } from '../StyledText'

export interface CheckboxProps {
  /** checkbox is checked if value is true */
  isChecked: boolean
}
export function Checkbox(props: CheckboxProps): JSX.Element {
  const { isChecked } = props
  const backgroundColor = isChecked ? COLORS.blue50 : COLORS.blue35
  const color = isChecked ? COLORS.white : COLORS.black90
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing20}
      borderRadius={BORDERS.borderRadius16}
      backgroundColor={backgroundColor}
      color={color}>
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
    <Icon name="ot-checkbox" size="1.75rem" color={COLORS.white} />
  ) : (
    <Flex
      size="1.75rem"
      border={`2px solid ${COLORS.black90}`}
      borderRadius={BORDERS.borderRadius4} />
  )
}
