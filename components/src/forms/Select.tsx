import * as React from 'react'
import ReactSelect, { components as reactSelectComponents } from 'react-select'
import cx from 'classnames'

import { Icon } from '../icons'
import { POSITION_ABSOLUTE, POSITION_FIXED } from '../styles'
import styles from './Select.css'

import type { CSSObject } from 'styled-components'
import type { MenuProps, IndicatorProps } from 'react-select'

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

export type SelectProps = React.ComponentProps<typeof Select>

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
  // the following should not be cleared to ensure proper positioning
  // included as comments so we can see what we're not touching
  // noOptionsMessage: NO_STYLE_FN,
  // menuPortal: _ => _,
  // placeholder: _ => _,
  // singleValue: _ => _,
  // valueContainer: _ => _,
}

export class Select extends ReactSelect<
  SelectOption,
  boolean,
  SelectOptionGroup
> {
  render(): JSX.Element {
    return (
      <ReactSelect
        {...this.props}
        styles={CLEAR_STYLES}
        classNamePrefix={SELECT_CX_PREFIX}
        className={cx(styles.select, this.props.className)}
        components={{ DropdownIndicator, Menu }}
      />
    )
  }
}

function DropdownIndicator(
  props: IndicatorProps<SelectOption, boolean, SelectOptionGroup>
): JSX.Element | null {
  return (
    <reactSelectComponents.DropdownIndicator {...props}>
      <div
        className={cx(styles.dropdown_indicator, {
          [styles.flipped]: props.selectProps.menuIsOpen,
        })}
      >
        <Icon name="menu-down" className={cx(styles.dropdown_indicator_icon)} />
      </div>
    </reactSelectComponents.DropdownIndicator>
  )
}

// TODO(bc, 2021-03-09): reactSelectComponents.Menu children type expects single element
// add do nothing <> fragment around contents to satisfy react select type
const Menu = (
  props: MenuProps<SelectOption, boolean, SelectOptionGroup>
): JSX.Element => (
  /* @ts-expect-error */
  <reactSelectComponents.Menu {...props}>
    <div className={styles.menu}>{props.children}</div>
    <div className={styles.menu_control_bridge} />
  </reactSelectComponents.Menu>
)
