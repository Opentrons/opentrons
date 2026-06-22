import { useId } from 'react'

import { StyledText } from '@opentrons/components'

import styles from './inputsetting.module.css'

import type { ChangeEventHandler, JSX } from 'react'

export interface InputSettingProps {
  label: string
  value: string
  units?: string
  placeholder?: string
  onChange: ChangeEventHandler<HTMLInputElement>
}

export function InputSetting({
  label,
  value,
  units,
  onChange,
  placeholder,
}: InputSettingProps): JSX.Element {
  const inputId = useId()

  return (
    <div className={styles.field_row}>
      <label htmlFor={inputId} className={styles.label}>
        <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      </label>
      <div className={styles.input}>
        <div className={styles.input_field}>
          <input
            id={inputId}
            type="number"
            className={styles.input_control}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            onWheel={event => {
              event.currentTarget.blur()
            }}
          />
          {units != null ? (
            <span className={styles.units}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.units_text}
              >
                {units}
              </StyledText>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
