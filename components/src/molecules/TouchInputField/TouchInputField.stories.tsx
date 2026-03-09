import * as React from 'react'

import { DIRECTION_COLUMN } from '../../styles'
import { SPACING, VIEWPORT } from '../../ui-style-constants'
import { TouchInputField as TouchInputFieldComponent } from './'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof InputFieldComponent> = {
  // ToDo (kk05/02/2024) this should be in Library but at this moment there is the same name component in components
  // The unification for this component will be done when the old component is retired completely.
  title: 'Helix/Molecules/InputField',
  component: InputFieldComponent,
  parameters: VIEWPORT.touchScreenViewport,
  argTypes: {
    units: {
      control: {
        type: 'boolean',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof InputFieldComponent>

export const InputField: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <InputFieldComponent
        {...args}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.units ? 'rem' : undefined}
      />
    </div>
  )
}

InputField.args = {
  value: 200,
  type: 'number',
  caption: 'example caption',
  max: 200,
  min: 10,
}

export const InputFieldWithError: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <InputFieldComponent
        {...args}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.type !== 'number' ? undefined : args.units}
      />
    </div>
  )
}

InputFieldWithError.args = {
  value: 300,
  type: 'number',
  max: 200,
  min: 10,
  error: 'input is not in the range',
}

export const TouchInputField: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <TouchInputFieldComponent
        id={args.id}
        value={value}
        type={args.type}
        max={args.max}
        min={args.min}
        placeholder={args.placeholder}
        disabled={args.disabled}
        caption={args.caption}
        error={args.error}
        autoFocus={args.autoFocus}
        readOnly={args.readOnly}
        tabIndex={args.tabIndex}
        textAlign={args.textAlign}
        size={args.size}
        borderRadius={args.borderRadius}
        padding={args.padding}
        hasBackgroundError={args.hasBackgroundError}
        label={args.title}
        onBlur={args.onBlur}
        onFocus={args.onFocus}
        onClick={args.onClick}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.units ? 'rem' : undefined}
      />
    </div>
  )
}

TouchInputField.args = {
  value: 200,
  type: 'number',
  title: 'example label',
  caption: 'example caption',
  max: 200,
  min: 10,
}

export const TouchInputFieldWithError: Story = args => {
  const [value, setValue] = React.useState(args.value)
  return (
    <div style={{ flexDirection: DIRECTION_COLUMN, gap: SPACING.spacing4 }}>
      <TouchInputFieldComponent
        id={args.id}
        value={value}
        type={args.type}
        max={args.max}
        min={args.min}
        placeholder={args.placeholder}
        disabled={args.disabled}
        caption={args.caption}
        error={args.error}
        autoFocus={args.autoFocus}
        readOnly={args.readOnly}
        tabIndex={args.tabIndex}
        textAlign={args.textAlign}
        size={args.size}
        borderRadius={args.borderRadius}
        padding={args.padding}
        hasBackgroundError={args.hasBackgroundError}
        label={args.title}
        onBlur={args.onBlur}
        onFocus={args.onFocus}
        onClick={args.onClick}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value)
        }}
        units={args.type !== 'number' ? undefined : args.units}
      />
    </div>
  )
}

TouchInputFieldWithError.args = {
  value: 300,
  type: 'number',
  title: 'example label',
  max: 200,
  min: 10,
  error: 'input is not in the range',
}
