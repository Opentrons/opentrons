import { useEffect, useId, useRef, useState } from 'react'

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
  validate?: (value: string) => string | null
  onBlur: (value: string) => void | Promise<void>
}

export function InputSetting({
  label,
  value,
  units,
  onBlur,
  placeholder,
  min,
  max,
  validate,
}: InputSettingProps): JSX.Element {
  const inputId = useId()
  const savedValueRef = useRef(value)
  const [inputValue, setInputValue] = useState(value)
  const [error, setError] = useState<string | null>(null)

  savedValueRef.current = value

  useEffect(() => {
    setInputValue(value)
    setError(null)
  }, [value])

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
          error={error}
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
            if (error != null) {
              setError(null)
            }
          }}
          onBlur={event => {
            const blurredValue = event.target.value
            const validationError = validate?.(blurredValue) ?? null
            setError(validationError)
            if (validationError == null) {
              void Promise.resolve(onBlur(blurredValue)).catch(() => {
                setInputValue(savedValueRef.current)
              })
            }
          }}
        />
      </div>
    </div>
  )
}
