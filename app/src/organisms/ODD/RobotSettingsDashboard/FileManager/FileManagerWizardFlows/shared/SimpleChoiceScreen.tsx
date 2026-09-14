import { useTranslation } from 'react-i18next'

import { RadioButton, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'

import styles from './shared.module.css'

import type { ReactNode } from 'react'

interface Choice<T> {
  value: T
  label: string
}

interface SimpleChoiceScreenProps<T> {
  question: string
  choices: Array<Choice<T>>
  selected: T | null
  onSelect: (value: T) => void
  onContinue: () => void
}

export function SimpleChoiceScreen<T>({
  question,
  choices,
  selected,
  onSelect,
  onContinue,
}: SimpleChoiceScreenProps<T>): ReactNode {
  const { t, i18n } = useTranslation('shared')

  return (
    <>
      <div className={styles.scrollable_content}>
        <StyledText oddStyle="level4HeaderSemiBold" className={styles.question}>
          {question}
        </StyledText>
        <div className={styles.button_list}>
          {choices.map((choice, index) => (
            <RadioButton
              key={index}
              buttonLabel={choice.label}
              buttonValue={String(choice.value)}
              isSelected={selected === choice.value}
              onChange={() => {
                onSelect(choice.value)
              }}
            />
          ))}
        </div>
      </div>
      <div className={styles.buttons}>
        <SmallButton
          buttonText={i18n.format(t('continue'), 'capitalize')}
          onClick={onContinue}
          disabled={selected == null}
        />
      </div>
    </>
  )
}
