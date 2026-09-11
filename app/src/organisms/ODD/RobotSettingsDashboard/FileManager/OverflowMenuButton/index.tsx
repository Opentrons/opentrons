import { useTranslation } from 'react-i18next'

import { COLORS, Icon } from '@opentrons/components'

import styles from './overflowmenubutton.module.css'

import type { ReactNode } from 'react'

interface OverflowMenuButtonProps {
  onClick: () => void
}

export function OverflowMenuButton(props: OverflowMenuButtonProps): ReactNode {
  const { onClick } = props
  const { t } = useTranslation('device_details')

  return (
    <button
      type="button"
      className={styles.overflow_button}
      aria-label={t('overflow_menu_button')}
      onClick={onClick}
    >
      <Icon name="overflow-btn-touchscreen" color={COLORS.grey60} />
    </button>
  )
}
