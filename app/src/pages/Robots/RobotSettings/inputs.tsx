// input component convenience wrappers
// TODO(mc, 2018-10-18): delete this file in favor of Formik
import * as React from 'react'

import {
  InputField,
  DropdownField,
  type DropdownOption,
} from '@opentrons/components'

export type FormProps = {
  onSubmit: () => mixed,
  disabled?: boolean,
  children: React.ReactNode,
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
  options: DropdownOption[],
}

type TextInputProps<T> = InputProps<T> & {
  type: 'text' | 'password',
}

export class Form extends React.Component<FormProps> {
  onSubmit: (event: SyntheticEvent<>) => void = event => {
    this.props.onSubmit()
    event.preventDefault()
  }

  render(): React.ReactNode {
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

  render(): React.ReactNode {
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

  render(): React.ReactNode {
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
