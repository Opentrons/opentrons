// @flow
// TODO(mc, 2018-10-23): eventually move to components library
import * as React from 'react'
import cx from 'classnames'
import find from 'lodash/find'
import flatMap from 'lodash/flatMap'

import Select, {components} from 'react-select'
import {Icon} from '@opentrons/components'
import styles from './styles.css'

// TODO(mc, 2018-10-23): we use "name", react-select uses "label"; align usage
export type OptionType = {|value: string, label: React.Node|}
export type GroupType = {|options: Array<OptionType>, label?: React.Node|}

type OptionList = Array<OptionType>

type SelectProps = {
  /** optional HTML id for container */
  id?: string,
  /** field name */
  name: string,
  /** React-Select option, usually label, value */
  options: Array<OptionType | GroupType>,
  /** currently selected value */
  value: ?string,
  /** change handler called with (name, value) */
  onValueChange: (name: string, value: string) => mixed,
  /** blur handler called with (name) */
  onLoseFocus?: (name: string) => mixed,
  /** disable the select */
  disabled?: boolean,
  /** optional placeholder  */
  placeholder?: string,
  /** optional className */
  className?: string,
  /** optional caption. hidden when `error` is given */
  caption?: string,
  /** if included, use error style and display error instead of caption */
  error?: ?string,
}

const SELECT_STYLES = {
  input: () => ({padding: 0}),
  groupHeading: () => ({
    margin: 0,
    borderBottom: '1px solid #9b9b9b',
  }),
}

const clearStyles = () => null

const getOpts = (og: OptionType | GroupType): OptionList => og.options || [og]

export default class SelectField extends React.Component<SelectProps> {
  handleChange = (option: OptionType) => {
    const {name, onValueChange} = this.props
    onValueChange(name, option.value)
  }

  handleBlur = () => {
    const {name, onLoseFocus} = this.props
    if (onLoseFocus) onLoseFocus(name)
  }

  render () {
    const {
      id,
      name,
      options,
      disabled,
      placeholder,
      className,
      error,
    } = this.props
    const allOptions = flatMap(options, getOpts)
    const value = find(allOptions, {value: this.props.value}) || null
    const caption = error || this.props.caption
    const captionCx = cx(styles.select_caption, {[styles.error_color]: error})

    return (
      <div className={styles.select_wrapper}>
        <Select
          id={id}
          name={name}
          options={options}
          value={value}
          error={error}
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          isDisabled={disabled}
          placeholder={placeholder}
          styles={SELECT_STYLES}
          components={{
            Control,
            DropdownIndicator,
            Menu,
            Group,
            IndicatorSeparator: null,
          }}
          className={className}
        />
        {caption && <p className={captionCx}>{caption}</p>}
      </div>
    )
  }
}

function Control (props) {
  return (
    <components.Control
      {...props}
      getStyles={clearStyles}
      className={cx(styles.select_control, {
        [styles.error_bg]: props.selectProps.error,
        [styles.focus]: props.isFocused,
      })}
    />
  )
}

function DropdownIndicator (props) {
  const iconWrapperCx = cx(styles.dropdown_icon_wrapper, {
    [styles.flipped]: props.selectProps.menuIsOpen,
  })

  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <div className={iconWrapperCx}>
          <Icon name="menu-down" width="100%" />
        </div>
      </components.DropdownIndicator>
    )
  )
}
// custom Menu (options dropdown) component
function Menu (props) {
  return (
    <components.Menu {...props}>
      <div className={styles.select_menu}>{props.children}</div>
    </components.Menu>
  )
}

// custom option group wrapper component
function Group (props) {
  return (
    <components.Group
      {...props}
      className={styles.select_group}
      getStyles={clearStyles}
    />
  )
}
