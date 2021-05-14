// input component convenience wrappers
// TODO(mc, 2018-10-18): delete this file in favor of Formik
import * as React from 'react'

import {
  InputField,
  DropdownField,
} from '@opentrons/components'
import type { DropdownOption } from '@opentrons/components'

export interface FormProps {
  onSubmit: () => unknown
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export interface InputProps<T extends string | number | symbol> {
  name: T
  value: string | null | undefined
  disabled?: boolean
  onChange: (valMap: {[name in T]: string}) => unknown
  className?: string
}

type SelectProps<T extends string | number | symbol> = InputProps<T> & {
  options: DropdownOption[],
}

type TextInputProps<T extends string | number | symbol> = InputProps<T> & {
  type: 'text' | 'password',
}

export class Form extends React.Component<FormProps> {
  onSubmit: React.FormEventHandler = event => {
    this.props.onSubmit()
    event.preventDefault()
  }

  render(): JSX.Element {
    const onSubmit = !this.props.disabled ? this.onSubmit : undefined

    return (
      <form onSubmit={onSubmit} className={this.props.className}>
        {this.props.children}
      </form>
    )
  }
}

export class Select<T extends string | number | symbol = string> extends React.Component<SelectProps<T>> {
  onChange: React.ChangeEventHandler<HTMLSelectElement> = event => {
    if (!this.props.disabled) {
      this.props.onChange({
        [this.props.name]: event.target.value,
      } as {[name in T]: string})
    }
  }

  render(): JSX.Element {
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

export class TextInput<T extends string | number | symbol = string> extends React.Component<TextInputProps<T>> {
  onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    if (!this.props.disabled) {
      this.props.onChange({
        [this.props.name]: event.target.value,
      } as {[name in T]: string})
    }
  }

  render(): JSX.Element {
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
