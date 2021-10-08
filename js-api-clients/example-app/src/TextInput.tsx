import * as React from 'react'

export interface TextInputProps {
  onChange: (value: string) => unknown
  placeholder: string
  children?: React.ReactNode
}

export function TextInput(props: TextInputProps): JSX.Element {
  const { onChange, placeholder, children } = props
  const [value, setValue] = React.useState('')

  return (
    <form
      onSubmit={(event) => {
        onChange(value)
        event.preventDefault()
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit">{children}</button>
    </form>
  )
}
