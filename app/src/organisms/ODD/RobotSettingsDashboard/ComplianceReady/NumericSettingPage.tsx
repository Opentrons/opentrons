import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText, TouchInputField } from '@opentrons/components'

import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard/NumericalKeyboard'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'

import type { ChangeEvent, ReactNode } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'

export function NumericSettingPage({
  title,
  description,
  value,
  label,
  caption,
  min,
  max,
  onBack,
}: {
  title: string
  description?: string
  value: number | undefined | null
  label: string
  caption?: string
  min?: number
  max?: number
  onBack: (value: number | undefined | null) => void
}): ReactNode {
  const [currentValue, setCurrentValue] = useState<number | undefined | null>(
    value
  )
  const [error, setError] = useState<string | undefined>(undefined)
  const inputElementRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<KeyboardReactInterface>(null)
  const { t } = useTranslation('device_settings')

  const handleBack = (): void => {
    if (currentValue == null) {
      setError(
        '' +
          t('value_is_required', {
            label: label.toLowerCase(),
          })
      )
      return
    }
    if (min != null && currentValue < min) {
      setError('' + t('minimum_value_is', { min }))
      return
    }
    if (max != null && currentValue > max) {
      setError('' + t('maximum_value_is', { max }))
      return
    }
    // max int in C lol
    if (currentValue > 2147483647) {
      setError(
        '' +
          t('maximum_value_is', {
            max: Math.min(2147483647, max ?? 2147483647),
          })
      )
      return
    }
    setError(undefined)
    onBack(currentValue)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setError(undefined)
    setCurrentValue(Number(event.target.value))
  }

  return (
    <div className={styles.container}>
      <ChildNavigation header={title} onClickBack={handleBack} />
      <div className={styles.numeric_settings_content}>
        <div className={styles.numeric_settings_left}>
          <StyledText oddStyle="level4HeaderRegular">{description}</StyledText>
          <TouchInputField
            type="number"
            value={currentValue}
            onChange={handleChange}
            ref={inputElementRef}
            autoFocus
            label={label}
            caption={caption}
            min={min}
            max={max}
            error={error}
          />
        </div>
        <div className={styles.numeric_settings_right}>
          <NumericalKeyboard
            keyboardRef={keyboardRef}
            inputElementRef={inputElementRef}
          />
        </div>
      </div>
    </div>
  )
}
