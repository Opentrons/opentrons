import { useTranslation } from 'react-i18next'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'

import styles from './shared.module.css'

interface ErrorScreenProps {
  subText: string
  onExit: () => void
}

export function ErrorScreen({
  subText,
  onExit,
}: ErrorScreenProps): JSX.Element {
  const { t, i18n } = useTranslation('shared')

  return (
    <>
      <div className={styles.scrollable_content}>
        <OddInfoScreen
          type="error"
          header={i18n.format(t('something_went_wrong'), 'capitalize')}
          subText={subText}
          height="100%"
        />
      </div>
    </>
  )
}
