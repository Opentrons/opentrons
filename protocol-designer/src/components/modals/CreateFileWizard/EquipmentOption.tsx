import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  Flex,
  Text,
  Icon,
  SPACING,
  ALIGN_CENTER,
  BORDERS,
  JUSTIFY_CENTER,
  COLORS,
  TYPOGRAPHY,
  useHoverTooltip,
  Tooltip,
} from '@opentrons/components'
import type { StyleProps } from '@opentrons/components'
import type { RobotType } from '@opentrons/shared-data'

const EQUIPMENT_OPTION_STYLE = css`
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.borderRadius8};
  border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};

  &:hover {
    background-color: ${COLORS.grey10};
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey35};
  }

  &:focus {
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
    outline-offset: 3px;
  }
`

const EQUIPMENT_OPTION_SELECTED_STYLE = css`
  ${EQUIPMENT_OPTION_STYLE}
  background-color: ${COLORS.blue10};
  border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};

  &:hover {
    background-color: ${COLORS.blue10};
    border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2);
  }
`

const EQUIPMENT_OPTION_DISABLED_STYLE = css`
  ${EQUIPMENT_OPTION_STYLE}
  background-color: ${COLORS.white};
  border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};

  &:hover {
    background-color: ${COLORS.white};
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
  }
`
interface EquipmentOptionProps extends StyleProps {
  onClick: React.MouseEventHandler
  isSelected: boolean
  text: React.ReactNode
  robotType: RobotType
  image?: React.ReactNode
  showCheckbox?: boolean
  disabled?: boolean
}
export function EquipmentOption(props: EquipmentOptionProps): JSX.Element {
  const {
    text,
    onClick,
    isSelected,
    image = null,
    showCheckbox = false,
    disabled = false,
    robotType,
    ...styleProps
  } = props
  const { t } = useTranslation('tooltip')
  const [targetProps, tooltipProps] = useHoverTooltip()

  let equipmentOptionStyle
  if (disabled) {
    equipmentOptionStyle = EQUIPMENT_OPTION_DISABLED_STYLE
  } else if (isSelected) {
    equipmentOptionStyle = EQUIPMENT_OPTION_SELECTED_STYLE
  } else {
    equipmentOptionStyle = EQUIPMENT_OPTION_STYLE
  }
  let iconInfo: JSX.Element | null = null
  if (showCheckbox && !disabled) {
    iconInfo = (
      <Icon
        aria-label={`EquipmentOption_${
          isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'
        }`}
        color={isSelected ? COLORS.blue50 : COLORS.grey50}
        size="1.5rem"
        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
      />
    )
  } else if (showCheckbox && disabled) {
    iconInfo = <Flex width="1.5rem" />
  }

  return (
    <>
      <Flex
        aria-label={`EquipmentOption_flex_${text}`}
        alignItems={ALIGN_CENTER}
        width="21.75rem"
        padding={SPACING.spacing8}
        border={
          isSelected && !disabled
            ? BORDERS.activeLineBorder
            : BORDERS.lineBorder
        }
        borderRadius={BORDERS.borderRadius8}
        cursor={disabled ? 'auto' : 'pointer'}
        backgroundColor={disabled ? COLORS.grey30 : COLORS.transparent}
        onClick={disabled ? undefined : onClick}
        {...styleProps}
        {...targetProps}
        css={equipmentOptionStyle}
      >
        {iconInfo}
        <Flex
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          marginRight={SPACING.spacing16}
        >
          {image}
        </Flex>
        <Text
          as="p"
          fontSize={TYPOGRAPHY.fontSizeP}
          color={disabled ? COLORS.grey50 : COLORS.black90}
        >
          {text}
        </Text>
      </Flex>
      {disabled ? (
        <Tooltip {...tooltipProps}>
          {t(
            robotType === FLEX_ROBOT_TYPE
              ? 'disabled_no_space_additional_items'
              : 'disabled_you_can_add_one_type'
          )}
        </Tooltip>
      ) : null}
    </>
  )
}
