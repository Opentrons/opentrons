import { DropdownMenu } from '@opentrons/components'
import type { DropdownBorder, DropdownOption } from '@opentrons/components'
import { Controller } from 'react-hook-form'

interface ControlledDropdownMenuProps {
  id?: string
  name: string
  rules?: any
  options: DropdownOption[]
  width?: string
  dropdownType?: DropdownBorder | undefined
  title?: string
  defaultOption?: string
  placeholder?: string
}

export function ControlledDropdownMenu({
  name,
  rules,
  options,
  width,
  dropdownType,
  title,
  defaultOption,
  placeholder = '',
}: ControlledDropdownMenuProps): JSX.Element {
  return (
    <Controller
      name={name}
      defaultValue={defaultOption}
      rules={rules}
      render={({ field }) => {
        const fieldValueName = options.find(
          option => option.value === field.value
        )?.name

        return (
          <DropdownMenu
            width={width}
            dropdownType={dropdownType}
            title={title}
            filterOptions={options}
            currentOption={{
              value: field.value ?? '',
              name: fieldValueName ?? placeholder,
            }}
            onClick={e => {
              field.onChange(e)
            }}
          />
        )
      }}
    />
  )
}
