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
      aria-label={`EquipmentOption_flex_${text}`}
      alignItems={ALIGN_CENTER}
      width="21.75rem"
      padding={SPACING.spacing8}
      border={isSelected ? BORDERS.activeLineBorder : BORDERS.lineBorder}
      borderRadius={BORDERS.borderRadiusSize2}
      cursor="pointer"
      onClick={onClick}
      {...styleProps}
    >
      {showCheckbox ? (
        <Icon
          aria-label={`EquipmentOption_${
            isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'
          }`}
          color={isSelected ? COLORS.blueEnabled : COLORS.darkGreyEnabled}
          size="1.5rem"
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
