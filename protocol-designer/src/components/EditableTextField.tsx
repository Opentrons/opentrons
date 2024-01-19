// TODO: Ian 2018-10-30 if we like this, add it to components library
import * as React from 'react'
import { ClickOutside, Icon, InputField } from '@opentrons/components'
import styles from './editableTextField.css'

interface Props {
  className?: string
  value?: string | null
  saveEdit: (newValue: string) => unknown
}

export function EditableTextField(props: Props): JSX.Element {
  const { className, value, saveEdit } = props
  const [editing, setEditing] = React.useState<boolean>(false)
  const [transientValue, setTransientValue] = React.useState(value)

  const enterEditMode = (): void => {
    setEditing(true)
    setTransientValue(value)
  }
  const handleCancel = (): void => {
    setEditing(false)
    setTransientValue(value)
  }

  const handleKeyUp = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleSubmit = (): void => {
    setEditing(false)
    saveEdit(transientValue ?? '')
  }
  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault() // avoid 'form is not connected' warning
    handleSubmit()
  }

  const updateValue = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTransientValue(e.currentTarget.value)
  }
  if (editing) {
    return (
      <ClickOutside onClickOutside={handleSubmit}>
        {({ ref }) => (
          <form
            className={className}
            onKeyUp={handleKeyUp}
            onSubmit={handleFormSubmit}
            ref={ref}
          >
            <InputField
              autoFocus
              value={transientValue}
              onChange={updateValue}
              units={<Icon name="pencil" className={styles.edit_icon} />}
            />
          </form>
        )}
      </ClickOutside>
    )
  }

  return (
    <div onClick={enterEditMode} className={className}>
      <div className={styles.static_value}>{value}</div>
      <Icon name="pencil" className={styles.edit_icon_right} />
    </div>
  )
}
