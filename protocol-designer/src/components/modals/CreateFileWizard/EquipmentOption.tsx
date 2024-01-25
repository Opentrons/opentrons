import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
  useHoverTooltip,
  Tooltip,
} from '@opentrons/components'
import { css } from 'styled-components'

const EQUIPMENT_OPTION_STYLE = css`
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.borderRadiusSize3};
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
    ...styleProps
  } = props
  const { t } = useTranslation('tooltip')
  const [targetProps, tooltipProps] = useHoverTooltip()

  let equpimentOptionStyle
  if (disabled) {
    equpimentOptionStyle = EQUIPMENT_OPTION_DISABLED_STYLE
  } else if (isSelected) {
    equpimentOptionStyle = EQUIPMENT_OPTION_SELECTED_STYLE
  } else equpimentOptionStyle = EQUIPMENT_OPTION_STYLE
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
        borderRadius={BORDERS.borderRadiusSize2}
        cursor={disabled ? 'auto' : 'pointer'}
        backgroundColor={disabled ? COLORS.grey30 : COLORS.transparent}
        onClick={disabled ? undefined : onClick}
        {...styleProps}
        {...targetProps}
        css={equpimentOptionStyle}
      >
        {showCheckbox ? (
          <Icon
            aria-label={`EquipmentOption_${
              isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'
            }`}
            color={isSelected ? COLORS.blue50 : COLORS.grey50}
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
          {t('disabled_no_space_additional_items')}
        </Tooltip>
      ) : null}
    </>
  )
}
