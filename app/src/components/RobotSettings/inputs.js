// @flow
// input component convenience wrappers
// TODO(mc, 2018-10-18): delete this file in favor of Formik
import {
  type DropdownOption,
  DropdownField,
  InputField,
} from '@opentrons/components'
import * as React from 'react'

export type FormProps = {
  onSubmit: () => mixed,
  disabled?: boolean,
  children: React.Node,
  className?: string,
}

export type InputProps<T> = {
  name: T,
  value: ?string,
  disabled?: boolean,
  onChange: ({ [name: T]: string }) => mixed,
  className?: string,
}

type SelectProps<T> = InputProps<T> & {
  options: Array<DropdownOption>,
}

type TextInputProps<T> = InputProps<T> & {
  type: 'text' | 'password',
}

export class Form extends React.Component<FormProps> {
  onSubmit: (event: SyntheticEvent<>) => void = event => {
    this.props.onSubmit()
    event.preventDefault()
  }

  render(): React.Node {
    const onSubmit = !this.props.disabled ? this.onSubmit : undefined

    return (
      <form onSubmit={onSubmit} className={this.props.className}>
        {this.props.children}
      </form>
    )
  }
}

export class Select<T: string> extends React.Component<SelectProps<T>> {
  onChange: (event: SyntheticInputEvent<>) => void = event => {
    if (!this.props.disabled) {
      this.props.onChange({
        [this.props.name]: event.target.value,
      })
    }
  }

  render(): React.Node {
    const { value, options, disabled, className } = this.props

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
  onChange: (event: SyntheticInputEvent<>) => void = event => {
    if (!this.props.disabled) {
      this.props.onChange({
        [this.props.name]: event.target.value,
      })
    }
  }

  render(): React.Node {
    const { type, value, disabled, className } = this.props

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
