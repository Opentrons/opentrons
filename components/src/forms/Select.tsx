import * as React from 'react'
import ReactSelect, {
  components as reactSelectComponents,
  DropdownIndicatorProps,
} from 'react-select'
import cx from 'classnames'

import { Icon } from '../icons'
import { POSITION_ABSOLUTE, POSITION_FIXED } from '../styles'
import styles from './Select.css'

import type {
  Props as ReactSelectProps,
  MenuProps,
  StylesConfig,
  CSSObjectWithLabel,
} from 'react-select'
import { Box, SPACING } from '..'

export { reactSelectComponents }

export const PLACEMENT_AUTO: 'auto' = 'auto'
export const PLACEMENT_BOTTOM: 'bottom' = 'bottom'
export const PLACEMENT_TOP: 'top' = 'top'

export const CONTEXT_MENU: 'menu' = 'menu'
export const CONTEXT_VALUE: 'value' = 'value'

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

export interface SelectOptionGroup {
  options: SelectOption[]
  label?: string
}

// deprecated this type shouldn't be directly needed as the types for react-select
// combine options and groups for us now
export type SelectOptionOrGroup = SelectOption | SelectOptionGroup

export type SelectPlacement =
  | typeof PLACEMENT_AUTO
  | typeof PLACEMENT_BOTTOM
  | typeof PLACEMENT_TOP

export type SelectPosition = typeof POSITION_ABSOLUTE | typeof POSITION_FIXED

export type SelectOptionContext = typeof CONTEXT_MENU | typeof CONTEXT_VALUE

export type SelectProps = ReactSelectProps<SelectOption>

const VOID_STYLE: unknown = undefined
const NO_STYLE_FN = (): CSSObjectWithLabel => VOID_STYLE as CSSObjectWithLabel

const CLEAR_STYLES: StylesConfig<SelectOption> = {
  clearIndicator: NO_STYLE_FN,
  container: NO_STYLE_FN,
  control: (styles: CSSObjectWithLabel) => ({
    ...styles,
    width: '15rem',
  }),
  dropdownIndicator: NO_STYLE_FN,
  group: NO_STYLE_FN,
  groupHeading: NO_STYLE_FN,
  indicatorsContainer: NO_STYLE_FN,
  indicatorSeparator: NO_STYLE_FN,
  input: (styles: CSSObjectWithLabel) => ({
    ...styles,
    zIndex: 2,
    position: 'absolute',
  }),
  loadingIndicator: NO_STYLE_FN,
  loadingMessage: NO_STYLE_FN,
  menu: NO_STYLE_FN,
  menuList: NO_STYLE_FN,
  multiValue: NO_STYLE_FN,
  multiValueLabel: NO_STYLE_FN,
  multiValueRemove: NO_STYLE_FN,
  option: NO_STYLE_FN,
  // the following should not be cleared to ensure proper positioning
  // included as comments so we can see what we're not touching
  // noOptionsMessage: NO_STYLE_FN,
  // menuPortal: _ => _,
  // placeholder: _ => _,
  // singleValue: _ => _,
  // valueContainer: _ => _,
}

export function Select(props: SelectProps): JSX.Element {
  return (
    <ReactSelect
      {...props}
      styles={CLEAR_STYLES}
      classNamePrefix={SELECT_CX_PREFIX}
      className={cx(styles.select, props.className)}
      components={{ DropdownIndicator, Menu }}
    />
  )
}

function DropdownIndicator(
  props: DropdownIndicatorProps<SelectOption>
): JSX.Element {
  return (
    <reactSelectComponents.DropdownIndicator {...props}>
      <Box
        position={POSITION_ABSOLUTE}
        top="0.55rem"
        right={SPACING.spacing8}
        width={SPACING.spacing20}
      >
        <Icon
          name="menu-down"
          transform={`rotate(${
            props.selectProps.menuIsOpen === true ? '180' : '0'
          })`}
          height="1.25rem"
        />
      </Box>
    </reactSelectComponents.DropdownIndicator>
  )
}

const Menu = (props: MenuProps<SelectOption>): JSX.Element => (
  <reactSelectComponents.Menu {...props}>
    <div className={styles.menu}>{props.children}</div>
    <div className={styles.menu_control_bridge} />
  </reactSelectComponents.Menu>
)
