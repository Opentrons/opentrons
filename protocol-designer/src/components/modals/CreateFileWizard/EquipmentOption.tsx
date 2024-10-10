import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  FLEX_ROBOT_TYPE,
  MAGNETIC_BLOCK_TYPE,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  LegacyStyledText,
  LegacyTooltip,
  SPACING,
  Text,
  TYPOGRAPHY,
  useHoverTooltip,
} from '@opentrons/components'
import { MAX_MAGNETIC_BLOCKS, MAX_MOAM_MODULES } from './ModulesAndOtherTile'
import type { StyleProps } from '@opentrons/components'
import type { ModuleType, RobotType } from '@opentrons/shared-data'

const ARROW_STYLE = css`
  color: ${COLORS.grey50};
  cursor: ${CURSOR_POINTER};
  &:hover {
    color: ${COLORS.black80};
  }
`

const ARROW_STYLE_ACTIVE = css`
  color: ${COLORS.blue50};
  cursor: ${CURSOR_POINTER};
  &:hover {
    color: ${COLORS.black80};
  }
`

const ARROW_STYLE_DISABLED = css`
  color: ${COLORS.grey50};
`

interface MultiplesProps {
  moduleType: ModuleType
  numItems: number
  maxItems: number
  setValue: (num: number) => void
  isDisabled: boolean
}
interface EquipmentOptionProps extends StyleProps {
  onClick: React.MouseEventHandler
  isSelected: boolean
  text: React.ReactNode
  robotType: RobotType
  image?: React.ReactNode
  showCheckbox?: boolean
  disabled?: boolean
  multiples?: MultiplesProps
  type?: 'module' | 'pipetteTip'
}
export function EquipmentOption(props: EquipmentOptionProps): JSX.Element {
  const {
    text,
    onClick,
    isSelected,
    image = null,
    showCheckbox = false,
    disabled = false,
    type = 'module',
    robotType,
    multiples,
    ...styleProps
  } = props
  const { t } = useTranslation(['tooltip', 'shared'])
  const [equipmentTargetProps, equipmentTooltipProps] = useHoverTooltip()
  const [moamTargetProps, moamTooltipProps] = useHoverTooltip()
  const [numMultiples, setNumMultiples] = React.useState<number>(
    multiples?.numItems ?? 0
  )

  const EQUIPMENT_OPTION_STYLE = css`
    background-color: ${COLORS.white};
    border-radius: ${BORDERS.borderRadius8};
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};

    &:hover {
      background-color: ${multiples ? COLORS.white : COLORS.grey10};
      border: 1px ${BORDERS.styleSolid}
        ${multiples ? COLORS.grey30 : COLORS.grey35};
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
      border: 1px ${BORDERS.styleSolid} ${COLORS.blue50};
      box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2);
    }
  `

  const EQUIPMENT_OPTION_DISABLED_STYLE = css`
    ${EQUIPMENT_OPTION_STYLE}
    background-color: ${COLORS.white};
    border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};

    &:hover {
      border: 1px ${BORDERS.styleSolid} ${COLORS.grey30};
    }
  `

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
          isSelected ? 'ot-checkbox' : 'checkbox-blank-outline'
        }`}
        color={isSelected ? COLORS.blue50 : COLORS.grey50}
        size="1.5rem"
        name={isSelected ? 'ot-checkbox' : 'checkbox-blank-outline'}
      />
    )
  } else if (showCheckbox && disabled) {
    iconInfo = <Flex width="1.5rem" />
  } else if (multiples != null) {
    const { numItems, maxItems, isDisabled } = multiples
    let upArrowStyle = ARROW_STYLE
    if (isDisabled || numItems === maxItems) {
      upArrowStyle = ARROW_STYLE_DISABLED
    } else if (numItems > 0) {
      upArrowStyle = ARROW_STYLE_ACTIVE
    }
    let downArrowStyle = ARROW_STYLE
    if (numItems === 0) {
      downArrowStyle = ARROW_STYLE_DISABLED
    } else if (numItems > 0) {
      downArrowStyle = ARROW_STYLE_ACTIVE
    }

    let maxMoam = MAX_MOAM_MODULES
    if (multiples.moduleType === MAGNETIC_BLOCK_TYPE) {
      maxMoam = MAX_MAGNETIC_BLOCKS
    }
    iconInfo = (
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="1.5rem"
        alignItems={ALIGN_CENTER}
      >
        <Flex
          {...moamTargetProps}
          data-testid="EquipmentOption_upArrow"
          onClick={
            isDisabled || numMultiples === maxMoam
              ? undefined
              : () => {
                  multiples.setValue(numMultiples + 1)
                  setNumMultiples(prevNumMultiples => prevNumMultiples + 1)
                }
          }
        >
          <Icon css={upArrowStyle} size="0.75rem" name="ot-arrow-up" />
        </Flex>
        <Flex
          data-testid="EquipmentOption_downArrow"
          onClick={
            numMultiples === 0
              ? undefined
              : () => {
                  multiples.setValue(numMultiples - 1)
                  setNumMultiples(prevNumMultiples => prevNumMultiples - 1)
                }
          }
        >
          <Icon
            css={downArrowStyle}
            size={SPACING.spacing12}
            name="ot-arrow-down"
          />
        </Flex>
        {isDisabled || numMultiples === maxMoam ? (
          <LegacyTooltip {...moamTooltipProps}>
            {t(`not_enough_space_for_${multiples.moduleType}`)}
          </LegacyTooltip>
        ) : null}
      </Flex>
    )
  }

  let optionTooltip
  if (robotType === FLEX_ROBOT_TYPE && type === 'module') {
    optionTooltip = t('disabled_no_space_additional_items')
  } else if (robotType === OT2_ROBOT_TYPE && type === 'module') {
    optionTooltip = t('disabled_you_can_add_one_type')
  } else if (type === 'pipetteTip') {
    optionTooltip = t('disabled_no_space_pipette')
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
        cursor={disabled || multiples != null ? 'auto' : 'pointer'}
        backgroundColor={disabled ? COLORS.grey30 : COLORS.transparent}
        onClick={disabled ? undefined : onClick}
        {...styleProps}
        {...equipmentTargetProps}
        css={equipmentOptionStyle}
      >
        {iconInfo}
        <Flex
          css={css`
            user-select: none;
          `}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
          marginRight={SPACING.spacing16}
        >
          {image}
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <LegacyStyledText
            css={css`
              user-select: none;
            `}
            as="p"
            color={disabled ? COLORS.grey50 : COLORS.black90}
          >
            {text}
          </LegacyStyledText>
          {multiples != null ? (
            <>
              <Box borderBottom={BORDERS.lineBorder} data-testid="line" />
              <Flex
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_CENTER}
                fontSize={TYPOGRAPHY.fontSizeP}
                gridGap={SPACING.spacing4}
              >
                <Text>{t('shared:amount')}</Text>
                <Text>{multiples.numItems}</Text>
              </Flex>
            </>
          ) : null}
        </Flex>
      </Flex>
      {disabled ? (
        <LegacyTooltip {...equipmentTooltipProps}>
          {optionTooltip}
        </LegacyTooltip>
      ) : null}
    </>
  )
}
