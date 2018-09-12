// @flow
// input component convenience wrappers
// TODO(mc, 2018): hopefully merge some of this functionality into components
//   library so this file isn't necessary
import * as React from 'react'

import {
  InputField,
  DropdownField,
  type DropdownOption,
} from '@opentrons/components'

export type FormProps = {
  onSubmit: () => *,
  disabled?: boolean,
  children: React.Node,
  className?: string,
}

export type InputProps<T> = {
  name: T,
  value: ?string,
  disabled?: boolean,
  onChange: ({[name: T]: string}) => *,
  className?: string,
}

type SelectProps<T> = InputProps<T> & {
  options: Array<DropdownOption>,
}

type TextInputProps<T> = InputProps<T> & {
  type: 'text' | 'password',
}

export class Form extends React.Component<FormProps> {
  onSubmit = (event: SyntheticEvent<>) => {
    this.props.onSubmit()
    event.preventDefault()
  }

  render () {
    const onSubmit = !this.props.disabled
      ? this.onSubmit
      : undefined

    return (
      <form onSubmit={onSubmit} className={this.props.className}>
        {this.props.children}
      </form>
    )
  }
}

export class Select<T: string> extends React.Component<SelectProps<T>> {
  onChange = (event: SyntheticInputEvent<>) => {
    if (!this.props.disabled) {
      this.props.onChange({
        [this.props.name]: event.target.value,
      })
    }
  }

  render () {
    const {value, options, disabled, className} = this.props

    return (
      <DropdownField
        value={value}
        options={options}
        disabled={disabled}
        onChange={this.onChange}
        className={className}
      />
    )
  }
}

export class TextInput<T: string> extends React.Component<TextInputProps<T>> {
  onChange = (event: SyntheticInputEvent<>) => {
    if (!this.props.disabled) {
      this.props.onChange({
        [this.props.name]: event.target.value,
      })
    }
  }

  render () {
    const {type, value, disabled, className} = this.props

    return (
      <InputField
        type={type}
        value={value}
        disabled={disabled}
        onChange={this.onChange}
        className={className}
      />
    )
  }
}
