import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, InputField, StyledText } from '@opentrons/components'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { parseNumericalInput } from '/app/organisms/ODD/utils/parseNumericalInput'

import styles from './inputsetting.module.css'

import type { JSX } from 'react'

export interface InputSettingProps {
  label: string
  value: string
  units?: string
  placeholder?: string
  min: number
  max: number
  onBlur: (value: number) => void | Promise<void>
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
  const savedValueRef = useRef(value)
  const [inputValue, setInputValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation('device_settings')

  const validate = (
    value: string
  ):
    | { result: 'success'; data: number }
    | { result: 'error'; error: string }
    | { result: 'empty' } => {
    const result = parseNumericalInput(value, {
      allowNegative: false,
      allowDecimal: false,
      min,
      max,
    })
    switch (result.result) {
      case 'success':
        return { result: 'success', data: result.data }
      case 'rangeError':
        return {
          result: 'error',
          error:
            result.type === 'min'
              ? t('desktop_minimum_settings_error', { min, units })
              : t('desktop_maximum_settings_error', { max, units }),
        }
      default:
        return { result: 'error', error: t('desktop_syntax_settings_error') }
    }
  }

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
          size="small"
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
            setError(null)
          }}
          onBlur={event => {
            const blurredValue = event.target.value
            const validation = validate(blurredValue)
            switch (validation.result) {
              case 'success':
                setInputValue(String(validation.data))
                void Promise.resolve(onBlur(validation.data)).catch(() => {
                  setInputValue(savedValueRef.current)
                })
                break
              case 'error':
                setError(validation.error)
            }
          }}
          width="4.9375rem"
          inputWidth="default"
          alignItems="flex-end"
        />
      </div>
    </div>
  )
}
