import { InputField } from '@opentrons/components'
import { Controller } from 'react-hook-form'

interface ControlledInputFieldProps {
  id?: string
  name: string
  rules?: any
  title?: string
  caption?: string
}

export function ControlledInputField({
  id,
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
          id={id}
          name={name}
          type="text"
          onChange={field.onChange}
          value={field.value}
          onBlur={field.onBlur}
        />
      )}
    />
  )
}
