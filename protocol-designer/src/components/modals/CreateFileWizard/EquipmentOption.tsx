import * as React from 'react'
import {
  Flex,
  Text,
  Icon,
  SPACING,
  ALIGN_CENTER,
  BORDERS,
  JUSTIFY_CENTER,
  COLORS,
  StyleProps,
  TYPOGRAPHY,
} from '@opentrons/components'

interface EquipmentOptionProps extends StyleProps {
  onClick: React.MouseEventHandler
  isSelected: boolean
  text: React.ReactNode
  image?: React.ReactNode
  showCheckbox?: boolean
}
export function EquipmentOption(props: EquipmentOptionProps): JSX.Element {
  const {
    text,
    onClick,
    isSelected,
    image = null,
    showCheckbox = false,
    ...styleProps
  } = props
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      width="21.75rem"
      padding={SPACING.spacing8}
      border={BORDERS.lineBorder}
      borderRadius={BORDERS.borderRadiusSize2}
      cursor="pointer"
      onClick={onClick}
      borderColor={isSelected ? COLORS.blueEnabled : COLORS.medGreyEnabled}
      {...styleProps}
    >
      {showCheckbox ? (
        <Icon
          size="2rem"
          name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
        />
      ) : null}
      <Flex
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        marginRight={SPACING.spacing16}
      >
        {image}
      </Flex>
      <Text as="p" fontSize={TYPOGRAPHY.fontSizeP}>
        {text}
      </Text>
    </Flex>
  )
}
