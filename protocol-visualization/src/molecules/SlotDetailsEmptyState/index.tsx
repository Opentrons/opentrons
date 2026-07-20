import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { COLORS, RobotInfoLabel, StyledText } from '@opentrons/components'

import styles from './slotdetailsemptystate.module.css'

interface SlotDetailsEmptyStateProps {
  slotId: string
  headerPortalEl?: HTMLElement | null
}

export function SlotDetailsEmptyState(
  props: SlotDetailsEmptyStateProps
): JSX.Element {
  const { slotId, headerPortalEl } = props
  const { t } = useTranslation('protocol_visualization')
  const header = (
    <div className={styles.slot_empty_header}>
      <RobotInfoLabel deckLabel={slotId} />
    </div>
  )
  return (
    <div className={styles.slot_empty_container}>
      {headerPortalEl != null ? createPortal(header, headerPortalEl) : header}
      <div className={styles.slot_empty_body}>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey50}>
          {t('slot_empty')}
        </StyledText>
      </div>
    </div>
  )
}
