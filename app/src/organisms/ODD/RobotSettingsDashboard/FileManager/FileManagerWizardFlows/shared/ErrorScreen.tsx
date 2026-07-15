import { useTranslation } from 'react-i18next'

import { SmallButton } from '/app/atoms/buttons'
import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'

import styles from './filemanagerwizardshared.module.css'

interface ErrorScreenProps {
  subText: string
  onExit: () => void
}

export function ErrorScreen({ subText, onExit }: ErrorScreenProps): JSX.Element {
  const { t, i18n } = useTranslation('shared')

  return (
    <>
      <div className={styles.scrollable_content}>
        <OddInfoScreen
          type="error"
          header={i18n.format(t('something_went_wrong'), 'capitalize')}
          subText={subText}
        />
      </div>
      <div className={styles.buttons}>
        <SmallButton
          buttonText={i18n.format(t('exit'), 'capitalize')}
          onClick={onExit}
        />
      </div>
    </>
  )
}
