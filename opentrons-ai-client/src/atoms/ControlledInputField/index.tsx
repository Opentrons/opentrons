import {
  DropdownBorder,
  DropdownMenu,
  DropdownOption,
  InputField,
} from '@opentrons/components'
import { Controller } from 'react-hook-form'

interface ControlledInputFieldProps {
  name: string
  rules?: any
  title?: string
  caption?: string
}

export function ControlledInputField({
  name,
  rules,
  title,
  caption,
}: ControlledInputFieldProps): JSX.Element {
  return (
    <Controller
      name={name}
      rules={rules}
      render={({ field }) => (
        <InputField
          title={title}
          caption={caption}
          id="otherApplication"
          name="otherApplication"
          type="text"
          onChange={field.onChange}
          value={field.value}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
