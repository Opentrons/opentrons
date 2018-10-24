// @flow
// TODO(mc, 2018-10-23): eventually move to components library
import * as React from 'react'
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
  /** disable the select */
  disabled?: boolean,
  /** optional placeholder  */
  placeholder?: string,
  /** optional className */
  className?: string,
}

const SELECT_STYLES = {
  control: () => ({
    height: '1.75rem',
  }),
  input: () => ({
    padding: 0,
  }),
}

const getOpts = (og: OptionType | GroupType): OptionList => og.options || [og]

export default class SelectField extends React.Component<SelectProps> {
  handleChange = (option: OptionType) => {
    const {name, onValueChange} = this.props
    onValueChange(name, option.value)
  }

  render () {
    const {id, name, options, disabled, placeholder, className} = this.props
    const allOptions = flatMap(options, getOpts)
    const value = find(allOptions, {value: this.props.value}) || null

    return (
      <Select
        id={id}
        name={name}
        options={options}
        value={value}
        onChange={this.handleChange}
        isDisabled={disabled}
        placeholder={placeholder}
        styles={SELECT_STYLES}
        className={className}
        components={{
          Control,
          DropdownIndicator,
          Menu,
          IndicatorSeparator: null,
        }}
      />
    )
  }
}

function Control (props) {
  return <components.Control {...props} className={styles.select_control} />
}

function DropdownIndicator (props) {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <div className={styles.dropdown_icon}>
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
