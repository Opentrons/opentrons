import * as React from 'react'
import {
  Flex,
  Text,
  Icon,
  DIRECTION_ROW,
  COLORS,
  TYPOGRAPHY,
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
    >
      <Icon
        aria-label={`EquipmentOption_${
          isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'
        }`}
        color={isSelected ? COLORS.blueEnabled : COLORS.darkGreyEnabled}
        size="1.5rem"
        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
      />
      <Text as="p" fontSize={TYPOGRAPHY.fontSizeP}>
        {text}
      </Text>
    </Flex>
  )
}
