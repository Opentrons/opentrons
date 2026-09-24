import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import styles from './slotdetailsemptystate.module.css'

import type { ReactNode } from 'react'

export function SlotDetailsEmptyState(): ReactNode {
  const { t } = useTranslation('protocol_visualization')
  return (
    <div className={styles.slot_empty_container}>
      <div className={styles.slot_empty_body}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey50}>
          {t('slot_empty')}
        </StyledText>
      </div>
    </div>
  )
}
