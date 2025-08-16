import { useTranslation } from 'react-i18next'

import { COLORS, Icon } from '@opentrons/components'

import styles from './actioncard.module.css'

interface ActionCardProps {
  titleKey: string
  descriptionKey: string
  linkKey: string
  onClick: () => void
}

export function ActionCard({
  titleKey,
  descriptionKey,
  linkKey,
  onClick,
}: ActionCardProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')

  const handleClick = (): void => {
    onClick()
  }

  return (
    <div className={styles.action_card}>
      <h3 className={styles.card_title}>{t(titleKey)}</h3>
      <p className={styles.card_description}>{t(descriptionKey)}</p>
      <button className={styles.card_link} onClick={handleClick}>
        {t(linkKey)}
        <span className={styles.card_link_icon}>
          <Icon
            name="menu-down-pd"
            size="1.5rem"
            color={COLORS.blue50}
            data-testid="ActionCard_Icon"
          />
        </span>
      </button>
    </div>
  )
}
