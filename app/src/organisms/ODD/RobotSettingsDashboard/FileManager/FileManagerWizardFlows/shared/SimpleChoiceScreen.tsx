import { useTranslation } from 'react-i18next'

import { RadioButton, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'

import styles from './shared.module.css'

interface Choice {
  value: string
  label: string
}

interface SimpleChoiceScreenProps {
  question: string
  choices: Choice[]
  selected: string | null
  onSelect: (value: string) => void
  onContinue: () => void
}

export function SimpleChoiceScreen({
  question,
  choices,
  selected,
  onSelect,
  onContinue,
}: SimpleChoiceScreenProps): JSX.Element {
  const { t, i18n } = useTranslation('shared')

  return (
    <>
      <div className={styles.scrollable_content}>
        <StyledText oddStyle="level4HeaderSemiBold" className={styles.question}>
          {question}
        </StyledText>
        <div className={styles.button_list}>
          {choices.map(choice => (
            <RadioButton
              key={choice.value}
              buttonLabel={choice.label}
              buttonValue={choice.value}
              isSelected={selected === choice.value}
              onChange={e => {
                onSelect(e.target.value)
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
