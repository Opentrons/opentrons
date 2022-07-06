import * as React from 'react'
import ReactSelect, { components as reactSelectComponents } from 'react-select'
import { css, CSSObject } from 'styled-components'
import {
  Icon,
  BORDERS,
  TYPOGRAPHY,
  COLORS,
  Box,
  SPACING,
  Flex,
  TEXT_ALIGN_LEFT,
  DIRECTION_COLUMN,
} from '@opentrons/components'

import type {
  Props as ReactSelectProps,
  MenuProps,
  IndicatorProps,
} from 'react-select'
import { MenuItem } from '../MenuList/MenuItem'

export { reactSelectComponents }

export const SELECT_CX_PREFIX = 'ot_select'

export type ChangeAction =
  | 'select-option'
  | 'deselect-option'
  | 'remove-value'
  | 'pop-value'
  | 'set-value'
  | 'clear'
  | 'create-option'

export interface SelectOption {
  value: string
  label?: string
  isDisabled?: boolean
}

export type SelectProps = ReactSelectProps<SelectOption>

const VOID_STYLE: unknown = undefined
const NO_STYLE_FN = (): CSSObject => VOID_STYLE as CSSObject

const CLEAR_STYLES = {
  clearIndicator: NO_STYLE_FN,
  container: NO_STYLE_FN,
  control: NO_STYLE_FN,
  dropdownIndicator: NO_STYLE_FN,
  group: NO_STYLE_FN,
  groupHeading: NO_STYLE_FN,
  indicatorsContainer: NO_STYLE_FN,
  indicatorSeparator: NO_STYLE_FN,
  input: NO_STYLE_FN,
  loadingIndicator: NO_STYLE_FN,
  loadingMessage: NO_STYLE_FN,
  menu: NO_STYLE_FN,
  menuList: NO_STYLE_FN,
  multiValue: NO_STYLE_FN,
  multiValueLabel: NO_STYLE_FN,
  multiValueRemove: NO_STYLE_FN,
  option: NO_STYLE_FN,
}

const SELECT_STYLING = css`
  position: relative;
  background-color: white;
  border: ${BORDERS.lineBorder};
  padding: ${SPACING.spacing3} 0.4rem 1.8rem 0;
  outline: none;
  border-radius: ${BORDERS.radiusRoundEdge};
  height: 1.75rem;
  box-shadow: none;
  width: 16rem;
  font-size: ${TYPOGRAPHY.fontSizeP};
`

const MENU_ITEM_STYLING = css`
  background-color: white;
  width: 16rem;
  min-width: 12rem;
  color: ${COLORS.darkBlack};
  padding: ${SPACING.spacing3} 0 ${SPACING.spacing3} 0.75rem;
  text-align: ${TEXT_ALIGN_LEFT};
  font-size: ${TYPOGRAPHY.fontSizeP};

  &:hover {
    background-color: ${COLORS.lightBlue};
  }

  &:disabled,
  &.disabled {
    color: ${COLORS.greyDisabled};
  }
`

const INDICATOR_STYLE = css`
  position: absolute;
  top: 0.75rem;
  right: ${SPACING.spacing2};
  width: ${SPACING.spacingM};
`
export function Select(props: SelectProps): JSX.Element {
  return (
    <ReactSelect
      {...props}
      styles={CLEAR_STYLES}
      classNamePrefix={SELECT_CX_PREFIX}
      components={{ DropdownIndicator, Menu }}
      css={SELECT_STYLING}
      theme={theme => ({
        ...theme,
        colors: {
          ...theme.colors,
          neutral50: COLORS.darkBlack, // Placeholder text color
        },
      })}
    />
  )
}

function DropdownIndicator(
  props: IndicatorProps<SelectOption, false>
): JSX.Element {
  return (
    <reactSelectComponents.DropdownIndicator {...props}>
      <Box css={INDICATOR_STYLE}>
        <Icon
          name={props.selectProps.menuIsOpen ? 'chevron-up' : 'chevron-down'}
          height={TYPOGRAPHY.lineHeight16}
        />
      </Box>
    </reactSelectComponents.DropdownIndicator>
  )
}

const Menu = (props: MenuProps<SelectOption, false>): JSX.Element => (
  <reactSelectComponents.Menu {...props}>
    <>
      <Box color={COLORS.transparent} height={SPACING.spacing3} />
      <Flex
        borderRadius="4px 4px 0px 0px"
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        flexDirection={DIRECTION_COLUMN}
      >
        {/* {props.options
          //  @ts-expect-error: options is not in SelectOption
          .flatMap(og => og.options || [og])
          .map((option, index) => (
            <Box key={index} css={MENU_ITEM_STYLING}>
              {option.label != null ? option.label : option.value}
            </Box>
          ))} */}
        <Box css={MENU_ITEM_STYLING}>{props.children}</Box>
      </Flex>
    </>
  </reactSelectComponents.Menu>
)
