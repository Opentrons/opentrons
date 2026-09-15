import { useRef, useState } from 'react'

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
  const inputElementRef = useRef<HTMLInputElement>(null)
  const keyboardRef = useRef<KeyboardReactInterface>(null)

  const handleBack = (): void => {
    onBack(currentValue)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
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
