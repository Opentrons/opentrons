import { useId, useState } from 'react'

import { COLORS, InputField, StyledText } from '@opentrons/components'

import styles from './inputsetting.module.css'

import type { JSX } from 'react'

export interface InputSettingProps {
  label: string
  value: string
  units?: string
  placeholder?: string
  min?: number
  max?: number
  onBlur: (value: string) => void
}

export function InputSetting({
  label,
  value,
  units,
  onBlur,
  placeholder,
  min,
  max,
}: InputSettingProps): JSX.Element {
  const inputId = useId()
  const [inputValue, setInputValue] = useState(value)

  return (
    <div className={styles.field_row}>
      <label htmlFor={inputId} className={styles.label}>
        <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      </label>
      <div className={styles.input}>
        <InputField
          id={inputId}
          type="number"
          value={inputValue}
          placeholder={placeholder}
          min={min}
          max={max}
          units={
            units != null ? (
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
              >
                {units}
              </StyledText>
            ) : undefined
          }
          onChange={event => {
            setInputValue(event.target.value)
          }}
          onBlur={event => {
            onBlur(event.target.value)
          }}
        />
      </div>
    </div>
  )
}
