import * as React from 'react'
import {
  Flex,
  Text,
  Icon,
  DIRECTION_ROW,
  COLORS,
  SPACING,
  ALIGN_CENTER,
} from '@opentrons/components'

interface TiprackOptionProps {
  onClick: React.MouseEventHandler
  isSelected: boolean
  text: React.ReactNode
}
export function TiprackOption(props: TiprackOptionProps): JSX.Element {
  const { text, onClick, isSelected } = props
  return (
    <Flex
      aria-label={`TiprackOption_flex_${text}`}
      cursor="pointer"
      onClick={onClick}
      flexDirection={DIRECTION_ROW}
      padding={SPACING.spacing6}
      width="15rem"
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing4}
    >
      <Icon
        aria-label={`TiprackOption_${
          isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'
        }`}
        color={isSelected ? COLORS.blueEnabled : COLORS.darkGreyEnabled}
        size="1.25rem"
        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
      />
      <Text fontSize="12px">{text}</Text>
    </Flex>
  )
}
