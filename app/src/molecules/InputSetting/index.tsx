import { COLORS, InputField, StyledText } from '@opentrons/components'

import styles from './inputsetting.module.css'

import type { ChangeEventHandler, JSX } from 'react'

export interface InputSettingProps {
  id: string
  label: string
  value: string
  units?: string
  placeholder?: string
  onChange: ChangeEventHandler<HTMLInputElement>
}

export function InputSetting({
  id,
  label,
  value,
  units,
  onChange,
  placeholder,
}: InputSettingProps): JSX.Element {
  return (
    <div className={styles.field_row}>
      <label htmlFor={id} className={styles.label}>
        <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
      </label>
      <div className={styles.input}>
        <InputField
          id={id}
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
