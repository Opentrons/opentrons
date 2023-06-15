import * as React from 'react'
import {
  Flex,
  Text,
  SPACING,
  ALIGN_CENTER,
  BORDERS,
  JUSTIFY_CENTER,
  COLORS,
  StyleProps
} from '@opentrons/components'

interface EquipmentOptionProps extends StyleProps {
  onClick: React.MouseEventHandler
  isSelected: boolean
  image: React.ReactNode
  text: React.ReactNode
}
export function EquipmentOption(props: EquipmentOptionProps): JSX.Element {
  const { text, image, onClick, isSelected, ...styleProps } = props
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="21.75rem"
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing16}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.borderRadiusSize2}
      cursor="pointer"
      onClick={onClick}
      borderColor={isSelected ? COLORS.blueEnabled : COLORS.medGreyEnabled}
      {...styleProps}
    >
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        marginRight={SPACING.spacing16}
      >
        {image}
      </Flex>
      <Text as="p">{text}</Text>
    </Flex>
  )
}
