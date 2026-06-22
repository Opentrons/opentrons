import { useId } from 'react'

import { COLORS, InputField, StyledText } from '@opentrons/components'

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
        <InputField
          id={inputId}
          type="number"
          value={value}
          placeholder={placeholder}
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
          onChange={onChange}
        />
      </div>
    </div>
  )
}
